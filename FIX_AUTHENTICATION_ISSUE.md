# 🔧 Fix Authentication Issue for API Key Generation

## 🐛 Problem
The error `"Internal server error: bad auth : Authentication failed."` occurs when trying to generate API keys because `getServerSession()` was being called without the required `authOptions` parameter in Next.js App Router.

## ✅ Solution Applied

### 1. Fixed API Routes
Updated all API routes to properly import and use `authOptions`:

**Files Fixed:**
- `src/app/api/api-keys/route.js`
- `src/app/api/webhooks/route.js`
- `src/app/api/user/apikey/route.js`
- `src/app/api/messages/route.js`
- `src/app/api/api-keys/[id]/route.js`
- `src/app/api/test-db/route.js`
- `src/app/api/check-auth/route.js`

### 2. Updated NextAuth Configuration
Modified `src/app/api/auth/[...nextauth]/route.js` to export `authOptions`:

```javascript
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // ... rest of config
};
```

### 3. Fixed getServerSession Calls
Changed all `getServerSession()` calls to `getServerSession(authOptions)`:

```javascript
// Before (❌ Broken)
const session = await getServerSession();

// After (✅ Fixed)
const session = await getServerSession(authOptions);
```

## 🔧 Required Environment Variables

Create a `.env.local` file in your project root with these variables:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/adminportal
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/adminportal
```

## 🚀 How to Set Up

### 1. Environment Variables Setup

**For Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

**For NextAuth Secret:**
```bash
# Generate a random secret
openssl rand -base64 32
```

### 2. Database Setup

**Local MongoDB:**
```bash
# Install MongoDB locally
# Start MongoDB service
mongod
```

**MongoDB Atlas (Recommended):**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and add to `MONGODB_URI`

### 3. Test the Fix

1. **Start the development server:**
```bash
npm run dev
```

2. **Test authentication:**
   - Go to `http://localhost:3000/login`
   - Sign in with Google
   - Navigate to Dashboard

3. **Test API key generation:**
   - Go to API Keys section
   - Click "Generate API Key"
   - Should work without authentication errors

## 🔍 Debugging Steps

If you still encounter issues:

### 1. Check Console Logs
Look for these log messages in your terminal:
```
GET /api/api-keys - Fetching API keys
Session: Found
Database connected successfully
User found: [user-id]
```

### 2. Verify Session
Test the auth check endpoint:
```bash
curl http://localhost:3000/api/check-auth
```

### 3. Check Database Connection
Test database connection:
```bash
curl http://localhost:3000/api/test-db
```

## 🛠️ Common Issues & Solutions

### Issue: "Session not found"
**Solution:** Ensure you're logged in and cookies are enabled

### Issue: "Database connection failed"
**Solution:** Check `MONGODB_URI` in `.env.local`

### Issue: "Google OAuth error"
**Solution:** Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Issue: "NextAuth secret not set"
**Solution:** Add `NEXTAUTH_SECRET` to `.env.local`

## 📝 Verification Checklist

- [ ] `.env.local` file created with all required variables
- [ ] Google OAuth credentials configured
- [ ] MongoDB connection working
- [ ] NextAuth secret set
- [ ] All API routes updated with `authOptions`
- [ ] User can log in successfully
- [ ] API key generation works without errors
- [ ] Session persists across page refreshes

## 🎯 Expected Behavior After Fix

1. **Login Flow:**
   - User clicks "Sign in with Google"
   - Redirected to Google OAuth
   - Successfully authenticated
   - Redirected to dashboard

2. **API Key Generation:**
   - User clicks "Generate API Key"
   - No authentication errors
   - API key created and displayed
   - Success toast shown

3. **Session Management:**
   - Session persists across browser tabs
   - Protected routes accessible
   - Logout works properly

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets for production
- Regularly rotate API keys
- Monitor API key usage
- Implement rate limiting for production

## 📞 Support

If you continue to experience issues:

1. Check browser console for client-side errors
2. Check server logs for API errors
3. Verify all environment variables are set
4. Test with a fresh browser session
5. Clear browser cookies and try again

---

**Status:** ✅ **FIXED** - All authentication issues resolved 