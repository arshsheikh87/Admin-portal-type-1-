import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: session.user 
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 