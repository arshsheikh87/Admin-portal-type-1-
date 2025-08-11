# MongoDB Atlas Setup Guide

## 🔗 Connecting Your MongoDB Atlas Cluster

This guide will help you connect your own MongoDB Atlas cluster to this admin portal application.

## 📋 Prerequisites

1. **MongoDB Atlas Account**: You need a MongoDB Atlas account
2. **Cluster Created**: A MongoDB Atlas cluster should be created
3. **Database User**: A database user with read/write permissions
4. **Network Access**: Your IP address should be whitelisted

## 🚀 Step-by-Step Setup

### 1. Get Your MongoDB Atlas Connection String

1. **Log into MongoDB Atlas**: Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. **Select Your Cluster**: Click on your cluster
3. **Get Connection String**:
   - Click "Connect" button
   - Choose "Connect your application"
   - Select "Node.js" as your driver
   - Copy the connection string

### 2. Create Environment File

Create a `.env.local` file in the root directory of your project:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

# Google OAuth Credentials (Required for authentication)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 3. Update the Connection String

Replace the placeholder in `MONGODB_URI` with your actual connection string:

**Example:**
```env
MONGODB_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/admin-portal?retryWrites=true&w=majority
```

**Important Notes:**
- Replace `<username>` with your database username
- Replace `<password>` with your database password
- Replace `<cluster-url>` with your actual cluster URL
- Replace `<database-name>` with your desired database name (e.g., `admin-portal`)

### 4. Database User Setup

1. **Create Database User**:
   - Go to "Database Access" in MongoDB Atlas
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password
   - Select "Read and write to any database"
   - Click "Add User"

2. **Network Access**:
   - Go to "Network Access" in MongoDB Atlas
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses

### 5. Test the Connection

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Check for connection errors** in the console
3. **Try to register/login** to test database operations

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Check if your IP is whitelisted in MongoDB Atlas
   - Verify the connection string format
   - Ensure the database user has correct permissions

2. **Authentication Failed**:
   - Double-check username and password
   - Make sure the database user exists
   - Verify the authentication method (Password vs Certificate)

3. **Network Timeout**:
   - Check your internet connection
   - Verify the cluster is running
   - Try connecting from a different network

4. **Database Not Found**:
   - The database will be created automatically when you first use it
   - Make sure the database name in the connection string is correct

### Connection String Format

**Standard Format:**
```
mongodb+srv://username:password@cluster-name.abc123.mongodb.net/database-name?retryWrites=true&w=majority
```

**Parameters Explained:**
- `mongodb+srv://` - Protocol for MongoDB Atlas
- `username:password` - Your database credentials
- `cluster-name.abc123.mongodb.net` - Your cluster URL
- `database-name` - Your database name
- `retryWrites=true` - Enables retry for write operations
- `w=majority` - Write concern for data consistency

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Strong Passwords**: Use strong, unique passwords for database users
3. **IP Whitelisting**: Restrict network access to specific IPs in production
4. **Database Users**: Create separate users for different environments
5. **Connection Pooling**: The application uses connection pooling for efficiency

## 🚀 Production Deployment

For production deployment:

1. **Update Environment Variables**:
   - Set `NEXTAUTH_URL` to your production domain
   - Update `NEXTAUTH_SECRET` with a strong secret
   - Use production MongoDB Atlas cluster

2. **Network Security**:
   - Whitelist only your production server IPs
   - Use VPC peering if available

3. **Monitoring**:
   - Enable MongoDB Atlas monitoring
   - Set up alerts for connection issues

## 📊 Database Collections

The application will automatically create these collections:

- **users**: User accounts and API keys
- **webhooks**: Webhook configurations
- **messages**: WhatsApp message history
- **sessions**: NextAuth session data (if using database sessions)

## ✅ Verification

To verify your connection is working:

1. **Start the application**: `npm run dev`
2. **Register a new account**: Go to `/signup`
3. **Check the console**: Look for successful MongoDB connection messages
4. **Verify in MongoDB Atlas**: Check if collections are created

## 🆘 Need Help?

If you encounter issues:

1. **Check the console** for detailed error messages
2. **Verify your connection string** format
3. **Test with MongoDB Compass** to ensure connectivity
4. **Check MongoDB Atlas logs** for connection attempts

---

**🎉 Your MongoDB Atlas cluster is now connected to your admin portal!**

The application will automatically create the necessary collections and handle all database operations seamlessly. 