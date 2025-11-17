from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import User as UserModel
from app.schemas import User, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[User])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Get a list of all users."""
    result = await db.execute(
        select(UserModel)
        .where(UserModel.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    users = result.scalars().all()
    return users


@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by ID."""
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    return user


@router.get("/username/{username}", response_model=User)
async def get_user_by_username(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user by username."""
    result = await db.execute(select(UserModel).where(UserModel.username == username))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with username {username} not found"
        )

    return user


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new user."""
    # Check if username already exists
    result = await db.execute(
        select(UserModel).where(UserModel.username == user_in.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    if user_in.email:
        result = await db.execute(
            select(UserModel).where(UserModel.email == user_in.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Create user (in production, hash the password)
    user_data = user_in.model_dump(exclude={"password"})
    if user_in.password:
        # In production, use proper password hashing (bcrypt, argon2, etc.)
        user_data["hashed_password"] = f"hashed_{user_in.password}"

    user = UserModel(**user_data)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.patch("/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a user."""
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    update_data = user_in.model_dump(exclude_unset=True, exclude={"password"})

    if user_in.password:
        # In production, use proper password hashing
        update_data["hashed_password"] = f"hashed_{user_in.password}"

    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a user by setting is_active to False."""
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    user.is_active = False
    await db.commit()

    return None
