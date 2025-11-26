from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

# For mobile ID-token verification
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings
from app.core.security import create_access_token
from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models import User as UserModel
from app.schemas.auth import Token, GoogleAuthURL, GoogleIdTokenRequest
from app.schemas.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])

# ----------------------------------------------------------------------
# Shared helper: upsert user by email
# ----------------------------------------------------------------------
async def _get_or_create_user(
    db: AsyncSession,
    *,
    email: str,
    name: str | None = None,
    google_id: str | None = None,
) -> UserModel:
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    user = result.scalar_one_or_none()

    if not user:
        username = email.split("@")[0]

        # if username exists, append part of google_id
        result = await db.execute(select(UserModel).where(UserModel.username == username))
        if result.scalar_one_or_none() and google_id:
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
        if name and not user.display_name:
            user.display_name = name
            await db.commit()
            await db.refresh(user)

    return user


# ----------------------------------------------------------------------
# OAuth configuration for WEB flow
# ----------------------------------------------------------------------
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# ----------------------------------------------------------------------
# MOBILE: client sends Google ID token, we verify and issue JWT
# POST /api/v1/auth/google/mobile
# ----------------------------------------------------------------------
@router.post("/google/mobile", response_model=Token)
async def google_callback_mobile(
    body: GoogleIdTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Mobile callback: accepts a Google ID token from Android/iOS,
    verifies it, upserts the user, and returns a JWT (no redirect).
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured",
        )

    # Verify ID token against your WEB client ID
    try:
        idinfo = google_id_token.verify_oauth2_token(
            body.id_token,
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token",
        )

    if idinfo.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
        raise HTTPException(status_code=401, detail="Invalid token issuer")

    google_id = idinfo.get("sub")
    email = idinfo.get("email")
    name = idinfo.get("name")
    picture = idinfo.get("picture")  # unused for now

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google",
        )

    user = await _get_or_create_user(
        db,
        email=email,
        name=name,
        google_id=google_id,
    )

    jwt_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return Token(
        access_token=jwt_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        email=user.email,
    )


# ----------------------------------------------------------------------
# WEB: login URL – GET /api/v1/auth/google/login
# ----------------------------------------------------------------------
@router.get("/google/login", response_model=GoogleAuthURL)
async def google_login():
    """
    Get Google OAuth login URL for the web frontend.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )

    authorization_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
        "response_type=code&"
        "scope=openid%20email%20profile&"
        "access_type=offline"
    )

    return GoogleAuthURL(authorization_url=authorization_url)


# ----------------------------------------------------------------------
# WEB: callback – GET /api/v1/auth/google/callback
# ----------------------------------------------------------------------
@router.get("/google/callback")
async def google_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Web callback: receives the authorization code from Google,
    exchanges it for user info, upserts user, and redirects with JWT.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured",
        )

    # Exchange code for access token
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
                detail="Failed to exchange code for token",
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
                detail="Failed to get user info from Google",
            )

        user_info = user_info_response.json()

    google_id = user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")  # unused for now

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google",
        )

    user = await _get_or_create_user(
        db,
        email=email,
        name=name,
        google_id=google_id,
    )

    jwt_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000"
    redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}"

    return RedirectResponse(url=redirect_url)


# ----------------------------------------------------------------------
# /me and /logout – unchanged
# ----------------------------------------------------------------------
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
    Logout endpoint (client should drop the JWT; no server-side state).
    """
    return {"message": "Successfully logged out"}