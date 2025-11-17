# Quick Fix: Google OAuth Setup

Your backend is running but Google OAuth is not configured. Follow these steps:

## Option 1: Get Real Google OAuth Credentials (5 minutes)

### Step 1: Create OAuth Credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen first:
   - User Type: External
   - App name: WikiTack
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue" through all steps
4. Back to "Create OAuth client ID":
   - Application type: **Web application**
   - Name: WikiTack
   - Authorized redirect URIs: Add this exactly:
     ```
     http://localhost:8000/api/v1/auth/google/callback
     ```
   - Click "Create"
5. **Copy your Client ID and Client Secret** (you'll need them next)

### Step 2: Update Backend Configuration

Edit `/Users/bhanu/Work/Deliverables/wikitack/backend/.env` and replace these lines:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

With your actual credentials:

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-actual-secret
```

### Step 3: Restart Backend

```bash
# Stop the backend (Ctrl+C in the terminal running it)
# Then restart:
make backend-dev
```

### Step 4: Test

1. Go to http://localhost:3000/login
2. Click "Sign in with Google"
3. Should work now!

---

## Option 2: Use Mock/Test Credentials (Development Only)

If you just want to test without Google OAuth, you can temporarily disable the OAuth check:

### Edit the auth endpoint

Open `/Users/bhanu/Work/Deliverables/wikitack/backend/app/api/auth.py` and comment out the validation:

```python
@router.get("/google/login", response_model=GoogleAuthURL)
async def google_login():
    """Get Google OAuth login URL."""
    # Temporarily disable this check for testing
    # if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
    #     raise HTTPException(...)

    authorization_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID or 'test'}&"
        # ... rest of the code
```

**Note**: This won't actually work for login, but it will let you verify the frontend is connecting to the backend.

---

## Verification

Test the endpoint directly:

```bash
curl http://localhost:8000/api/v1/auth/google/login
```

Should return:
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

Instead of an error.

---

## Current .env Status

Your `.env` file is at: `/Users/bhanu/Work/Deliverables/wikitack/backend/.env`

Currently configured:
- ✅ SECRET_KEY: Set (generated)
- ❌ GOOGLE_CLIENT_ID: Not set (placeholder)
- ❌ GOOGLE_CLIENT_SECRET: Not set (placeholder)

You need to set the two Google OAuth values.

---

## Need Help?

Read the full guide: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

Or quick start: [AUTH_QUICKSTART.md](./AUTH_QUICKSTART.md)
