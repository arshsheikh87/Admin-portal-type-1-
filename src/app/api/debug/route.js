import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ApiKey from '@/models/ApiKey';
import Message from '@/models/Message';
import Webhook from '@/models/Webhook';
import WhatsAppConnection from '@/models/WhatsAppConnection';
import redisEventSystem from '@/lib/redisEvents';

export async function GET() {
    const debug = {
        timestamp: new Date().toISOString(),
        mongodb: { status: 'unknown', error: null },
        redis: { status: 'unknown', error: null },
        session: { status: 'unknown', error: null },
        user: { status: 'unknown', error: null }
    };

    // Test MongoDB connection
    try {
        await connectDB();
        debug.mongodb.status = 'connected';
    } catch (error) {
        debug.mongodb.status = 'failed';
        debug.mongodb.error = error.message;
    }

    // Test Redis connection
    try {
        if (!redisEventSystem.isInitialized) {
            await redisEventSystem.initialize();
        }
        debug.redis.status = redisEventSystem.isRedisReady() ? 'connected' : 'not_ready';
        debug.redis.details = redisEventSystem.getStatus();
    } catch (error) {
        debug.redis.status = 'failed';
        debug.redis.error = error.message;
    }

    // Test session
    try {
        const session = await auth();
        if (session && session.user) {
            debug.session.status = 'valid';
            debug.session.email = session.user.email;
            
            // Test user lookup
            try {
                const user = await User.findOne({ email: session.user.email });
                if (user) {
                    debug.user.status = 'found';
                    debug.user.id = user._id.toString();
                } else {
                    debug.user.status = 'not_found';
                }
            } catch (userError) {
                debug.user.status = 'error';
                debug.user.error = userError.message;
            }
        } else {
            debug.session.status = 'invalid';
        }
    } catch (error) {
        debug.session.status = 'error';
        debug.session.error = error.message;
    }

    return NextResponse.json(debug);
}