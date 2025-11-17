from sqlalchemy import Boolean, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.session import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.space import Space
    from app.models.revision import Revision
    from app.models.tag import Tag
    from app.models.page_section import PageSection


class Page(Base, TimestampMixin):
    """Wiki page model."""

    __tablename__ = "pages"
    __table_args__ = (
        UniqueConstraint("space_id", "slug", name="uq_pages_space_slug"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    space_id: Mapped[int] = mapped_column(ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    space: Mapped["Space"] = relationship("Space", back_populates="pages")
    creator: Mapped["User"] = relationship("User", back_populates="created_pages", foreign_keys=[created_by])
    updater: Mapped["User"] = relationship("User", back_populates="updated_pages", foreign_keys=[updated_by])
    revisions: Mapped[list["Revision"]] = relationship("Revision", back_populates="page", cascade="all, delete-orphan")
    tags: Mapped[list["Tag"]] = relationship("Tag", secondary="page_tags", back_populates="pages")
    sections: Mapped[list["PageSection"]] = relationship(
        "PageSection",
        back_populates="page",
        cascade="all, delete-orphan",
        order_by="PageSection.position",
    )
