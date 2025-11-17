from sqlalchemy import Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.sql import func
from typing import TYPE_CHECKING

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.page import Page


class Tag(Base):
    """Tag model for categorizing pages."""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    slug: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    pages: Mapped[list["Page"]] = relationship("Page", secondary="page_tags", back_populates="tags")
