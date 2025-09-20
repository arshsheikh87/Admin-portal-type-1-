import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import { connect, publish, subscribe, getConnectionStatus } from './redis.js';

async function testRedis() {
    try {
        console.log('Testing Redis connection...');
        console.log('Redis URL:', process.env.REDIS_URL);
        
        await connect();
        console.log('✅ Redis connected successfully');
        console.log('Connection status:', getConnectionStatus());
        
        // Test publish
        await publish('test:channel', { message: 'Hello Redis!' });
        console.log('✅ Published test message');
        
        // Test subscribe
        await subscribe('test:channel', (data) => {
            console.log('✅ Received message:', data);
        });
        
        console.log('✅ Redis is working properly');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Redis test failed:', error);
        process.exit(1);
    }
}

testRedis();