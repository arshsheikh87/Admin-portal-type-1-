import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { stripe } from '../../../../lib/stripe';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('🔍 Retrieved session:', checkoutSession);

    if (checkoutSession.payment_status === 'paid') {
      await connectDB();
      
      const user = await User.findOne({ email: session.user.email });
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Extract credits from metadata
      const credits = parseInt(checkoutSession.metadata.credits);
      
      if (credits) {
        const oldCredits = user.credits;
        user.credits += credits;
        await user.save();
        
        console.log(`✅ Manually added ${credits} credits to user ${user._id}`);
        console.log(`📈 Credits: ${oldCredits} → ${user.credits}`);

        return NextResponse.json({
          success: true,
          message: `Successfully added ${credits} credits`,
          newBalance: user.credits
        });
      }
    }

    return NextResponse.json({ error: 'Payment not completed or invalid' }, { status: 400 });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      error: 'Failed to verify payment',
      details: error.message 
    }, { status: 500 });
  }
}