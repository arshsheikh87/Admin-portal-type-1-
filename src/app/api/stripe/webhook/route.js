import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(request) {
  console.log('🔔 Webhook received!');

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  console.log('📝 Webhook body length:', body.length);
  console.log('🔐 Signature present:', !!signature);
  console.log('🔑 Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook signature verified');
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    console.log('🎯 Event type:', event.type);
    console.log('📊 Event data:', JSON.stringify(event.data.object, null, 2));

    await connectDB();
    console.log('🔗 Database connected');

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('💳 Checkout session completed');
        console.log('📋 Session metadata:', session.metadata);

        // Extract metadata
        const { userId, credits } = session.metadata;
        console.log(`👤 User ID: ${userId}, 💰 Credits: ${credits}`);

        if (userId && credits) {
          // Add credits to user account
          const user = await User.findById(userId);
          console.log('🔍 User found:', !!user);

          if (user) {
            const oldCredits = user.credits;
            user.credits += parseInt(credits);
            await user.save();

            console.log(`✅ Added ${credits} credits to user ${userId}`);
            console.log(`📈 Credits: ${oldCredits} → ${user.credits}`);
          } else {
            console.error('❌ User not found with ID:', userId);
          }
        } else {
          console.error('❌ Missing userId or credits in metadata');
        }
        break;

      case 'payment_intent.succeeded':
        console.log('✅ Payment succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('💥 Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}