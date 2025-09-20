import { connect, subscribe, publish, disconnect, getConnectionStatus, isReady, unsubscribe } from '../../redis.js';

class RedisEventSystem {
    constructor() {
        this.subscribers = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('Redis event system already initialized, skipping');
            return;
        }

        try {
            console.log('🔧 Redis Event System: Step 1 - Checking Redis connection status...');
            // Check if Redis is already connected
            if (getConnectionStatus()) {
                console.log('✅ Redis already connected, marking event system as initialized');
                this.isInitialized = true;
                // Start health monitoring
                console.log('🔧 Redis Event System: Starting health monitoring...');
                await this.startHealthMonitoring();
                console.log('✅ Redis Event System: Health monitoring started');
                return;
            }

            console.log('🔧 Redis Event System: Step 2 - Connecting to Redis...');
            await connect();
            console.log('✅ Redis Event System: Connected to Redis');
            
            this.isInitialized = true;
            console.log('✅ Redis event system initialized');

            // Start health monitoring
            console.log('🔧 Redis Event System: Starting health monitoring...');
            await this.startHealthMonitoring();
            console.log('✅ Redis Event System: Health monitoring started');
        } catch (error) {
            console.error('❌ Failed to initialize Redis event system:', error);
            // Don't throw error if Redis is already connected
            if (getConnectionStatus()) {
                this.isInitialized = true;
                console.log('✅ Redis event system marked as initialized (Redis was already connected)');
                // Start health monitoring
                console.log('🔧 Redis Event System: Starting health monitoring...');
                await this.startHealthMonitoring();
                console.log('✅ Redis Event System: Health monitoring started');
                return;
            }
            throw error;
        }
    }

    async recoverConnection() {
        try {
            console.log('Attempting to recover Redis connection...');

            // Reset initialization state
            this.isInitialized = false;

            // Wait a bit before attempting to reconnect
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Reinitialize
            await this.initialize();
            console.log('Redis connection recovered successfully');
        } catch (error) {
            console.error('Failed to recover Redis connection:', error);
            throw error;
        }
    }

    // Check if Redis is ready for operations
    isRedisReady() {
        return this.isInitialized && getConnectionStatus();
    }

    // Safely check if system is ready for operations
    async ensureReady() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!getConnectionStatus()) {
            throw new Error('Redis not connected');
        }

        return true;
    }

    async emitWhatsAppConnect(userId, connectionId) {
        try {
            await this.ensureReady();

            const event = {
                type: 'whatsapp:connect',
                userId: userId.toString(),
                connectionId,
                timestamp: new Date().toISOString()
            };

            await publish('whatsapp:events', event);
            console.log(`Emitted WhatsApp connect event for user ${userId}`);
        } catch (error) {
            console.error(`Failed to emit WhatsApp connect event for user ${userId}:`, error);
            // Try to recover connection if it's a connection issue
            if (error.message.includes('Redis not ready') || error.message.includes('Socket already opened')) {
                console.log('Attempting to recover Redis connection...');
                try {
                    await this.recoverConnection();
                    // Retry the event emission
                    await publish('whatsapp:events', {
                        type: 'whatsapp:connect',
                        userId: userId.toString(),
                        connectionId,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`Successfully emitted WhatsApp connect event for user ${userId} after recovery`);
                } catch (recoveryError) {
                    console.error('Failed to recover Redis connection:', recoveryError);
                    throw error; // Throw original error if recovery fails
                }
            } else {
                throw error;
            }
        }
    }

    async emitWhatsAppDisconnect(userId) {
        try {
            await this.ensureReady();

            const event = {
                type: 'whatsapp:disconnect',
                userId: userId.toString(),
                timestamp: new Date().toISOString()
            };

            await publish('whatsapp:events', event);
            console.log(`Emitted WhatsApp disconnect event for user ${userId}`);
        } catch (error) {
            console.error(`Failed to emit WhatsApp disconnect event for user ${userId}:`, error);
            throw error;
        }
    }

    async emitMessageSent(userId, phoneNumber, messageId) {
        try {
            await this.ensureReady();

            const event = {
                type: 'message:sent',
                userId: userId.toString(),
                phoneNumber,
                messageId,
                timestamp: new Date().toISOString()
            };

            await publish('whatsapp:events', event);
            console.log(`Emitted message sent event for user ${userId}`);
        } catch (error) {
            console.error(`Failed to emit message sent event for user ${userId}:`, error);
            throw error;
        }
    }

    async emitMessageReceived(userId, phoneNumber, message) {
        try {
            await this.ensureReady();

            const event = {
                type: 'message:received',
                userId: userId.toString(),
                phoneNumber,
                message,
                timestamp: new Date().toISOString()
            };

            await publish('whatsapp:events', event);
            console.log(`Emitted message received event for user ${userId}`);
        } catch (error) {
            console.error(`Failed to emit message received event for user ${userId}:`, error);
            throw error;
        }
    }

    async onWhatsAppConnect(callback) {
        try {
            await this.ensureReady();

            const handler = (event) => {
                if (event.type === 'whatsapp:connect') {
                    callback(event);
                }
            };

            this.subscribers.set('whatsapp:connect', handler);
            await subscribe('whatsapp:events', handler);
            console.log('Subscribed to WhatsApp connect events');
        } catch (error) {
            console.error('Failed to subscribe to WhatsApp connect events:', error);
            throw error;
        }
    }

    async onWhatsAppDisconnect(callback) {
        try {
            await this.ensureReady();

            const handler = (event) => {
                if (event.type === 'whatsapp:disconnect') {
                    callback(event);
                }
            };

            this.subscribers.set('whatsapp:disconnect', handler);
            await subscribe('whatsapp:events', handler);
            console.log('Subscribed to WhatsApp disconnect events');
        } catch (error) {
            console.error('Failed to subscribe to WhatsApp disconnect events:', error);
            throw error;
        }
    }

    async onMessageSent(callback) {
        try {
            await this.ensureReady();

            const handler = (event) => {
                if (event.type === 'message:sent') {
                    callback(event);
                }
            };

            this.subscribers.set('message:sent', handler);
            await subscribe('whatsapp:events', handler);
            console.log('Subscribed to message sent events');
        } catch (error) {
            console.error('Failed to subscribe to message sent events:', error);
            throw error;
        }
    }

    async onMessageReceived(callback) {
        try {
            await this.ensureReady();

            const handler = (event) => {
                if (event.type === 'message:received') {
                    callback(event);
                }
            };

            this.subscribers.set('message:received', handler);
            await subscribe('whatsapp:events', handler);
            console.log('Subscribed to message received events');
        } catch (error) {
            console.error('Failed to subscribe to message received events:', error);
            throw error;
        }
    }

    async unsubscribeAll() {
        if (!this.isInitialized) {
            return;
        }

        try {
            for (const [eventType, handler] of this.subscribers) {
                await unsubscribe('whatsapp:events');
            }
            this.subscribers.clear();
            console.log('Unsubscribed from all events');
        } catch (error) {
            console.error('Error unsubscribing from events:', error);
        }
    }

    async shutdown() {
        try {
            console.log('Shutting down Redis event system...');
            await this.unsubscribeAll();
            await disconnect();
            this.isInitialized = false;
            console.log('Redis event system shut down');
            // Stop health monitoring
            this.stopHealthMonitoring();
        } catch (error) {
            console.error('Error shutting down Redis event system:', error);
        }
    }

    // Graceful shutdown with timeout
    async gracefulShutdown(timeoutMs = 5000) {
        try {
            console.log(`Graceful shutdown initiated with ${timeoutMs}ms timeout...`);

            // Stop health monitoring first
            this.stopHealthMonitoring();

            // Set a timeout for the shutdown process
            const shutdownPromise = this.shutdown();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Shutdown timeout')), timeoutMs);
            });

            await Promise.race([shutdownPromise, timeoutPromise]);
            console.log('Redis event system gracefully shut down');
        } catch (error) {
            console.error('Graceful shutdown failed:', error);
            // Force shutdown if graceful shutdown fails
            try {
                await this.shutdown();
            } catch (forceError) {
                console.error('Force shutdown also failed:', forceError);
            }
        }
    }

    // Monitor Redis connection health
    async startHealthMonitoring(intervalMs = 30000) {
        if (this.healthMonitorInterval) {
            console.log('Health monitoring already active');
            return;
        }

        this.healthMonitorInterval = setInterval(async () => {
            try {
                const status = this.getStatus();

                if (!status.redisConnected || !status.redisReady) {
                    console.log('Redis health check failed, attempting recovery...');
                    await this.recoverConnection();
                } else {
                    console.log('Redis health check passed');
                }
            } catch (error) {
                console.error('Health monitoring error:', error);
            }
        }, intervalMs);

        console.log(`Redis health monitoring started with ${intervalMs}ms interval`);
    }

    // Stop health monitoring
    stopHealthMonitoring() {
        if (this.healthMonitorInterval) {
            clearInterval(this.healthMonitorInterval);
            this.healthMonitorInterval = null;
            console.log('Redis health monitoring stopped');
        }
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            redisConnected: getConnectionStatus(),
            redisReady: getConnectionStatus() && isReady(),
            subscriberCount: this.subscribers.size
        };
    }
}

// Create singleton instance
const redisEventSystem = new RedisEventSystem();

export default redisEventSystem;
