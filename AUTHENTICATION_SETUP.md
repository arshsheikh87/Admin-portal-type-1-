# Authentication Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Google OAuth Credentials
# Get these from https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create a new OAuth 2.0 Client ID
5. Set the authorized redirect URI to: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret to your `.env.local` file

## NextAuth Secret

Generate a secure random string for NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit the authentication pages:
   - Sign Up: http://localhost:3000/signup
   - Log In: http://localhost:3000/login

## Features

- ✅ Modern, responsive design with Tailwind CSS
- ✅ Email and password authentication
- ✅ Google OAuth integration
- ✅ Password visibility toggle
- ✅ Social login buttons (Facebook, Google, Apple)
- ✅ Form validation
- ✅ Clean, minimal UI design
- ✅ Cross-page navigation between signup and login

## Pages

- `/signup` - Registration page
- `/login` - Login page
- `/` - Home page (redirects to login if not authenticated) 