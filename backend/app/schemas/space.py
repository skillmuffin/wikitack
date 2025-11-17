from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.user import User


class SpaceBase(BaseModel):
    """Base space schema."""
    name: str
    slug: str
    description: str | None = None
    is_private: bool = False


class SpaceCreate(SpaceBase):
    """Schema for creating a new space."""
    owner_id: int


class SpaceUpdate(BaseModel):
    """Schema for updating a space."""
    name: str | None = None
    description: str | None = None
    is_private: bool | None = None


class Space(SpaceBase):
    """Schema for space response."""
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SpaceWithOwner(Space):
    """Schema for space with owner details."""
    owner: "User"

    model_config = ConfigDict(from_attributes=True)
