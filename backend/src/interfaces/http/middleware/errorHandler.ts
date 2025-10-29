/**
 * Middleware: Error Handler
 * Global error handling middleware for Express
 */

import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../../../infrastructure/shared/logger'
import { DomainException } from '../../../domain/exceptions/DomainException'

const httpStatusMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    STATE_MISMATCH: 400,
    SCOPE_MISMATCH: 403,
    NO_CONNECTION: 404,
    TOKEN_EXPIRED: 401,
    NEEDS_RECONNECT: 422,
    REFRESH_FAILED: 422,
    EXTERNAL_SERVICE_ERROR: 502,
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): Response {
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        logger.warn({
            message: 'Validation error',
            errors: err.errors,
            path: req.path,
        })
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: err.errors,
        })
    }

    // Handle domain exceptions
    if (err instanceof DomainException) {
        const statusCode = httpStatusMap[err.code] || 500
        logger.warn({ message: err.message, code: err.code, path: req.path })
        return res.status(statusCode).json({
            success: false,
            error: err.code,
            message: err.message,
        })
    }

    // Handle unknown errors
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    })

    return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    })
}
