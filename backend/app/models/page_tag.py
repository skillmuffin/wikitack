from sqlalchemy import ForeignKey, Table, Column, BigInteger

from app.db.session import Base

# Many-to-many association table between pages and tags
page_tags = Table(
    "page_tags",
    Base.metadata,
    Column("page_id", BigInteger, ForeignKey("pages.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", BigInteger, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)
