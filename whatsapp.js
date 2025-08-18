import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import mongoose from 'mongoose';
import WhatsAppConnection from './src/models/WhatsAppConnection.js';
import User from './src/models/User.js';
import redisEventSystem from './src/lib/redisEvents.js';
import { connect as connectRedis, healthCheck as redisHealthCheck } from './redis.js';

connectRedis();

// Store active clients for each user
const clients = new Map();
const connectionStatuses = new Map();

const onWhatsappMessage = async () => {

}

class WhatsAppService {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize Redis event system
            await redisEventSystem.initialize();

            // Initialize event listeners after Redis is ready
            this.initializeEventListeners();

            // Restore existing active connections
            await this.restoreExistingConnections();

            this.isInitialized = true;
            console.log('WhatsApp service initialized with Redis');
        } catch (error) {
            console.error('Failed to initialize WhatsApp service:', error);
            throw error;
        }
    }

    async restoreExistingConnections() {
        try {
            console.log('Restoring existing WhatsApp connections...');

            // Find all active connections (connected or qr_ready status)
            const activeConnections = await WhatsAppConnection.find({
                status: { $in: ['connected', 'qr_ready'] }
            }).populate('userId');

            console.log(`Found ${activeConnections.length} active connections to restore`);

            for (const connection of activeConnections) {
                try {
                    console.log(`Restoring connection for user ${connection.userId._id}, status: ${connection.status}`);

                    // Initialize the connection
                    const result = await this.initializeConnection(connection.userId._id, connection.connectionId);
                    console.log(`Connection restoration result for user ${connection.userId._id}:`, result);

                    // Small delay between connections to avoid overwhelming the system
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Failed to restore connection ${connection.connectionId}:`, error);
                    // Mark connection as failed if restoration fails
                    await this.updateConnectionStatus(connection.connectionId, 'failed', error.message);
                }
            }

            console.log('Finished restoring existing connections');
            console.log('Current active clients:', Array.from(clients.keys()));
            console.log('Current connection statuses:', Array.from(connectionStatuses.entries()));
        } catch (error) {
            console.error('Error restoring existing connections:', error);
        }
    }

    initializeEventListeners() {
        // Listen for WhatsApp events from Redis
        redisEventSystem.onWhatsAppConnect(async (event) => {
            console.log('WhatsApp connect event received from Redis:', event);
            await this.initializeConnection(event.userId, event.connectionId);
        });

        redisEventSystem.onWhatsAppDisconnect(async (event) => {
            console.log('WhatsApp disconnect event received from Redis:', event);
            await this.disconnectClient(event.userId);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('Received SIGINT, shutting down gracefully...');
            await this.shutdownAllClients();
            await redisEventSystem.shutdown();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('Received SIGTERM, shutting down gracefully...');
            await this.shutdownAllClients();
            await redisEventSystem.shutdown();
            process.exit(0);
        });
    }

    async initializeConnection(userId, connectionId) {
        try {
            console.log(`Initializing WhatsApp connection for user: ${userId}, connection: ${connectionId}`);

            // Update connection status to connecting
            await this.updateConnectionStatus(connectionId, 'connecting');

            // Check if user already has an active client
            if (clients.has(userId)) {
                const existingClient = clients.get(userId);
                if (existingClient.isConnected) {
                    await this.updateConnectionStatus(connectionId, 'connected');
                    return { success: true, status: 'connected' };
                } else {
                    // Clean up existing client
                    await this.cleanupClient(userId);
                }
            }

            // Create new client with MongoDB-based authentication
            const client = new Client({
                authStrategy: new LocalAuth({
                    clientId: userId.toString(),
                    dataPath: `./.wwebjs_auth/${userId}`
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor'
                    ]
                }
            });

            // Set up event listeners for this client
            this.setupClientEventListeners(client, userId, connectionId);

            // Store client reference
            clients.set(userId, client);
            connectionStatuses.set(userId, 'connecting');

            // Initialize the client
            await client.initialize();

            return { success: true, status: 'initializing' };

        } catch (error) {
            console.error(`Error initializing WhatsApp connection for user ${userId}:`, error);
            await this.updateConnectionStatus(connectionId, 'failed', error.message);
            return { success: false, error: error.message };
        }
    }

    setupClientEventListeners(client, userId, connectionId) {
        // QR Code event
        client.on('qr', async (qr) => {
            console.log(`QR Code received for user ${userId}`);
            await this.updateConnectionStatus(connectionId, 'qr_ready', null, qr);
            connectionStatuses.set(userId, 'qr_ready');
        });

        // Ready event
        client.on('ready', async () => {
            console.log(`[READY EVENT] WhatsApp client ready for user ${userId}`);
            console.log(`[READY EVENT] Client details:`, {
                userId,
                connectionId,
                isConnected: client.isConnected,
                clientState: client.getState?.() || 'unknown',
                hasMessageListener: client.listenerCount('message') > 0
            });

            // Force re-registration of message listeners for restored sessions
            console.log(`[READY EVENT] Re-registering message listeners for user ${userId}`);

            await this.updateConnectionStatus(connectionId, 'connected');
            connectionStatuses.set(userId, 'connected');
        });

        // Authentication failure
        client.on('auth_failure', async (msg) => {
            console.log(`Authentication failed for user ${userId}:`, msg);
            await this.updateConnectionStatus(connectionId, 'failed', msg);
            connectionStatuses.set(userId, 'failed');
            await this.cleanupClient(userId);
        });

        // Disconnected event
        client.on('disconnected', async (reason) => {
            console.log(`Client disconnected for user ${userId}:`, reason);
            await this.updateConnectionStatus(connectionId, 'disconnected');
            connectionStatuses.set(userId, 'disconnected');
            await this.cleanupClient(userId);
        });

        // Message event (for logging purposes)
        client.on('message', async (msg) => {
            console.log(`[MESSAGE EVENT] Message received from ${msg.from} for user ${userId}:`, msg.body);
            console.log(`[MESSAGE EVENT] Client connection status:`, {
                userId,
                connectionId,
                isConnected: client.isConnected,
                clientState: client.getState?.() || 'unknown'
            });

            // Emit message received event to Redis
            try {
                await redisEventSystem.emitMessageReceived(userId, msg.from, {
                    body: msg.body,
                    timestamp: msg.timestamp,
                    from: msg.from,
                    to: msg.to
                });
                console.log(`[MESSAGE EVENT] Successfully emitted to Redis for user ${userId}`);
            } catch (error) {
                console.error('Error emitting message received event:', error);
            }
        });

        // Additional event listeners to catch all message types
        client.on('message_create', async (msg) => {
            console.log(`[MESSAGE CREATE EVENT] Message created for user ${userId}:`, msg.body);
        });

        client.on('message_ack', async (msg, ack) => {
            console.log(`[MESSAGE ACK EVENT] Message ack for user ${userId}:`, ack);
        });

        // Error event
        client.on('error', async (error) => {
            console.error(`WhatsApp client error for user ${userId}:`, error);
            await this.updateConnectionStatus(connectionId, 'failed', error.message);
            connectionStatuses.set(userId, 'failed');
        });
    }

    async updateConnectionStatus(connectionId, status, errorMessage = null, qrCode = null) {
        try {
            const updateData = {
                status,
                lastActivity: new Date()
            };

            if (errorMessage) {
                updateData.errorMessage = errorMessage;
            }

            if (qrCode) {
                updateData.qrCode = qrCode;
            }

            await WhatsAppConnection.findOneAndUpdate(
                { connectionId },
                updateData,
                { new: true }
            );

            console.log(`Connection ${connectionId} status updated to: ${status}`);
        } catch (error) {
            console.error(`Error updating connection status for ${connectionId}:`, error);
        }
    }

    async cleanupClient(userId) {
        try {
            const client = clients.get(userId);
            if (client) {
                await client.destroy();
                clients.delete(userId);
                connectionStatuses.delete(userId);
                console.log(`Client cleaned up for user ${userId}`);
            }
        } catch (error) {
            console.error(`Error cleaning up client for user ${userId}:`, error);
        }
    }

    async disconnectClient(userId) {
        try {
            const client = clients.get(userId);
            if (client) {
                await client.destroy();
                clients.delete(userId);
                connectionStatuses.delete(userId);
                console.log(`Client disconnected for user ${userId}`);
            }
        } catch (error) {
            console.error(`Error disconnecting client for user ${userId}:`, error);
        }
    }

    async getClientStatus(userId) {
        const client = clients.get(userId);
        if (!client) {
            return { status: 'disconnected', isConnected: false };
        }

        return {
            status: connectionStatuses.get(userId) || 'unknown',
            isConnected: client.isConnected || false
        };
    }

    async sendMessage(userId, phoneNumber, message) {
        try {
            const client = clients.get(userId);
            if (!client || !client.isConnected) {
                throw new Error('WhatsApp client not connected');
            }

            // Format phone number (remove + and add @c.us suffix)
            const formattedNumber = phoneNumber.replace('+', '') + '@c.us';

            const result = await client.sendMessage(formattedNumber, message);
            console.log(`Message sent successfully to ${phoneNumber} for user ${userId}`);

            // Emit message sent event to Redis
            try {
                await redisEventSystem.emitMessageSent(userId, phoneNumber, result.id._serialized);
            } catch (error) {
                console.error('Error emitting message sent event:', error);
            }

            return { success: true, messageId: result.id._serialized };
        } catch (error) {
            console.error(`Error sending message for user ${userId}:`, error);
            throw error;
        }
    }

    async shutdownAllClients() {
        console.log('Shutting down all WhatsApp clients...');
        const disconnectPromises = Array.from(clients.keys()).map(userId =>
            this.disconnectClient(userId)
        );

        await Promise.all(disconnectPromises);
        console.log('All WhatsApp clients shut down');
    }

    // Method to manually trigger connection (for testing)
    async manualConnect(userId, connectionId) {
        return await this.initializeConnection(userId, connectionId);
    }

    // Method to get all active connections
    getActiveConnections() {
        const activeConnections = [];
        for (const [userId, status] of connectionStatuses) {
            const client = clients.get(userId);
            activeConnections.push({
                userId,
                status,
                isConnected: client ? client.isConnected : false,
                connectionId: client ? client.connectionId : null
            });
        }
        return activeConnections;
    }

    // Health check method
    async healthCheck() {
        try {
            const redisHealth = await redisHealthCheck();
            const mongoHealth = mongoose.connection.readyState === 1;

            return {
                service: 'whatsapp',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                redis: redisHealth,
                mongodb: {
                    status: mongoHealth ? 'connected' : 'disconnected',
                    readyState: mongoose.connection.readyState
                },
                activeConnections: this.getActiveConnections().length,
                totalClients: clients.size
            };
        } catch (error) {
            return {
                service: 'whatsapp',
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }
}

// Create and export singleton instance
const whatsAppService = new WhatsAppService();

// Export for use in other files
export default whatsAppService;

// If this file is run directly, start the service
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Starting WhatsApp service...');

    async function startService() {
        try {

            console.log(process.env.REDIS_URL)
            // Connect to MongoDB
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-admin');
            console.log('Connected to MongoDB');

            // Initialize the service
            await whatsAppService.initialize();
            console.log('WhatsApp service is running...');

            // Set up periodic health checks
            setInterval(async () => {
                const health = await whatsAppService.healthCheck();
                if (health.status === 'unhealthy') {
                    console.warn('Service health check failed:', health);
                }
            }, 30000); // Every 30 seconds

        } catch (error) {
            console.error('Failed to start WhatsApp service:', error);
            process.exit(1);
        }
    }

    startService();
}