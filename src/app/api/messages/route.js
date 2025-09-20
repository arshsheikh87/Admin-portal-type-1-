import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';
import { checkAndConsumeCredit } from '@/lib/credits';
import { auth } from '../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: 'Phone number and message are required' }, { status: 400 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check and consume credits before sending message
    const creditCheck = await checkAndConsumeCredit(user._id, 1);
    
    if (!creditCheck.success) {
      return NextResponse.json({ 
        error: creditCheck.message,
        remainingCredits: creditCheck.remainingCredits 
      }, { status: 402 }); // 402 Payment Required
    }

    // Create message record
    const messageRecord = new Message({
      userId: user._id,
      phoneNumber,
      message,
    });

    await messageRecord.save();

    // TODO: Integrate with actual WhatsApp API here
    // For now, we'll simulate a successful message send

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      messageId: messageRecord._id,
      remainingCredits: creditCheck.remainingCredits
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const messages = await Message.find({ userId: user._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      messages,
      credits: user.credits
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 