from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.user import User


class RevisionBase(BaseModel):
    """Base revision schema."""
    title: str
    content: str


class RevisionCreate(RevisionBase):
    """Schema for creating a new revision."""
    page_id: int
    editor_id: int
    revision_number: int


class Revision(RevisionBase):
    """Schema for revision response."""
    id: int
    page_id: int
    revision_number: int
    editor_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RevisionWithEditor(Revision):
    """Schema for revision with editor details."""
    editor: "User"

    model_config = ConfigDict(from_attributes=True)
