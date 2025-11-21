from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.session import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.workspace_member import WorkspaceMember
    from app.models.space import Space
    from app.models.page import Page
    from app.models.revision import Revision


class User(Base, TimestampMixin):
    """User model for wiki contributors."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    display_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    owned_workspaces: Mapped[list["Workspace"]] = relationship(
        "Workspace", back_populates="owner", foreign_keys="Workspace.owner_id"
    )
    workspace_memberships: Mapped[list["WorkspaceMember"]] = relationship(
        "WorkspaceMember", back_populates="user"
    )
    owned_spaces: Mapped[list["Space"]] = relationship(
        "Space", back_populates="owner", foreign_keys="Space.owner_id"
    )
    created_pages: Mapped[list["Page"]] = relationship(
        "Page", back_populates="creator", foreign_keys="Page.created_by"
    )
    updated_pages: Mapped[list["Page"]] = relationship(
        "Page", back_populates="updater", foreign_keys="Page.updated_by"
    )
    revisions: Mapped[list["Revision"]] = relationship(
        "Revision", back_populates="editor"
    )
