from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.config import settings
from app.core.security import create_access_token
from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models import User as UserModel
from app.schemas.auth import Token, GoogleAuthURL
from app.schemas.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])

# OAuth configuration
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/google/login", response_model=GoogleAuthURL)
async def google_login():
    """
    Get Google OAuth login URL.

    Returns the authorization URL that the frontend should redirect to.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        )

    authorization_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"access_type=offline"
    )

    return GoogleAuthURL(authorization_url=authorization_url)


@router.get("/google/callback")
async def google_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth callback.

    This endpoint receives the authorization code from Google and exchanges it for user info.
    Creates or updates the user in the database and returns a JWT token.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured"
        )

    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for token"
            )

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        # Get user info from Google
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if user_info_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )

        user_info = user_info_response.json()

    # Extract user information
    google_id = user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google"
        )

    # Check if user exists by email
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Create new user
        # Generate username from email
        username = email.split("@")[0]

        # Check if username exists, if so, append google id
        result = await db.execute(select(UserModel).where(UserModel.username == username))
        if result.scalar_one_or_none():
            username = f"{username}_{google_id[:8]}"

        user = UserModel(
            username=username,
            email=email,
            display_name=name,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update existing user's display name if needed
        if name and not user.display_name:
            user.display_name = name
            await db.commit()
            await db.refresh(user)

    # Create JWT token
    jwt_token = create_access_token(data={"sub": user.id, "email": user.email})

    # Redirect to frontend with token
    frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000"
    redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}"

    return RedirectResponse(url=redirect_url)


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: UserModel = Depends(get_current_active_user),
):
    """
    Get current authenticated user information.

    Requires a valid JWT token in the Authorization header.
    """
    return current_user


@router.post("/logout")
async def logout(
    current_user: UserModel = Depends(get_current_active_user),
):
    """
    Logout endpoint.

    Since we're using stateless JWT tokens, this is mainly for the client
    to clear the token. In production, you might want to add token blacklisting.
    """
    return {"message": "Successfully logged out"}
