from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models import Revision as RevisionModel
from app.schemas import Revision, RevisionWithEditor

router = APIRouter(prefix="/revisions", tags=["revisions"])


@router.get("/page/{page_id}", response_model=list[RevisionWithEditor])
async def list_page_revisions(
    page_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Get all revisions for a specific page."""
    result = await db.execute(
        select(RevisionModel)
        .options(selectinload(RevisionModel.editor))
        .where(RevisionModel.page_id == page_id)
        .order_by(RevisionModel.revision_number.desc())
        .offset(skip)
        .limit(limit)
    )
    revisions = result.scalars().all()
    return revisions


@router.get("/{revision_id}", response_model=RevisionWithEditor)
async def get_revision(
    revision_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific revision by ID."""
    result = await db.execute(
        select(RevisionModel)
        .options(selectinload(RevisionModel.editor))
        .where(RevisionModel.id == revision_id)
    )
    revision = result.scalar_one_or_none()

    if not revision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Revision with id {revision_id} not found"
        )

    return revision


@router.get("/page/{page_id}/number/{revision_number}", response_model=RevisionWithEditor)
async def get_revision_by_number(
    page_id: int,
    revision_number: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific revision by page ID and revision number."""
    result = await db.execute(
        select(RevisionModel)
        .options(selectinload(RevisionModel.editor))
        .where(
            RevisionModel.page_id == page_id,
            RevisionModel.revision_number == revision_number
        )
    )
    revision = result.scalar_one_or_none()

    if not revision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Revision {revision_number} not found for page {page_id}"
        )

    return revision
