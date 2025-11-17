from app.schemas.user import User, UserCreate, UserUpdate, UserInDB
from app.schemas.tag import Tag, TagCreate, TagUpdate
from app.schemas.space import Space, SpaceCreate, SpaceUpdate, SpaceWithOwner
from app.schemas.page import Page, PageCreate, PageUpdate, PageWithDetails
from app.schemas.revision import Revision, RevisionCreate, RevisionWithEditor
from app.schemas.page_section import PageSection, PageSectionCreate, PageSectionUpdate
from app.schemas.auth import Token, GoogleAuthURL, GoogleCallback

# Rebuild models to resolve forward references with proper namespace
SpaceWithOwner.model_rebuild(_types_namespace={"User": User})
Page.model_rebuild(_types_namespace={"SectionType": PageSection})
PageCreate.model_rebuild(_types_namespace={"PageSectionCreate": PageSectionCreate})
PageUpdate.model_rebuild(_types_namespace={"PageSectionCreate": PageSectionCreate})
PageWithDetails.model_rebuild(
    _types_namespace={"User": User, "SpaceType": Space, "Tag": Tag, "SectionType": PageSection, "PageSectionCreate": PageSectionCreate}
)
RevisionWithEditor.model_rebuild(_types_namespace={"User": User})

__all__ = [
    "User", "UserCreate", "UserUpdate", "UserInDB",
    "Space", "SpaceCreate", "SpaceUpdate", "SpaceWithOwner",
    "Page", "PageCreate", "PageUpdate", "PageWithDetails",
    "Revision", "RevisionCreate", "RevisionWithEditor",
    "Tag", "TagCreate", "TagUpdate",
    "PageSection", "PageSectionCreate", "PageSectionUpdate",
    "Token", "GoogleAuthURL", "GoogleCallback",
]
