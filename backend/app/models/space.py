from sqlalchemy import Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.session import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.page import Page
    from app.models.workspace import Workspace


class Space(Base, TimestampMixin):
    """Space model for wiki workspaces - belongs to a Workspace."""

    __tablename__ = "spaces"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="spaces")
    owner: Mapped["User"] = relationship("User", back_populates="owned_spaces", foreign_keys=[owner_id])
    pages: Mapped[list["Page"]] = relationship("Page", back_populates="space", cascade="all, delete-orphan")
