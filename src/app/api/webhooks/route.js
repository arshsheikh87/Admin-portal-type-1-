import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Webhook from '@/models/Webhook';
import User from '@/models/User';
import { checkAndConsumeCredit } from '@/lib/credits';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, url, description } = await request.json();

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check and consume credits before creating webhook
    const creditCheck = await checkAndConsumeCredit(user._id, 1);
    
    if (!creditCheck.success) {
      return NextResponse.json({ 
        error: creditCheck.message,
        remainingCredits: creditCheck.remainingCredits 
      }, { status: 402 }); // 402 Payment Required
    }

    const webhook = new Webhook({
      userId: user._id,
      name,
      url,
      description: description || '',
    });

    await webhook.save();

    return NextResponse.json({
      ...webhook.toObject(),
      remainingCredits: creditCheck.remainingCredits
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
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

    const webhooks = await Webhook.find({ userId: user._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      webhooks,
      credits: user.credits
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 