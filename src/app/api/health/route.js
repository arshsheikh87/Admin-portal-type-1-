import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { healthCheck as redisHealthCheck } from '../../../../redis.js';
import connectDB from '@/lib/mongodb';

export async function GET(request) {
    try {
        // Check if user is authenticated (optional for health checks)
        let isAuthenticated = false;
        let user = null;

        try {
            const session = await getServerSession(authOptions);
            if (session && session.user) {
                isAuthenticated = true;
                user = session.user;
            }
        } catch (authError) {
            // Auth check failed, continue with basic health check
        }

        // Basic health checks
        const healthChecks = {
            timestamp: new Date().toISOString(),
            service: 'whatsapp-admin-portal',
            status: 'healthy',
            checks: {}
        };

        // Redis health check
        try {
            const redisHealth = await redisHealthCheck();
            healthChecks.checks.redis = redisHealth;

            if (redisHealth.status !== 'healthy') {
                healthChecks.status = 'degraded';
            }
        } catch (error) {
            healthChecks.checks.redis = {
                status: 'unhealthy',
                error: error.message
            };
            healthChecks.status = 'unhealthy';
        }

        // MongoDB health check
        try {
            await connectDB();
            const mongoHealth = {
                status: 'healthy',
                connection: 'connected'
            };
            healthChecks.checks.mongodb = mongoHealth;
        } catch (error) {
            healthChecks.checks.mongodb = {
                status: 'unhealthy',
                error: error.message
            };
            healthChecks.status = 'unhealthy';
        }

        // Environment check
        const requiredEnvVars = [
            'MONGODB_URI',
            'NEXTAUTH_SECRET',
            'NEXTAUTH_URL'
        ];

        const envCheck = {};
        for (const envVar of requiredEnvVars) {
            envCheck[envVar] = process.env[envVar] ? 'set' : 'missing';
        }

        if (Object.values(envCheck).includes('missing')) {
            healthChecks.status = 'degraded';
        }
        healthChecks.checks.environment = envCheck;

        // Authentication status
        healthChecks.checks.authentication = {
            status: isAuthenticated ? 'authenticated' : 'unauthenticated',
            user: isAuthenticated ? { email: user.email, id: user.id } : null
        };

        // Determine overall status
        if (healthChecks.status === 'healthy' && healthChecks.checks.redis.status === 'healthy' && healthChecks.checks.mongodb.status === 'healthy') {
            healthChecks.status = 'healthy';
        } else if (healthChecks.status === 'healthy' && (healthChecks.checks.redis.status === 'unhealthy' || healthChecks.checks.mongodb.status === 'unhealthy')) {
            healthChecks.status = 'unhealthy';
        }

        // Set appropriate HTTP status code
        const statusCode = healthChecks.status === 'healthy' ? 200 :
            healthChecks.status === 'degraded' ? 200 : 503;

        return NextResponse.json(healthChecks, { status: statusCode });

    } catch (error) {
        console.error('Health check error:', error);

        const errorResponse = {
            timestamp: new Date().toISOString(),
            service: 'whatsapp-admin-portal',
            status: 'unhealthy',
            error: error.message,
            checks: {
                system: {
                    status: 'unhealthy',
                    error: 'Health check system failure'
                }
            }
        };

        return NextResponse.json(errorResponse, { status: 503 });
    }
}
