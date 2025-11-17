from pydantic import BaseModel


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    email: str | None = None


class GoogleAuthURL(BaseModel):
    """Google OAuth authorization URL."""
    authorization_url: str


class GoogleCallback(BaseModel):
    """Google OAuth callback data."""
    code: str
    state: str | None = None
