from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, delete, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models import Page as PageModel, Space as SpaceModel, User as UserModel, Tag as TagModel, PageSection as PageSectionModel
from app.models import Revision as RevisionModel
from app.schemas import Page, PageCreate, PageUpdate, PageWithDetails, PageSectionCreate

router = APIRouter(prefix="/pages", tags=["pages"])


def _sections_to_text(sections: list[PageSectionCreate]) -> str:
    """Build a plain-text fallback string from structured sections."""
    parts: list[str] = []
    for section in sections:
        if section.section_type == "paragraph":
            if section.header:
                parts.append(section.header)
            if section.text:
                parts.append(section.text)
        elif section.section_type in {"info", "warning"}:
            if section.text:
                parts.append(section.text)
        elif section.section_type == "snippet":
            if section.caption:
                parts.append(section.caption)
            if section.code:
                parts.append(section.code)
        elif section.section_type == "picture":
            desc = section.caption or section.media_url or ""
            if desc:
                parts.append(desc)
    return "\n\n".join(parts).strip()


def _build_sections_for_page(page: PageModel, sections: list[PageSectionCreate]) -> None:
    """Replace the page's sections with the provided collection."""
    page.sections = [
        PageSectionModel(
            position=section.position,
            section_type=section.section_type,
            header=section.header,
            text=section.text,
            media_url=section.media_url,
            caption=section.caption,
            code=section.code,
            language=section.language,
        )
        for section in sorted(sections, key=lambda s: s.position)
    ]


@router.get("/", response_model=list[PageWithDetails])
async def list_pages(
    skip: int = 0,
    limit: int = 100,
    space_id: int | None = None,
    include_deleted: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Get a list of all pages."""
    query = select(PageModel)

    if space_id:
        query = query.where(PageModel.space_id == space_id)

    if not include_deleted:
        query = query.where(PageModel.is_deleted == False)

    query = query.options(
        selectinload(PageModel.creator),
        selectinload(PageModel.updater),
        selectinload(PageModel.space),
        selectinload(PageModel.tags),
        selectinload(PageModel.sections),
    )
    result = await db.execute(query.offset(skip).limit(limit))
    pages = result.scalars().all()
    return pages


@router.get("/{page_id}", response_model=PageWithDetails)
async def get_page(
    page_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific page by ID with full details."""
    result = await db.execute(
        select(PageModel)
        .options(
            selectinload(PageModel.creator),
            selectinload(PageModel.updater),
            selectinload(PageModel.space),
            selectinload(PageModel.tags),
            selectinload(PageModel.sections),
        )
        .where(PageModel.id == page_id)
    )
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page with id {page_id} not found"
        )

    return page


@router.get("/space/{space_id}/slug/{slug}", response_model=PageWithDetails)
async def get_page_by_space_and_slug(
    space_id: int,
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific page by space ID and slug."""
    result = await db.execute(
        select(PageModel)
        .options(
            selectinload(PageModel.creator),
            selectinload(PageModel.updater),
            selectinload(PageModel.space),
            selectinload(PageModel.tags),
            selectinload(PageModel.sections),
        )
        .where(PageModel.space_id == space_id, PageModel.slug == slug)
    )
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page with slug {slug} not found in space {space_id}"
        )

    return page


@router.post("/", response_model=Page, status_code=status.HTTP_201_CREATED)
async def create_page(
    page_in: PageCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new page."""
    # Check if page with same slug exists in this space
    result = await db.execute(
        select(PageModel).where(
            PageModel.space_id == page_in.space_id,
            PageModel.slug == page_in.slug
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page with this slug already exists in this space"
        )

    # Verify space exists
    result = await db.execute(
        select(SpaceModel).where(SpaceModel.id == page_in.space_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {page_in.space_id} not found"
        )

    # Verify creator exists
    result = await db.execute(
        select(UserModel).where(UserModel.id == page_in.created_by)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {page_in.created_by} not found"
        )

    # Create page
    page_data = page_in.model_dump(exclude={"tag_ids", "sections"}, exclude_none=True)

    # Ensure we keep a text fallback for older clients/revisions
    if not page_data.get("content") and page_in.sections:
        page_data["content"] = _sections_to_text(page_in.sections)
    if "content" not in page_data or page_data["content"] is None:
        page_data["content"] = ""

    page = PageModel(**page_data)

    # Add tags if provided
    if page_in.tag_ids:
        result = await db.execute(
            select(TagModel).where(TagModel.id.in_(page_in.tag_ids))
        )
        tags = result.scalars().all()
        page.tags = list(tags)

    # Add structured sections if provided
    if page_in.sections:
        _build_sections_for_page(page, page_in.sections)

    db.add(page)
    await db.commit()

    # Create initial revision
    revision = RevisionModel(
        page_id=page.id,
        revision_number=1,
        title=page.title,
        content=page.content,
        editor_id=page.created_by,
    )
    db.add(revision)
    await db.commit()

    # Reload with relationships loaded to avoid lazy IO during response serialization
    result = await db.execute(
        select(PageModel)
        .options(selectinload(PageModel.sections), selectinload(PageModel.tags))
        .where(PageModel.id == page.id)
    )
    page = result.scalar_one()

    return page


@router.patch("/{page_id}", response_model=Page)
async def update_page(
    page_id: int,
    page_in: PageUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a page and create a new revision."""
    result = await db.execute(
        select(PageModel)
        .options(
            selectinload(PageModel.revisions),
            selectinload(PageModel.sections),
        )
        .where(PageModel.id == page_id)
    )
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page with id {page_id} not found"
        )

    # Track if content changed for revision creation
    content_changed = False
    update_data = page_in.model_dump(exclude_unset=True, exclude={"tag_ids", "sections"})

    # Update tags if provided
    if page_in.tag_ids is not None:
        result = await db.execute(
            select(TagModel).where(TagModel.id.in_(page_in.tag_ids))
        )
        tags = result.scalars().all()
        page.tags = list(tags)

    # Replace sections if provided
    if page_in.sections is not None:
        # Remove existing sections to avoid PK/unique conflicts, then add fresh ones
        await db.execute(delete(PageSectionModel).where(PageSectionModel.page_id == page.id))
        await db.flush()
        await db.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('page_sections','id'), "
                "(SELECT COALESCE(MAX(id), 0) + 1 FROM page_sections), false)"
            )
        )
        _build_sections_for_page(page, page_in.sections)
        # If caller didn't set content explicitly, derive a fallback for revisions
        if "content" not in update_data:
            update_data["content"] = _sections_to_text(page_in.sections)
        content_changed = True

    # Check if title or content changed
    if "title" in update_data or "content" in update_data:
        content_changed = True

    for field, value in update_data.items():
        setattr(page, field, value if value is not None else getattr(page, field))

    # Create new revision if content changed
    if content_changed and page_in.updated_by:
        # Get next revision number
        result = await db.execute(
            select(func.max(RevisionModel.revision_number))
            .where(RevisionModel.page_id == page_id)
        )
        max_revision = result.scalar() or 0
        next_revision = max_revision + 1

        revision = RevisionModel(
            page_id=page.id,
            revision_number=next_revision,
            title=page.title,
            content=page.content,
            editor_id=page_in.updated_by,
        )
        db.add(revision)

    await db.commit()

    # Reload with relationships loaded to avoid lazy IO during response serialization
    result = await db.execute(
        select(PageModel)
        .options(selectinload(PageModel.sections), selectinload(PageModel.tags))
        .where(PageModel.id == page.id)
    )
    page = result.scalar_one()

    return page


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(
    page_id: int,
    soft_delete: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Delete a page (soft delete by default, or hard delete)."""
    result = await db.execute(select(PageModel).where(PageModel.id == page_id))
    page = result.scalar_one_or_none()

    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page with id {page_id} not found"
        )

    if soft_delete:
        page.is_deleted = True
        await db.commit()
    else:
        await db.delete(page)
        await db.commit()

    return None
