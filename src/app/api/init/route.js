import { NextResponse } from 'next/server';
import whatsAppService from '../../../../whatsapp.js';

export async function GET() {
    try {
        // This will trigger the WhatsApp service initialization
        // The service is already listening for events when imported

        return NextResponse.json({
            success: true,
            message: 'WhatsApp service initialized',
            activeConnections: whatsAppService.getActiveConnections()
        });
    } catch (error) {
        console.error('Error initializing WhatsApp service:', error);
        return NextResponse.json(
            { error: 'Failed to initialize WhatsApp service' },
            { status: 500 }
        );
    }
}
