from sqlalchemy import ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.sql import func
from typing import TYPE_CHECKING

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.page import Page
    from app.models.user import User


class Revision(Base):
    """Revision model for page version history."""

    __tablename__ = "revisions"
    __table_args__ = (
        UniqueConstraint("page_id", "revision_number", name="uq_revisions_page_rev"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    editor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    page: Mapped["Page"] = relationship("Page", back_populates="revisions")
    editor: Mapped["User"] = relationship("User", back_populates="revisions")
