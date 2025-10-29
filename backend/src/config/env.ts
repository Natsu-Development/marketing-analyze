/**
 * Configuration: Environment Variables
 * Validates and exports environment configuration
 */

import { z } from 'zod'
import { config } from 'dotenv'

// Load environment variables
config()

const EnvSchema = z.object({
    // Server
    PORT: z.string().default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // MongoDB
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    // Facebook OAuth
    FACEBOOK_APP_ID: z.string().min(1, 'FACEBOOK_APP_ID is required'),
    FACEBOOK_APP_SECRET: z.string().min(1, 'FACEBOOK_APP_SECRET is required'),
    FACEBOOK_REDIRECT_URI: z.string().url('FACEBOOK_REDIRECT_URI must be a valid URL'),
    FACEBOOK_API_VERSION: z.string().default('v19.0'),

    // Security
    ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),

    // Token Configuration
    TOKEN_REFRESH_WINDOW_MINUTES: z.string().default('5'),

    // CORS
    ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),

    // Frontend
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

    // Logging
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

    // Cron
    AD_INSIGHTS_CRON_SCHEDULE: z.string().default('0 2 * * *'),
})

function validateEnv() {
    try {
        const env = EnvSchema.parse(process.env)
        return env
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Environment validation failed:')
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`)
            })
            process.exit(1)
        }
        throw error
    }
}

export const env = validateEnv()

export const appConfig = {
    server: {
        port: parseInt(env.PORT, 10),
        nodeEnv: env.NODE_ENV,
    },
    database: {
        uri: env.MONGODB_URI,
    },
    facebook: {
        appId: env.FACEBOOK_APP_ID,
        appSecret: env.FACEBOOK_APP_SECRET,
        redirectUri: env.FACEBOOK_REDIRECT_URI,
        apiVersion: env.FACEBOOK_API_VERSION,
    },
    security: {
        encryptionKey: env.ENCRYPTION_KEY,
    },
    tokenRefresh: {
        windowMinutes: parseInt(env.TOKEN_REFRESH_WINDOW_MINUTES, 10),
    },
    cors: {
        allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
    },
    frontend: {
        url: env.FRONTEND_URL,
    },
    rateLimit: {
        windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
        maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
    },
    logging: {
        level: env.LOG_LEVEL,
    },
    cron: {
        adInsightsSchedule: env.AD_INSIGHTS_CRON_SCHEDULE,
    },
}
