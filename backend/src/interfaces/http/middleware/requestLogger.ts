/**
 * Middleware: Request Logger
 * Logs incoming HTTP requests
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../../../infrastructure/logger'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()

    res.on('finish', () => {
        const duration = Date.now() - start
        if (!req.path.includes('webhooks')) {
            logger.info({
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration: `${duration}ms`,
                userAgent: req.get('user-agent'),
            })
        }
    })

    next()
}
