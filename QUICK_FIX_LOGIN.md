# Quick Fix: Test Login Manually

Your user exists in the database, but there's an issue with the OAuth flow. Let's test the token system manually.

## Test 1: Verify Token System Works

I generated a test token for your user. Test it:

```bash
# Use the token from the previous output
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8000/api/v1/auth/me
```

Should return your user info.

## Test 2: Manual Login in Browser

1. Open http://localhost:3000 in your browser
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Paste this (replace TOKEN with the test token):

```javascript
localStorage.setItem('auth_token', 'YOUR_TOKEN_HERE');
window.location.href = '/dashboard';
```

If this works, you'll be logged in and see the dashboard. This means:
- ✅ Token system works
- ✅ Frontend auth works
- ❌ OAuth callback is broken

## Most Likely Issues

### Issue 1: Frontend Not Restarted

Did you restart the frontend after creating `.env.local`?

```bash
cd frontend
# Stop it (Ctrl+C)
yarn dev
```

### Issue 2: Check Browser Console

Open http://localhost:3000/login, press F12, go to Console tab.

After clicking "Sign in with Google" and completing OAuth, look for:
- Red errors
- Failed fetch requests
- CORS errors

### Issue 3: Check Network Tab

1. F12 → "Network" tab
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Look for the `/auth/callback` request
5. What's the response? Is there a `token` parameter?

## Debug: Check What's Happening

Add this to check the OAuth callback:

1. Go to http://localhost:3000/login
2. Open console (F12)
3. Paste this before clicking sign in:

```javascript
// Monitor localStorage changes
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  console.log('localStorage.setItem:', key, value?.substring(0, 50));
  originalSetItem.apply(this, arguments);
};

// Monitor navigation
window.addEventListener('popstate', () => {
  console.log('Navigation to:', window.location.href);
});
```

4. Now click "Sign in with Google"
5. Watch the console for what happens

## Check Backend Callback

The backend callback should:
1. Receive code from Google
2. Exchange code for user info
3. Create/find user in database
4. Generate JWT token
5. Redirect to: `http://localhost:3000/auth/callback?token=...`

Check backend logs when you complete OAuth. You should see:
- POST to Google for token exchange
- GET to Google for user info
- User creation/lookup query
- Redirect with token

## Alternative: Add Console Logging

Let's add logging to the auth callback page to see what's happening:

**Option 1**: Check browser console after OAuth
**Option 2**: Add debugging to the code

Which errors do you see in the browser console?

Common ones:
- `Failed to fetch` → Backend not running or wrong URL
- `NetworkError` → CORS issue
- `401 Unauthorized` → Token invalid
- No errors but redirects to login → Token not being saved or validated

## If Manual Token Works

If the manual token login works (Test 2 above), then the issue is specifically in the OAuth callback flow. We need to check:

1. Is the backend redirecting with a token?
2. Is the frontend receiving the token?
3. Is the frontend saving the token?

Check the URL when you're redirected back from Google:
- Should briefly show: `http://localhost:3000/auth/callback?token=eyJ...`
- If you don't see `?token=...`, the backend isn't generating/passing the token

## Next Steps

1. Try the manual token login (Test 2)
2. Check browser console for errors
3. Check if you see `?token=...` in URL after OAuth
4. Report what you find

This will help identify exactly where the flow is breaking!
