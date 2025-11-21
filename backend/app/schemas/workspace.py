from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


# WorkspaceMember schemas
class WorkspaceMemberBase(BaseModel):
    role: str = Field(default="member", pattern="^(owner|admin|member|viewer)$")


class WorkspaceMemberCreate(WorkspaceMemberBase):
    user_id: int
    workspace_id: int


class WorkspaceMemberUpdate(BaseModel):
    role: str | None = Field(default=None, pattern="^(owner|admin|member|viewer)$")


class WorkspaceMemberInvite(BaseModel):
    email: str
    role: str = Field(default="member", pattern="^(admin|member|viewer)$")


class WorkspaceMember(WorkspaceMemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class WorkspaceMemberWithUser(WorkspaceMember):
    model_config = ConfigDict(from_attributes=True)

    username: str
    email: str | None = None
    display_name: str | None = None


# Workspace schemas
class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255, pattern="^[a-z0-9-]+$")
    description: str | None = None


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


class Workspace(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime


class WorkspaceWithMembers(Workspace):
    model_config = ConfigDict(from_attributes=True)

    member_count: int = 0
    space_count: int = 0
