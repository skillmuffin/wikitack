from sqlalchemy import ForeignKey, Text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.session import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.space import Space
    from app.models.workspace_member import WorkspaceMember


class Workspace(Base, TimestampMixin):
    """Workspace model - top-level container for spaces and collaboration."""

    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="owned_workspaces", foreign_keys=[owner_id])
    spaces: Mapped[list["Space"]] = relationship("Space", back_populates="workspace", cascade="all, delete-orphan")
    members: Mapped[list["WorkspaceMember"]] = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
