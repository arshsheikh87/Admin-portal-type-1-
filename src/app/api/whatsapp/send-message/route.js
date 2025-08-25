import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Message from '@/models/Message';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import whatsAppService from '../../../../../whatsapp';

export async function POST(request) {
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
        const { phoneNumber, message } = await request.json();

        // Validate input
        if (!phoneNumber || !message) {
            return NextResponse.json(
                { error: 'Phone number and message are required' },
                { status: 400 }
            );
        }

        // Check if WhatsApp is connected
        const clientStatus = await whatsAppService.getClientStatus(userId);
        if (!clientStatus.isConnected) {
            return NextResponse.json(
                { error: 'WhatsApp is not connected. Please connect first.' },
                { status: 400 }
            );
        }

        // Send message using WhatsApp service
        const result = await whatsAppService.sendMessage(userId, phoneNumber, message);

        if (result.success) {
            // Save message to database
            const savedMessage = new Message({
                userId,
                phoneNumber,
                message,
                status: 'sent',
                whatsappMessageId: result.messageId
            });

            await savedMessage.save();

            return NextResponse.json({
                success: true,
                message: 'Message sent successfully',
                messageId: result.messageId,
                savedMessage: savedMessage
            });
        } else {
            // Save failed message to database
            const failedMessage = new Message({
                userId,
                phoneNumber,
                message,
                status: 'failed',
                errorMessage: result.error || 'Unknown error'
            });

            await failedMessage.save();

            return NextResponse.json(
                { error: 'Failed to send message' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error sending WhatsApp message:', error);

        // Save failed message to database
        try {
            if (user?._id) {
                const { phoneNumber, message } = await request.json();
                const failedMessage = new Message({
                    userId: user._id,
                    phoneNumber,
                    message,
                    status: 'failed',
                    errorMessage: error.message
                });
                await failedMessage.save();
            }
        } catch (saveError) {
            console.error('Error saving failed message:', saveError);
        }

        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
