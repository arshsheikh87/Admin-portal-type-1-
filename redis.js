import { createClient } from 'redis';

// Redis clients - will be created lazily when needed
let client = null;
let publisher = null;
let subscriber = null;

// Function to create clients lazily
function ensureClients() {
    if (!client) {
        console.log('Creating Redis clients with URL:', process.env.REDIS_URL || 'redis://localhost:6379');

        client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('Redis max reconnection attempts reached');
                        return false;
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        // Create separate clients for pub/sub to avoid blocking
        publisher = client.duplicate();
        subscriber = client.duplicate();
    }
    return { client, publisher, subscriber };
}

// Connection status
let isConnected = false;

// Connect to Redis
async function connect() {
    try {
        // Check if already connected
        if (isConnected) {
            console.log('Redis already connected, skipping connection');
            return;
        }

        // Ensure clients are created
        const { client, publisher, subscriber } = ensureClients();

        // Check if clients are already connected
        if (client.isOpen && publisher.isOpen && subscriber.isOpen) {
            console.log('Redis clients already open, updating connection status');
            isConnected = true;
            return;
        }

        await client.connect();
        await publisher.connect();
        await subscriber.connect();
        isConnected = true;
        console.log('Connected to Redis');

        // Set up error handling
        client.on('error', (err) => {
            console.error('Redis client error:', err);
            isConnected = false;
        });

        publisher.on('error', (err) => {
            console.error('Redis publisher error:', err);
        });

        subscriber.on('error', (err) => {
            console.error('Redis subscriber error:', err);
        });

        // Handle reconnection
        client.on('reconnecting', () => {
            console.log('Redis reconnecting...');
        });

        client.on('connect', () => {
            console.log('Redis connected');
            isConnected = true;
        });

        // Handle disconnection
        client.on('disconnect', () => {
            console.log('Redis disconnected');
            isConnected = false;
        });

        publisher.on('disconnect', () => {
            console.log('Redis publisher disconnected');
        });

        subscriber.on('disconnect', () => {
            console.log('Redis subscriber disconnected');
        });

    } catch (error) {
        console.error('Redis connection error:', error);
        isConnected = false;
        throw error;
    }
}

// Check if Redis is ready for operations
function isReady() {
    if (!client || !publisher || !subscriber) {
        return false;
    }
    return isConnected && client.isOpen && publisher.isOpen && subscriber.isOpen;
}

// Subscribe to a channel
async function subscribe(channel, callback) {
    try {
        // Ensure clients are created first
        const { subscriber } = ensureClients();

        if (!isReady()) {
            throw new Error('Redis not ready for operations');
        }

        await subscriber.subscribe(channel, (message) => {
            try {
                const parsedMessage = JSON.parse(message);
                callback(parsedMessage);
            } catch (parseError) {
                console.error('Error parsing Redis message:', parseError);
                callback(message); // Fallback to raw message
            }
        });
        console.log(`Subscribed to channel: ${channel}`);
    } catch (error) {
        console.error(`Error subscribing to channel ${channel}:`, error);
        throw error;
    }
}

// Publish to a channel
async function publish(channel, message) {
    try {
        if (!isReady()) {
            throw new Error('Redis not ready for operations');
        }

        const { publisher } = ensureClients();
        const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
        await publisher.publish(channel, messageToSend);
        console.log(`Published to channel ${channel}: ${messageToSend}`);
    } catch (error) {
        console.error(`Error publishing to channel ${channel}:`, error);
        throw error;
    }
}

// Unsubscribe from a channel
async function unsubscribe(channel) {
    try {
        if (!isReady()) {
            return;
        }

        const { subscriber } = ensureClients();
        await subscriber.unsubscribe(channel);
        console.log(`Unsubscribed from channel ${channel}`);
    } catch (error) {
        console.error(`Error unsubscribing from channel ${channel}:`, error);
        throw error;
    }
}

// Close Redis connections
async function disconnect() {
    try {
        isConnected = false;
        const { client, publisher, subscriber } = ensureClients();
        await client.quit();
        await publisher.quit();
        await subscriber.quit();
        console.log('Disconnected from Redis');
    } catch (error) {
        console.error('Error disconnecting from Redis:', error);
        throw error;
    }
}

// Graceful shutdown handler
async function gracefulShutdown() {
    console.log('Graceful shutdown initiated...');
    try {
        await disconnect();
        console.log('Redis gracefully shut down');
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
    }
}

// Handle process exit signals
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await gracefulShutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await gracefulShutdown();
    process.exit(0);
});

process.on('exit', () => {
    console.log('Process exiting, Redis connections should be closed');
});

// Safely reconnect Redis
async function reconnect() {
    try {
        console.log('Attempting to reconnect Redis...');

        // Reset connection status
        isConnected = false;

        // Close existing connections if they exist
        const { client, publisher, subscriber } = ensureClients();
        if (client.isOpen) {
            await client.quit();
        }
        if (publisher.isOpen) {
            await publisher.quit();
        }
        if (subscriber.isOpen) {
            await subscriber.quit();
        }

        // Wait a bit before reconnecting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reconnect
        await connect();
        console.log('Redis reconnected successfully');
    } catch (error) {
        console.error('Failed to reconnect Redis:', error);
        throw error;
    }
}

// Connect with retry logic
async function connectWithRetry(maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await connect();
            return; // Success
        } catch (error) {
            console.error(`Redis connection attempt ${attempt} failed:`, error);

            if (attempt === maxRetries) {
                throw error; // Last attempt failed
            }

            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Check connection status
function getConnectionStatus() {
    return isConnected;
}

// Get detailed connection info
function getConnectionInfo() {
    const { client, publisher, subscriber } = ensureClients();
    return {
        isConnected,
        clientOpen: client.isOpen,
        publisherOpen: publisher.isOpen,
        subscriberOpen: subscriber.isOpen,
        allReady: isConnected && client.isOpen && publisher.isOpen && subscriber.isOpen
    };
}

// Health check
async function healthCheck() {
    try {
        if (!isReady()) {
            return { status: 'disconnected', error: 'Redis not ready for operations' };
        }

        const { client } = ensureClients();
        const pong = await client.ping();
        return { status: 'healthy', pong };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}

// Get client instance (for external use)
function getClient() {
    const { client } = ensureClients();
    return client;
}

export {
    connect,
    connectWithRetry,
    subscribe,
    publish,
    unsubscribe,
    disconnect,
    gracefulShutdown,
    reconnect,
    getConnectionStatus,
    getConnectionInfo,
    isReady,
    healthCheck,
    getClient
};
