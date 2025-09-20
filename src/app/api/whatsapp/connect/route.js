import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import WhatsAppConnection from '@/models/WhatsAppConnection';
import User from '@/models/User';
import redisEventSystem from '@/lib/redisEvents';

export async function POST(request) {
    try {
        console.log('🚀 Starting WhatsApp connection request...');

        console.log('📊 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ MongoDB connected');

        // Initialize Redis event system if not already initialized
        console.log('📊 Initializing Redis event system...');
        if (!redisEventSystem.isInitialized) {
            await redisEventSystem.initialize();
        }
        console.log('✅ Redis event system ready');

        // Get user session
        console.log('📊 Getting user session...');
        const session = await auth();
        if (!session || !session.user) {
            console.log('❌ No session found');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        console.log('✅ Session found for user:', session.user.email);

        // Get the user document to ensure we have the correct MongoDB ObjectId
        console.log('📊 Finding user in database...');
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            console.log('❌ User not found in database');
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        console.log('✅ User found:', user._id);

        const userId = user._id;

        // Check if user already has an active connection
        console.log('📊 Checking for existing connections...');
        const existingConnection = await WhatsAppConnection.findOne({
            userId,
            status: { $in: ['connecting', 'qr_ready', 'connected'] }
        });

        if (existingConnection) {
            console.log('✅ Existing connection found:', existingConnection.status);
            return NextResponse.json({
                status: existingConnection.status,
                connectionId: existingConnection.connectionId,
                qrCode: existingConnection.qrCode,
                message: 'Connection already exists'
            });
        }

        console.log('📊 No existing connection, creating new one...');

        // Create new connection request
        const connection = new WhatsAppConnection({
            userId: userId,
            status: 'pending',
            metadata: {
                deviceInfo: request.headers.get('user-agent') || 'Unknown',
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
                userAgent: request.headers.get('user-agent') || 'Unknown'
            }
        });

        console.log('📊 Saving connection to database...');
        await connection.save();
        console.log('✅ Connection saved with ID:', connection.connectionId);

        // Trigger WhatsApp connection initialization via Redis
        console.log('📊 Emitting WhatsApp connect event via Redis...');
        await redisEventSystem.emitWhatsAppConnect(userId, connection.connectionId);
        console.log('✅ Redis event emitted successfully');

        console.log('🎉 WhatsApp connection request completed successfully');
        return NextResponse.json({
            status: 'initializing',
            connectionId: connection.connectionId,
            message: 'WhatsApp connection request created and initialization started'
        });

    } catch (error) {
        console.error('❌ Error creating WhatsApp connection request:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            step: 'unknown'
        });

        // Try to identify which step failed
        let failedStep = 'unknown';
        if (error.message.includes('MongoDB') || error.message.includes('mongoose')) {
            failedStep = 'database_connection';
        } else if (error.message.includes('Redis') || error.message.includes('redis')) {
            failedStep = 'redis_connection';
        } else if (error.message.includes('session') || error.message.includes('auth')) {
            failedStep = 'authentication';
        } else if (error.message.includes('User not found')) {
            failedStep = 'user_lookup';
        }

        return NextResponse.json(
            {
                error: 'Failed to create connection request',
                details: error.message,
                failedStep,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        await connectDB();

        // Get user session
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the user document to ensure we have the correct MongoDB ObjectId
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const userId = user._id;

        // Get the most recent connection for this user
        const connection = await WhatsAppConnection.findOne({
            userId
        }).sort({ createdAt: -1 });

        if (!connection) {
            return NextResponse.json({
                status: 'disconnected',
                qrCode: null,
                connectionId: null
            });
        }

        return NextResponse.json({
            status: connection.status,
            qrCode: connection.qrCode,
            connectionId: connection.connectionId,
            isConnected: false, // Will be updated by the service
            errorMessage: connection.errorMessage
        });

    } catch (error) {
        console.error('Error getting WhatsApp connection status:', error);
        return NextResponse.json(
            { error: 'Failed to get connection status' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        // Initialize Redis event system if not already initialized
        if (!redisEventSystem.isInitialized) {
            await redisEventSystem.initialize();
        }

        // Get user session
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the user document to ensure we have the correct MongoDB ObjectId
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const userId = user._id;

        // Trigger WhatsApp disconnect via Redis
        await redisEventSystem.emitWhatsAppDisconnect(userId);

        // Update all connections for this user to disconnected
        await WhatsAppConnection.updateMany(
            { userId },
            { status: 'disconnected' }
        );

        return NextResponse.json({
            status: 'disconnected',
            message: 'WhatsApp client disconnected'
        });

    } catch (error) {
        console.error('Error disconnecting WhatsApp:', error);
        return NextResponse.json(
            { error: 'Failed to disconnect WhatsApp' },
            { status: 500 }
        );
    }
}
