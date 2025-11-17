from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.user import User
    from app.schemas.tag import Tag
    from app.schemas.space import Space as SpaceType
    from app.schemas.page_section import PageSection as SectionType
    from app.schemas.page_section import PageSectionCreate


class PageBase(BaseModel):
    """Base page schema."""
    slug: str
    title: str
    content: str | None = None


class PageCreate(PageBase):
    """Schema for creating a new page."""
    space_id: int
    created_by: int
    tag_ids: list[int] = []
    sections: list["PageSectionCreate"] = []


class PageUpdate(BaseModel):
    """Schema for updating a page."""
    title: str | None = None
    content: str | None = None
    updated_by: int | None = None
    is_deleted: bool | None = None
    tag_ids: list[int] | None = None
    sections: list["PageSectionCreate"] | None = None


class Page(PageBase):
    """Schema for page response."""
    id: int
    space_id: int
    created_by: int
    updated_by: int | None = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    sections: list["SectionType"] = []

    model_config = ConfigDict(from_attributes=True)


class PageWithDetails(Page):
    """Schema for page with creator, updater, and tags."""
    creator: "User"
    updater: "User | None" = None
    space: "SpaceType"
    tags: list["Tag"] = []

    model_config = ConfigDict(from_attributes=True)
