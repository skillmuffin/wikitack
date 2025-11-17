# ⚠️ IMPORTANT: Restart Backend Required

Your OAuth credentials are configured correctly in `.env`, but the backend is still running with old values.

## Quick Fix

1. **Stop the backend**:
   - Go to the terminal running the backend
   - Press `Ctrl+C`

2. **Start it again**:
   ```bash
   cd /Users/bhanu/Work/Deliverables/wikitack/backend
   make backend-dev
   ```

   Or manually:
   ```bash
   cd /Users/bhanu/Work/Deliverables/wikitack/backend
   source .venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Verify it loaded correctly**:
   ```bash
   curl http://localhost:8000/api/v1/auth/google/login
   ```

   Should now show your actual client ID in the URL:
   ```json
   {
     "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID..."
   }
   ```

   NOT:
   ```json
   {
     "authorization_url": "...client_id=your-google-client-id..."
   }
   ```

## Why This Happens

FastAPI's `--reload` flag watches for **code changes**, but doesn't automatically reload when **environment files** (`.env`) change.

Whenever you modify `.env`, you must restart the backend manually.

## After Restart

1. ✅ Backend will load your actual OAuth credentials
2. ✅ Login should now redirect to Google properly
3. ⚠️ **Don't forget**: Add your email as a test user in Google Console (if you haven't already)

## Next Step

After restarting the backend:

1. Visit http://localhost:3000/login
2. Click "Sign in with Google"
3. You should see Google's sign-in page (not "Access blocked" immediately)

If you still get "Access blocked":
- Add your email as a test user: https://console.cloud.google.com/apis/credentials/consent
- Scroll to "Test users" → "+ ADD USERS"
- Enter your Google email → Save

## Quick Test

```bash
# This should return your actual client ID (YOUR_CLIENT_ID...)
curl http://localhost:8000/api/v1/auth/google/login | grep client_id
```
