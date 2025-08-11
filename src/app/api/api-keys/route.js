import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import User from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/route';

// GET - Fetch all API keys for the authenticated user
export async function GET() {
  try {
    console.log('GET /api/api-keys - Fetching API keys');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session) {
      console.log('Unauthorized - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');

    console.log('Looking for user with email:', session.user.email);
    let user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      console.log('User not found in database, creating new user...');
      user = new User({
        email: session.user.email,
        name: session.user.name || 'User',
      });
      await user.save();
      console.log('✅ New user created:', user._id);
    } else {
      console.log('User found:', user._id);
    }

    const apiKeys = await ApiKey.findActiveByUser(user._id);
    console.log('Found API keys:', apiKeys.length);
    
    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Generate a new API key
export async function POST(request) {
  try {
    console.log('POST /api/api-keys - Starting API key generation');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session) {
      console.log('Unauthorized - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');

    console.log('Looking for user with email:', session.user.email);
    let user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      console.log('User not found in database, creating new user...');
      user = new User({
        email: session.user.email,
        name: session.user.name || 'User',
      });
      await user.save();
      console.log('✅ New user created:', user._id);
    } else {
      console.log('User found:', user._id);
    }

    const body = await request.json();
    const { name = 'API Key' } = body;
    console.log('Creating API key with name:', name);
    
    const apiKey = await ApiKey.createForUser(user._id, name);
    console.log('API key created successfully:', apiKey._id);
    
    const response = {
      _id: apiKey._id,
      key: apiKey.key,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      isActive: apiKey.isActive
    };
    
    console.log('Returning API key response');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating API key:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
} 