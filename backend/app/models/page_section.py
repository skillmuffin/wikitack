from sqlalchemy import ForeignKey, Text, UniqueConstraint, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.session import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.page import Page


class PageSection(Base, TimestampMixin):
    """Structured content section belonging to a page."""

    __tablename__ = "page_sections"
    __table_args__ = (
        UniqueConstraint("page_id", "position", name="uq_page_sections_page_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    section_type: Mapped[str] = mapped_column(String(32), nullable=False)
    header: Mapped[str | None] = mapped_column(Text, nullable=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    code: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Relationships
    page: Mapped["Page"] = relationship("Page", back_populates="sections")
