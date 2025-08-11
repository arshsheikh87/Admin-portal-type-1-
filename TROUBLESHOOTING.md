# 🔧 API Key Generation Troubleshooting Guide

## 🚨 **Issue: "Error generating API key: Internal server error"**

This guide will help you fix the API key generation issue step by step.

## 📋 **Step 1: Environment Setup**

### Create `.env.local` file in the project root:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb://localhost:27017/admin-portal

# Google OAuth Credentials (Required for authentication)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Development mode
NODE_ENV=development
```

### 🔑 **Generate NextAuth Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📋 **Step 2: Google OAuth Setup**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API**
4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Client Secret
5. **Update `.env.local`** with your credentials

## 📋 **Step 3: MongoDB Setup**

### Option A: Local MongoDB
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option B: MongoDB Atlas
1. **Create MongoDB Atlas account**: https://cloud.mongodb.com/
2. **Create a cluster**
3. **Create database user** with read/write permissions
4. **Whitelist your IP** (or use 0.0.0.0/0 for development)
5. **Get connection string** and update `MONGODB_URI` in `.env.local`

## 📋 **Step 4: Test the Setup**

### 1. Start the development server:
```bash
npm run dev
```

### 2. Test database connection:
Visit: `http://localhost:3000/api/test-db`

### 3. Check console logs for detailed error messages

## 🔍 **Debugging Steps**

### **Check Console Logs**
The application now includes detailed logging. Look for:
- Database connection messages
- Session authentication status
- API key generation process
- Detailed error messages

### **Common Error Messages & Solutions**

#### **1. "Unauthorized - No session found"**
- **Cause**: User not logged in
- **Solution**: Log in with Google OAuth first

#### **2. "User not found in database"**
- **Cause**: User doesn't exist in database
- **Solution**: The system will automatically create the user

#### **3. "Database connection failed"**
- **Cause**: MongoDB not running or wrong connection string
- **Solution**: 
  - Check if MongoDB is running
  - Verify `MONGODB_URI` in `.env.local`
  - Test connection with MongoDB Compass

#### **4. "Error generating nanoid"**
- **Cause**: nanoid package issue
- **Solution**: The system has a fallback method

#### **5. "Google OAuth error"**
- **Cause**: Missing or incorrect Google credentials
- **Solution**: 
  - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  - Check redirect URIs in Google Cloud Console

## 🛠️ **Code Improvements Made**

### **1. Enhanced Error Logging**
- Added detailed console logs in API routes
- Better error messages with stack traces
- Frontend error handling improvements

### **2. Database Connection**
- Improved MongoDB connection handling
- Better error handling for database operations

### **3. API Key Generation**
- Added fallback for nanoid generation
- Enhanced error handling in ApiKey model
- Better validation and logging

### **4. Authentication**
- Improved NextAuth configuration
- Better session handling
- Enhanced user creation process

## 🧪 **Testing the Fix**

### **1. Test Database Connection**
```bash
curl http://localhost:3000/api/test-db
```

### **2. Test API Key Generation**
1. Log in to the application
2. Go to `/dashboard/apikey`
3. Click "Generate API Key"
4. Check console logs for detailed process

### **3. Monitor Console Output**
Look for these success messages:
```
✅ Database connected successfully
✅ User found: [user-id]
✅ Creating API key for user: [user-id]
✅ Generated key: sk_...
✅ API key saved successfully: [api-key-id]
✅ Returning API key response
```

## 🚨 **If Issues Persist**

### **1. Check Dependencies**
```bash
npm install
```

### **2. Clear Cache**
```bash
rm -rf .next
npm run dev
```

### **3. Check Environment Variables**
```bash
node -e "console.log('MONGODB_URI:', process.env.MONGODB_URI)"
```

### **4. Test MongoDB Connection**
```bash
# If using local MongoDB
mongo admin-portal --eval "db.users.find()"
```

## 📞 **Getting Help**

If you're still experiencing issues:

1. **Check the browser console** for detailed error messages
2. **Check the terminal** where `npm run dev` is running
3. **Test the database connection** using the test endpoint
4. **Verify all environment variables** are set correctly

## ✅ **Success Indicators**

You'll know the fix is working when:
- ✅ You can log in with Google OAuth
- ✅ The database connection test returns success
- ✅ API key generation completes without errors
- ✅ New API keys appear in the dashboard
- ✅ No "Internal server error" messages

---

**🎉 Once these steps are completed, your API key generation should work perfectly!** 