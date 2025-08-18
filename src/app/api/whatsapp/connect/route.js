import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import WhatsAppConnection from '@/models/WhatsAppConnection';
import redisEventSystem from '@/lib/redisEvents';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function POST(request) {
    try {
        await connectDB();

        // Initialize Redis event system if not already initialized
        if (!redisEventSystem.isInitialized) {
            await redisEventSystem.initialize();
        }

        // Get user session
        const session = await getServerSession(authOptions);
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

        // Check if user already has an active connection
        const existingConnection = await WhatsAppConnection.findOne({
            userId,
            status: { $in: ['connecting', 'qr_ready', 'connected'] }
        });

        if (existingConnection) {
            return NextResponse.json({
                status: existingConnection.status,
                connectionId: existingConnection.connectionId,
                qrCode: existingConnection.qrCode,
                message: 'Connection already exists'
            });
        }

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

        await connection.save();

        // Trigger WhatsApp connection initialization via Redis
        await redisEventSystem.emitWhatsAppConnect(userId, connection.connectionId);

        return NextResponse.json({
            status: 'initializing',
            connectionId: connection.connectionId,
            message: 'WhatsApp connection request created and initialization started'
        });

    } catch (error) {
        console.error('Error creating WhatsApp connection request:', error);
        return NextResponse.json(
            { error: 'Failed to create connection request' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        await connectDB();

        // Get user session
        const session = await getServerSession(authOptions);
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
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

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
