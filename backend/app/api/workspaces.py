import os
import smtplib
from email.message import EmailMessage
from ssl import create_default_context

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.deps import get_db, get_current_active_user
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.user import User
from app.schemas.workspace import (
    Workspace as WorkspaceSchema,
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceWithMembers,
    WorkspaceMember as WorkspaceMemberSchema,
    WorkspaceMemberInvite,
    WorkspaceMemberUpdate,
    WorkspaceMemberWithUser,
)

router = APIRouter()


def _send_invite_email(to_email: str, workspace_name: str, inviter_email: str | None = None) -> bool:
    """Send a simple invitation email via SMTP if settings are present."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    from_email = os.getenv("INVITE_FROM_EMAIL") or smtp_user

    if not (smtp_host and smtp_user and smtp_pass and from_email):
        # Missing config; skip sending but do not block
        return False

    msg = EmailMessage()
    msg["Subject"] = f"You've been invited to join workspace '{workspace_name}'"
    msg["From"] = from_email
    msg["To"] = to_email
    body = [
        f"You have been invited to collaborate in the '{workspace_name}' workspace.",
        "",
        "Sign in or create an account to accept the invite.",
    ]
    if inviter_email:
        body.insert(1, f"Invited by: {inviter_email}")
    msg.set_content("\n".join(body))

    context = create_default_context()
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
          server.starttls(context=context)
          server.login(smtp_user, smtp_pass)
          server.send_message(msg)
        return True
    except Exception:
        return False


@router.post("/", response_model=WorkspaceSchema, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_in: WorkspaceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new workspace. The creator becomes the owner."""

    # Check if slug already exists
    result = await db.execute(select(Workspace).where(Workspace.slug == workspace_in.slug))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace with this slug already exists",
        )

    # Create workspace
    workspace = Workspace(
        **workspace_in.model_dump(),
        owner_id=current_user.id,
    )
    db.add(workspace)
    await db.flush()

    # Add owner as a member with 'owner' role
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="owner",
    )
    db.add(member)

    await db.commit()
    await db.refresh(workspace)

    return workspace


@router.get("/", response_model=list[WorkspaceWithMembers])
async def list_workspaces(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces the user is a member of."""

    # Get workspaces where user is a member
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember)
        .where(WorkspaceMember.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .options(selectinload(Workspace.members))
        .options(selectinload(Workspace.spaces))
    )
    workspaces = result.scalars().all()

    # Build response with counts
    workspace_list = []
    for workspace in workspaces:
        workspace_dict = WorkspaceSchema.model_validate(workspace).model_dump()
        workspace_dict["member_count"] = len(workspace.members)
        workspace_dict["space_count"] = len(workspace.spaces)
        workspace_list.append(WorkspaceWithMembers(**workspace_dict))

    return workspace_list


@router.get("/{workspace_id}", response_model=WorkspaceWithMembers)
async def get_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific workspace."""

    # Check if user is a member
    result = await db.execute(
        select(Workspace)
        .where(Workspace.id == workspace_id)
        .options(selectinload(Workspace.members))
        .options(selectinload(Workspace.spaces))
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check membership
    is_member = any(m.user_id == current_user.id for m in workspace.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")

    workspace_dict = WorkspaceSchema.model_validate(workspace).model_dump()
    workspace_dict["member_count"] = len(workspace.members)
    workspace_dict["space_count"] = len(workspace.spaces)

    return WorkspaceWithMembers(**workspace_dict)


@router.patch("/{workspace_id}", response_model=WorkspaceSchema)
async def update_workspace(
    workspace_id: int,
    workspace_in: WorkspaceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a workspace. Only owner and admins can update."""

    result = await db.execute(
        select(Workspace)
        .where(Workspace.id == workspace_id)
        .options(selectinload(Workspace.members))
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user is owner or admin
    user_member = next((m for m in workspace.members if m.user_id == current_user.id), None)
    if not user_member or user_member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Update workspace
    update_data = workspace_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workspace, field, value)

    await db.commit()
    await db.refresh(workspace)

    return workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a workspace. Only owner can delete."""

    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can delete the workspace")

    await db.delete(workspace)
    await db.commit()


# Workspace Members endpoints
@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberWithUser])
async def list_workspace_members(
    workspace_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a workspace."""

    # Check if user is a member
    result = await db.execute(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .options(selectinload(WorkspaceMember.user))
    )
    members = result.scalars().all()

    if not any(m.user_id == current_user.id for m in members):
        raise HTTPException(status_code=403, detail="Not a member of this workspace")

    # Build response with user info
    members_list = []
    for member in members:
        member_dict = WorkspaceMemberSchema.model_validate(member).model_dump()
        member_dict["username"] = member.user.username
        member_dict["email"] = member.user.email
        member_dict["display_name"] = member.user.display_name
        members_list.append(WorkspaceMemberWithUser(**member_dict))

    return members_list


@router.post("/{workspace_id}/invite", response_model=WorkspaceMemberSchema, status_code=status.HTTP_201_CREATED)
async def invite_member(
    workspace_id: int,
    invite: WorkspaceMemberInvite,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite a user to the workspace by email."""

    # Check if workspace exists and user is admin/owner
    result = await db.execute(
        select(Workspace)
        .where(Workspace.id == workspace_id)
        .options(selectinload(Workspace.members))
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if current user is owner or admin
    user_member = next((m for m in workspace.members if m.user_id == current_user.id), None)
    if not user_member or user_member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owners and admins can invite members")

    # Find user by email
    result = await db.execute(select(User).where(User.email == invite.email))
    invited_user = result.scalar_one_or_none()

    if not invited_user:
        # Attempt to send invitation email if SMTP is configured
        email_sent = _send_invite_email(invite.email, workspace.name, current_user.email)
        detail = (
            "Invitation email sent to non-enrolled user"
            if email_sent
            else "Invite queued (email not sent; SMTP not configured)"
        )
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={"detail": detail},
        )

    # Check if already a member
    result = await db.execute(
        select(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == invited_user.id,
        )
    )
    existing_member = result.scalar_one_or_none()

    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member")

    # Create membership
    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=invited_user.id,
        role=invite.role,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    # Notify existing user they were added (best effort)
    _send_invite_email(invite.email, workspace.name, current_user.email)

    return member


@router.patch("/{workspace_id}/members/{user_id}", response_model=WorkspaceMemberSchema)
async def update_member_role(
    workspace_id: int,
    user_id: int,
    member_update: WorkspaceMemberUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a member's role. Only owner and admins can update roles."""

    # Get workspace and members
    result = await db.execute(
        select(Workspace)
        .where(Workspace.id == workspace_id)
        .options(selectinload(Workspace.members))
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if current user is owner or admin
    user_member = next((m for m in workspace.members if m.user_id == current_user.id), None)
    if not user_member or user_member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Get target member
    result = await db.execute(
        select(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Can't change owner role
    if member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot change owner role")

    # Update role
    if member_update.role:
        member.role = member_update.role

    await db.commit()
    await db.refresh(member)

    return member


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    workspace_id: int,
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the workspace."""

    # Get workspace and members
    result = await db.execute(
        select(Workspace)
        .where(Workspace.id == workspace_id)
        .options(selectinload(Workspace.members))
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Get target member
    result = await db.execute(
        select(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Can't remove owner
    if member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove workspace owner")

    # Users can remove themselves, or owner/admin can remove others
    if user_id == current_user.id:
        # User removing themselves
        pass
    else:
        # Check if current user is owner or admin
        user_member = next((m for m in workspace.members if m.user_id == current_user.id), None)
        if not user_member or user_member.role not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

    await db.delete(member)
    await db.commit()
