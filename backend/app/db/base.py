"""Import all models here for Alembic to detect them."""

from app.db.session import Base

# Import models here so SQLAlchemy can detect them
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.space import Space
from app.models.page import Page
from app.models.revision import Revision
from app.models.tag import Tag
from app.models.page_section import PageSection
from app.models.page_tag import page_tags

__all__ = ["Base", "User", "Workspace", "WorkspaceMember", "Space", "Page", "Revision", "Tag", "PageSection", "page_tags"]
