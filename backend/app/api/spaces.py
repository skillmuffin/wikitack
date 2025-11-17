from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models import Space as SpaceModel, User as UserModel
from app.schemas import Space, SpaceCreate, SpaceUpdate, SpaceWithOwner

router = APIRouter(prefix="/spaces", tags=["spaces"])


@router.get("/", response_model=list[Space])
async def list_spaces(
    skip: int = 0,
    limit: int = 100,
    include_private: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Get a list of all spaces."""
    query = select(SpaceModel)

    if not include_private:
        query = query.where(SpaceModel.is_private == False)

    result = await db.execute(query.offset(skip).limit(limit))
    spaces = result.scalars().all()
    return spaces


@router.get("/{space_id}", response_model=SpaceWithOwner)
async def get_space(
    space_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific space by ID with owner details."""
    result = await db.execute(
        select(SpaceModel)
        .options(selectinload(SpaceModel.owner))
        .where(SpaceModel.id == space_id)
    )
    space = result.scalar_one_or_none()

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {space_id} not found"
        )

    return space


@router.get("/slug/{slug}", response_model=SpaceWithOwner)
async def get_space_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific space by slug with owner details."""
    result = await db.execute(
        select(SpaceModel)
        .options(selectinload(SpaceModel.owner))
        .where(SpaceModel.slug == slug)
    )
    space = result.scalar_one_or_none()

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with slug {slug} not found"
        )

    return space


@router.post("/", response_model=Space, status_code=status.HTTP_201_CREATED)
async def create_space(
    space_in: SpaceCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new space."""
    # Check if slug already exists
    result = await db.execute(
        select(SpaceModel).where(SpaceModel.slug == space_in.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already exists"
        )

    # Verify owner exists
    result = await db.execute(
        select(UserModel).where(UserModel.id == space_in.owner_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Owner with id {space_in.owner_id} not found"
        )

    space = SpaceModel(**space_in.model_dump())
    db.add(space)
    await db.commit()
    await db.refresh(space)

    return space


@router.patch("/{space_id}", response_model=Space)
async def update_space(
    space_id: int,
    space_in: SpaceUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a space."""
    result = await db.execute(select(SpaceModel).where(SpaceModel.id == space_id))
    space = result.scalar_one_or_none()

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {space_id} not found"
        )

    update_data = space_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(space, field, value)

    await db.commit()
    await db.refresh(space)

    return space


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_space(
    space_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a space and all its pages (cascade)."""
    result = await db.execute(select(SpaceModel).where(SpaceModel.id == space_id))
    space = result.scalar_one_or_none()

    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {space_id} not found"
        )

    await db.delete(space)
    await db.commit()

    return None
