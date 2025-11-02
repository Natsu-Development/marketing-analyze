/**
 * Middleware: Request Logger
 * NestJS-style HTTP request logging with color-coded status
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../../../infrastructure/shared/logger'

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
}

/**
 * Get status code color based on HTTP status
 */
function getStatusColor(statusCode: number): string {
    if (statusCode >= 500) return colors.red
    if (statusCode >= 400) return colors.yellow
    if (statusCode >= 300) return colors.cyan
    if (statusCode >= 200) return colors.green
    return colors.reset
}

/**
 * Get HTTP method color
 */
function getMethodColor(method: string): string {
    switch (method) {
        case 'GET':
            return colors.green
        case 'POST':
            return colors.yellow
        case 'PUT':
        case 'PATCH':
            return colors.cyan
        case 'DELETE':
            return colors.red
        default:
            return colors.reset
    }
}

/**
 * Format HTTP request log in NestJS style
 */
function formatHttpLog(method: string, path: string, statusCode: number, duration: number): string {
    const isDevelopment = process.env.NODE_ENV === 'development'

    if (isDevelopment) {
        const methodColor = getMethodColor(method)
        const statusColor = getStatusColor(statusCode)
        return `${methodColor}${method}${colors.reset} ${path} ${statusColor}${statusCode}${colors.reset} - ${duration}ms`
    }

    return `${method} ${path} ${statusCode} - ${duration}ms`
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()

    res.on('finish', () => {
        const duration = Date.now() - start

        // Skip webhook paths to reduce noise
        if (req.path.includes('webhooks')) {
            return
        }

        const logMessage = formatHttpLog(req.method, req.path, res.statusCode, duration)

        // Log with appropriate level based on status code
        if (res.statusCode >= 500) {
            logger.error({
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: `${duration}ms`,
                userAgent: req.get('user-agent'),
                ip: req.ip,
            }, logMessage)
        } else if (res.statusCode >= 400) {
            logger.warn({
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: `${duration}ms`,
                userAgent: req.get('user-agent'),
                ip: req.ip,
            }, logMessage)
        } else {
            logger.info({
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: `${duration}ms`,
            }, logMessage)
        }
    })

    next()
}
