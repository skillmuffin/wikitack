from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db, get_current_active_user
from app.models.space import Space as SpaceModel
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.schemas.space import Space, SpaceCreate, SpaceUpdate, SpaceWithOwner

router = APIRouter(prefix="/spaces", tags=["spaces"])


async def check_workspace_membership(
    workspace_id: int,
    user_id: int,
    db: AsyncSession,
    required_roles: list[str] = None
) -> WorkspaceMember:
    """Check if user is a member of the workspace with required role."""
    result = await db.execute(
        select(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id
        )
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this workspace"
        )

    if required_roles and member.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required roles: {', '.join(required_roles)}"
        )

    return member


@router.get("/", response_model=list[Space])
async def list_spaces(
    workspace_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all spaces in a workspace (requires membership)."""
    # Check if user is a member
    await check_workspace_membership(workspace_id, current_user.id, db)

    # Get spaces
    result = await db.execute(
        select(SpaceModel)
        .where(SpaceModel.workspace_id == workspace_id)
        .offset(skip)
        .limit(limit)
    )
    spaces = result.scalars().all()
    return spaces


@router.get("/slug/{slug}", response_model=SpaceWithOwner)
async def get_space_by_slug(
    slug: str,
    workspace_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific space by slug (requires workspace membership)."""
    # Check workspace membership first
    await check_workspace_membership(workspace_id, current_user.id, db)

    # Get space by slug and workspace
    result = await db.execute(
        select(SpaceModel)
        .options(selectinload(SpaceModel.owner))
        .where(
            SpaceModel.workspace_id == workspace_id,
            SpaceModel.slug == slug
        )
    )
    space = result.scalar_one_or_none()

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with slug '{slug}' not found in this workspace"
        )

    return space


@router.get("/{space_id}", response_model=SpaceWithOwner)
async def get_space(
    space_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific space by ID (requires workspace membership)."""
    result = await db.execute(
        select(SpaceModel)
        .options(selectinload(SpaceModel.owner))
        .where(SpaceModel.id == space_id)
    )
    space = result.scalar_one_or_none()

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {space_id} not found"
        )

    # Check workspace membership
    await check_workspace_membership(space.workspace_id, current_user.id, db)

    return space


@router.post("/", response_model=Space, status_code=status.HTTP_201_CREATED)
async def create_space(
    space_in: SpaceCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new space in a workspace (requires member, admin, or owner role)."""
    # Check workspace membership (members can create spaces)
    await check_workspace_membership(
        space_in.workspace_id,
        current_user.id,
        db,
        required_roles=["owner", "admin", "member"]
    )

    # Check if slug already exists in this workspace
    result = await db.execute(
        select(SpaceModel).where(
            SpaceModel.workspace_id == space_in.workspace_id,
            SpaceModel.slug == space_in.slug
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A space with slug '{space_in.slug}' already exists in this workspace"
        )

    # Create space
    space_data = space_in.model_dump()
    space = SpaceModel(
        **space_data,
        owner_id=current_user.id  # Set current user as owner
    )
    db.add(space)
    await db.commit()
    await db.refresh(space)

    return space


@router.patch("/{space_id}", response_model=Space)
async def update_space(
    space_id: int,
    space_in: SpaceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a space (requires owner, admin role, or being the space owner)."""
    result = await db.execute(select(SpaceModel).where(SpaceModel.id == space_id))
    space = result.scalar_one_or_none()

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {space_id} not found"
        )

    # Check if user is workspace admin/owner or space owner
    member = await check_workspace_membership(space.workspace_id, current_user.id, db)

    if member.role not in ["owner", "admin"] and space.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace admins/owners or the space owner can update this space"
        )

    # Update space
    update_data = space_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(space, field, value)

    await db.commit()
    await db.refresh(space)

    return space


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_space(
    space_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a space and all its pages (requires owner/admin role or being space owner)."""
    result = await db.execute(select(SpaceModel).where(SpaceModel.id == space_id))
    space = result.scalar_one_or_none()

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {space_id} not found"
        )

    # Check if user is workspace admin/owner or space owner
    member = await check_workspace_membership(space.workspace_id, current_user.id, db)

    if member.role not in ["owner", "admin"] and space.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace admins/owners or the space owner can delete this space"
        )

    await db.delete(space)
    await db.commit()

    return None
