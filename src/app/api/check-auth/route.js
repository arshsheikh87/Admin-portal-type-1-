import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    console.log('🔍 Checking authentication status...');
    
    const session = await getServerSession(authOptions);
    console.log('Session found:', !!session);
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        message: 'Please log in first'
      }, { status: 401 });
    }

    console.log('User email from session:', session.user.email);
    
    await connectDB();
    console.log('✅ Database connected');
    
    let user = await User.findOne({ email: session.user.email });
    console.log('User found in database:', !!user);
    
    if (!user) {
      console.log('Creating new user...');
      user = new User({
        email: session.user.email,
        name: session.user.name || 'User',
      });
      await user.save();
      console.log('✅ New user created:', user._id);
    }
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        exists: true
      }
    });
  } catch (error) {
    console.error('❌ Auth check error:', error);
    return NextResponse.json({ 
      error: 'Authentication check failed', 
      details: error.message 
    }, { status: 500 });
  }
} 