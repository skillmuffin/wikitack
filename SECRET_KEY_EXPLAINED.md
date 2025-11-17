# SECRET_KEY Explained

## What is SECRET_KEY?

`SECRET_KEY` is a cryptographic secret used to **sign and verify JWT tokens**. It ensures that tokens cannot be forged.

## The Complete Flow

### 1. Where it's SET

**File**: `/Users/bhanu/Work/Deliverables/wikitack/backend/.env`
```env
SECRET_KEY=your-secret-key-here
```

This is your environment file. You set this value yourself (or copy it from `.env.example`).

### 2. Where it's LOADED

**File**: `backend/app/core/config.py` (line 22)
```python
class Settings(BaseSettings):
    # JWT Settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production"  # ← Default
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    model_config = SettingsConfigDict(
        env_file=".env",  # ← Loads from .env file
        case_sensitive=True,
    )

settings = Settings()  # ← Creates settings instance
```

**How it works:**
- Pydantic reads `.env` file
- If `SECRET_KEY` is in `.env`, it uses that value
- Otherwise, it uses the default value
- Your `.env` has: `SECRET_KEY=asdasd...`, so that's what gets loaded

### 3. Where it's USED (Sign Tokens)

**File**: `backend/app/core/security.py` (line 32)
```python
def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})

    # ← HERE: Uses SECRET_KEY to SIGN the token
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
```

**What happens:**
- When you login with Google, this function creates a JWT token
- The token is **signed** with `settings.SECRET_KEY`
- Token is sent to frontend: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Where it's VALIDATED (Verify Tokens)

**File**: `backend/app/core/security.py` (line 39)
```python
def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and verify a JWT access token."""
    try:
        # ← HERE: Uses SECRET_KEY to VERIFY the token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None  # Token is invalid
```

**What happens:**
- When you access a protected endpoint, this function verifies the token
- It checks if the token was signed with the **same** `SECRET_KEY`
- If SECRET_KEY changed, old tokens become INVALID

### 5. Where it's USED (Protected Endpoints)

**File**: `backend/app/core/deps.py` (line 18)
```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the current authenticated user from JWT token."""
    token = credentials.credentials

    # ← HERE: Calls decode_access_token (which uses SECRET_KEY)
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    # ... rest of the code
```

**What happens:**
- Every protected API call (like `/api/v1/auth/me`) uses this
- It extracts the token from the `Authorization` header
- Calls `decode_access_token()` to verify it
- If verification fails → 401 Unauthorized

## Why Your Tokens are Invalid

**The Problem:**

1. Backend started with SECRET_KEY = `OLD_KEY` (a previously generated key)
2. You logged in → Token was signed with this key
3. You changed `.env` to a different SECRET_KEY
4. Backend is still running with OLD key in memory
5. New logins → Tokens signed with OLD key
6. Verification → Uses OLD key (still in memory)
7. **But the .env file has a DIFFERENT key!**

**The Solution:**

Restart the backend so it loads the NEW key from `.env`:

```bash
# Stop backend (Ctrl+C)
make backend-dev
```

Now:
- Backend loads: `SECRET_KEY` from `.env`
- New tokens signed with current key
- Verification uses current key
- ✅ Everything matches!

## How to Check What Key is Loaded

```bash
cd backend
source .venv/bin/activate
python -c "from app.core.config import settings; print('Loaded SECRET_KEY:', settings.SECRET_KEY)"
```

This shows what the running backend is using.

## Best Practices

### 1. Generate a Strong Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Example output: `zo3nL2NRAD1eP0PuNEb10mA0XHIYEGqw8qLiVU3GdK4`

### 2. Set it in .env

```bash
# backend/.env
SECRET_KEY=zo3nL2NRAD1eP0PuNEb10mA0XHIYEGqw8qLiVU3GdK4
```

### 3. NEVER Change it in Production

**Warning:** If you change SECRET_KEY in production:
- All existing user tokens become INVALID
- All users get logged out
- They must re-login

Only change it if:
- It was compromised
- You're okay with logging everyone out

### 4. Keep it SECRET

- ❌ Never commit `.env` to git (it's in `.gitignore`)
- ❌ Never share it publicly
- ❌ Never hardcode it in your code
- ✅ Only in `.env` file
- ✅ Use different keys for dev/staging/production

## Current State

Your current setup:

**File: backend/.env (line 16)**
```
SECRET_KEY=your-generated-secret-key-here
```

**For development**, make sure to:
- Use a properly generated random key
- Generate using the command below

**To generate a better one:**
```bash
cd backend
source .venv/bin/activate
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy the output and paste it as SECRET_KEY in .env
```

## Visual Flow

```
User Login (Google OAuth)
    ↓
Backend receives user info
    ↓
create_access_token() → Uses settings.SECRET_KEY to SIGN token
    ↓
Token sent to frontend: "eyJhbGci..."
    ↓
Frontend stores token in localStorage
    ↓
Frontend makes API request with token
    ↓
Backend receives request
    ↓
get_current_user() → decode_access_token() → Uses settings.SECRET_KEY to VERIFY
    ↓
If SECRET_KEY matches → ✅ User authenticated
If SECRET_KEY different → ❌ 401 Unauthorized
```

## Summary

**Where SECRET_KEY is:**
- 📁 Stored: `backend/.env` (line 16)
- 📥 Loaded: `app/core/config.py` (line 22)
- 🔐 Used to sign: `app/core/security.py` (line 32)
- ✅ Used to verify: `app/core/security.py` (line 39)
- 🛡️ Used in auth: `app/core/deps.py` (line 18)

**To fix your login issue:**
```bash
# Restart backend to load the current SECRET_KEY
make backend-dev
```
