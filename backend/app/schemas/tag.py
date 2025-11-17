from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TagBase(BaseModel):
    """Base tag schema."""
    name: str
    slug: str | None = None


class TagCreate(TagBase):
    """Schema for creating a new tag."""
    pass


class TagUpdate(BaseModel):
    """Schema for updating a tag."""
    name: str | None = None
    slug: str | None = None


class Tag(TagBase):
    """Schema for tag response."""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
