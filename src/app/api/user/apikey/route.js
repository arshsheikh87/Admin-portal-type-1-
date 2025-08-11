import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ApiKey from '@/models/ApiKey';
import { checkAndConsumeCredit } from '@/lib/credits';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check and consume credits before generating API key
    const creditCheck = await checkAndConsumeCredit(user._id, 1);
    
    if (!creditCheck.success) {
      return NextResponse.json({ 
        error: creditCheck.message,
        remainingCredits: creditCheck.remainingCredits 
      }, { status: 402 }); // 402 Payment Required
    }

    const apiKey = user.generateApiKey();
    await user.save();

    return NextResponse.json({ 
      apiKey,
      generatedAt: user.apiKeyGeneratedAt,
      remainingCredits: creditCheck.remainingCredits
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count API keys for this user
    const apiKeyCount = await ApiKey.countDocuments({ userId: user._id });

    return NextResponse.json({ 
      hasApiKey: apiKeyCount > 0,
      totalApiKeys: apiKeyCount,
      generatedAt: user.apiKeyGeneratedAt,
      credits: user.credits
    });
  } catch (error) {
    console.error('Error fetching API key status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 