/**
 * Express Application Setup
 * Configures Express app with middleware and routes
 * Uses direct imports - no dependency injection needed
 */

import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { appConfig } from './config/env'
import { apiRouter } from './interfaces/http/routes'
import { requestLogger } from './interfaces/http/middleware/requestLogger'
import { errorHandler } from './interfaces/http/middleware/errorHandler'

// Import dependencies to ensure initialization
import './config/dependencies'

/**
 * Creates and configures Express application
 */
export function createApp(): Application {
    const app = express()

    // ========================================================================
    // Security Middleware
    // ========================================================================
    app.use(
        helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
        })
    )

    // ========================================================================
    // CORS Configuration
    // ========================================================================
    app.use(
        cors({
            origin: appConfig.cors.allowedOrigins,
            credentials: true,
        })
    )

    // ========================================================================
    // Body Parsing Middleware
    // ========================================================================
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // ========================================================================
    // Request Logging
    // ========================================================================
    app.use(requestLogger)

    // ========================================================================
    // Health Check
    // ========================================================================
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'marketing-analyze-backend',
        })
    })

    // ========================================================================
    // API Routes
    // ========================================================================
    app.use('/api', apiRouter)

    // ========================================================================
    // 404 Handler
    // ========================================================================
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: 'Endpoint not found',
        })
    })

    // ========================================================================
    // Error Handler (must be last)
    // ========================================================================
    app.use(errorHandler)

    return app
}
