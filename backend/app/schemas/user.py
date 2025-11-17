from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    """Base user schema."""
    username: str
    email: EmailStr | None = None
    display_name: str | None = None
    is_active: bool = True


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str | None = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: EmailStr | None = None
    display_name: str | None = None
    is_active: bool | None = None
    password: str | None = None


class UserInDB(UserBase):
    """Schema for user in database."""
    id: int
    hashed_password: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class User(UserBase):
    """Schema for user response."""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
