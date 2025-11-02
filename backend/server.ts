/**
 * Server Entry Point
 * Starts the Express server and initializes all services
 */

import { createApp } from './src/app'
import { appConfig } from './src/config/env'
import { connectDatabase } from './src/config/database'
import { logger } from './src/infrastructure/shared/logger'
import { startAllCronJobs, stopAllCronJobs } from './src/application/services/cron-scheduler'

async function bootstrap() {
    try {
        logger.info('Starting Marketing Analytics Backend')

        // Connect to database
        await connectDatabase(appConfig.database.uri)

        // Start cron jobs
        startAllCronJobs()

        // Create Express app
        const app = createApp()

        // Start HTTP server
        const server = app.listen(appConfig.server.port, () => {
            logger.info(`Server running on port ${appConfig.server.port}`)
            logger.info(`Environment: ${appConfig.server.nodeEnv}`)
        })

        // Graceful shutdown
        const gracefulShutdown = async (signal: string) => {
            logger.info(`${signal} received, starting graceful shutdown`)

            // Stop accepting new connections
            server.close(async () => {
                // Stop all cron jobs
                stopAllCronJobs()

                // Close database connection
                const mongoose = await import('mongoose')
                await mongoose.default.connection.close()

                logger.info('Graceful shutdown complete')
                process.exit(0)
            })

            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger.error('Forceful shutdown after timeout')
                process.exit(1)
            }, 30000)
        }

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
        process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    } catch (error) {
        logger.error({ error }, 'Failed to start server')
        process.exit(1)
    }
}

// Start the server
bootstrap()
