/**
 * Configuration: Database Connection
 * Sets up MongoDB connection using Mongoose
 */

import mongoose from 'mongoose'
import { logger } from '../infrastructure/shared/logger'

mongoose.set('strictQuery', false)

export async function connectDatabase(uri: string): Promise<void> {
    try {
        await mongoose.connect(uri)
        logger.info('✅ Connected to MongoDB')

        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error)
        })

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected')
        })
    } catch (error) {
        logger.error('❌ Failed to connect to MongoDB:', error)
        process.exit(1)
    }
}

export async function disconnectDatabase(): Promise<void> {
    await mongoose.connection.close()
    logger.info('MongoDB connection closed')
}
