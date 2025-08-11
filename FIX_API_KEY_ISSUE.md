# 🔧 Fix API Key Generation Issue

## 🚨 **Problem**: "Error generating API key: Internal server error"

## ✅ **Solution Steps**:

### 1. **Create Environment File**
Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/admin-portal
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
NODE_ENV=development
```

### 2. **Get Google OAuth Credentials**
1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Update `.env.local` with your credentials

### 3. **Start MongoDB**
```bash
# Option A: Local MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Option B: MongoDB Atlas
# Update MONGODB_URI with your Atlas connection string
```

### 4. **Test the Fix**
```bash
npm run dev
# Visit http://localhost:3000
# Log in with Google
# Try generating API key
```

## 🔍 **Debugging**
- Check browser console for detailed errors
- Check terminal logs for database connection
- Visit `/api/test-db` to test database connection

The code has been improved with better error handling and logging! 