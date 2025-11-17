from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import Tag as TagModel
from app.schemas import Tag, TagCreate, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=list[Tag])
async def list_tags(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Get a list of all tags."""
    result = await db.execute(
        select(TagModel).offset(skip).limit(limit)
    )
    tags = result.scalars().all()
    return tags


@router.get("/{tag_id}", response_model=Tag)
async def get_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific tag by ID."""
    result = await db.execute(select(TagModel).where(TagModel.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {tag_id} not found"
        )

    return tag


@router.get("/slug/{slug}", response_model=Tag)
async def get_tag_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific tag by slug."""
    result = await db.execute(select(TagModel).where(TagModel.slug == slug))
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with slug {slug} not found"
        )

    return tag


@router.post("/", response_model=Tag, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_in: TagCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new tag."""
    # Check if tag with same name already exists
    result = await db.execute(
        select(TagModel).where(TagModel.name == tag_in.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag with this name already exists"
        )

    # Check if slug already exists
    if tag_in.slug:
        result = await db.execute(
            select(TagModel).where(TagModel.slug == tag_in.slug)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag with this slug already exists"
            )

    tag = TagModel(**tag_in.model_dump())
    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return tag


@router.patch("/{tag_id}", response_model=Tag)
async def update_tag(
    tag_id: int,
    tag_in: TagUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a tag."""
    result = await db.execute(select(TagModel).where(TagModel.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {tag_id} not found"
        )

    update_data = tag_in.model_dump(exclude_unset=True)

    # Check if new name conflicts
    if "name" in update_data:
        result = await db.execute(
            select(TagModel).where(
                TagModel.name == update_data["name"],
                TagModel.id != tag_id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag with this name already exists"
            )

    # Check if new slug conflicts
    if "slug" in update_data:
        result = await db.execute(
            select(TagModel).where(
                TagModel.slug == update_data["slug"],
                TagModel.id != tag_id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag with this slug already exists"
            )

    for field, value in update_data.items():
        setattr(tag, field, value)

    await db.commit()
    await db.refresh(tag)

    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a tag."""
    result = await db.execute(select(TagModel).where(TagModel.id == tag_id))
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {tag_id} not found"
        )

    await db.delete(tag)
    await db.commit()

    return None
