#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 Setting up environment variables for Admin Portal...\n');

const envPath = path.join(__dirname, '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Backing up to .env.local.backup');
  fs.copyFileSync(envPath, envPath + '.backup');
}

// Generate a random secret for NextAuth
const generateSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

// Create the environment file content
const envContent = `# NextAuth Configuration
NEXTAUTH_SECRET=${generateSecret()}
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (for authentication)
# Get these from https://console.cloud.google.com/
# 1. Go to Google Cloud Console
# 2. Create a new project or select existing one
# 3. Enable Google+ API
# 4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
# 5. Set authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB Connection
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/adminportal
# For MongoDB Atlas (recommended):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/adminportal?retryWrites=true&w=majority

# Optional: Environment
NODE_ENV=development
`;

// Write the file
fs.writeFileSync(envPath, envContent);

console.log('✅ Created .env.local file with default values');
console.log('');
console.log('📝 Next steps:');
console.log('1. Edit .env.local and add your Google OAuth credentials');
console.log('2. Set up your MongoDB connection (local or Atlas)');
console.log('3. Run: npm run dev');
console.log('');
console.log('🔗 Helpful links:');
console.log('- Google Cloud Console: https://console.cloud.google.com/');
console.log('- MongoDB Atlas: https://www.mongodb.com/atlas');
console.log('');
console.log('⚠️  Remember: Never commit .env.local to version control!'); 