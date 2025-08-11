import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    await connectDB();
    console.log('Database connected successfully');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No session found',
        message: 'Please log in first'
      }, { status: 401 });
    }

    console.log('Looking for user with email:', session.user.email);
    let user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      console.log('User not found, creating new user...');
      user = new User({
        email: session.user.email,
        name: session.user.name || 'User',
      });
      await user.save();
      console.log('User created successfully:', user._id);
    } else {
      console.log('User found:', user._id);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error.message 
    }, { status: 500 });
  }
} 