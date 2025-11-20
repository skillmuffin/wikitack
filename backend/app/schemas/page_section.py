from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

SectionType = Literal["paragraph", "picture", "snippet", "info", "warning", "error"]


class PageSectionBase(BaseModel):
    """Shared fields for page sections."""

    section_type: SectionType
    position: int
    header: str | None = None
    text: str | None = None
    media_url: str | None = None
    caption: str | None = None
    code: str | None = None
    language: str | None = None

    @field_validator("position")
    @classmethod
    def validate_position(cls, value: int) -> int:
        if value < 0:
            raise ValueError("position must be zero or positive")
        return value

    @model_validator(mode="after")
    def validate_by_type(self):
        if self.section_type == "paragraph":
            if not (self.header or self.text):
                raise ValueError("paragraph sections require header or text")
        elif self.section_type == "picture":
            if not self.media_url:
                raise ValueError("picture sections require media_url")
        elif self.section_type == "snippet":
            if not self.code:
                raise ValueError("snippet sections require code")
            if not self.language:
                raise ValueError("snippet sections require language")
        elif self.section_type in {"info", "warning", "error"}:
            if not self.text:
                raise ValueError(f"{self.section_type} sections require text")
        return self


class PageSectionCreate(PageSectionBase):
    """Payload for creating a section."""
    pass


class PageSectionUpdate(BaseModel):
    """Payload for updating a section."""

    section_type: SectionType | None = None
    position: int | None = None
    header: str | None = None
    text: str | None = None
    media_url: str | None = None
    caption: str | None = None
    code: str | None = None
    language: str | None = None

    @field_validator("position")
    @classmethod
    def validate_position(cls, value: int | None) -> int | None:
        if value is not None and value < 0:
            raise ValueError("position must be zero or positive")
        return value

    @model_validator(mode="after")
    def validate_partial(self):
        if self.section_type:
            temporal = PageSectionBase(
                section_type=self.section_type,
                position=self.position or 0,
                header=self.header,
                text=self.text,
                media_url=self.media_url,
                caption=self.caption,
                code=self.code,
                language=self.language,
            )
            temporal.validate_by_type()
        return self


class PageSection(PageSectionBase):
    """Section as returned to clients."""

    id: int
    page_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
