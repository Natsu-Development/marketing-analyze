/**
 * HTTP Response Helpers
 * Reusable functional utilities for consistent API responses
 */

import { Response } from 'express'

// Success response builder
export const jsonSuccess = (res: Response, data: any, status = 200): void => {
    res.status(status).json({ success: true, ...data })
}

// Error response builder
export const jsonError = (res: Response, error: string, status = 400, details?: any): void => {
    res.status(status).json({
        success: false,
        error,
        ...(details && { details }),
    })
}

// Frontend URL getter
export const getFrontendUrl = (): string => process.env.FRONTEND_URL || 'http://localhost:5173'

// Redirect URL builder for OAuth callback
export const buildRedirectUrl = (status: string, reason?: string): string => {
    const url = new URL('/account', getFrontendUrl())
    url.searchParams.set('auth', 'facebook')
    url.searchParams.set('status', status)
    if (reason) url.searchParams.set('reason', reason)
    return url.toString()
}

// Generic validation error handler
export const handleValidationError = (res: Response, error: any, details?: any): void => {
    jsonError(res, 'VALIDATION_ERROR', 400, details || error.errors)
}

// Generic internal error handler
export const handleInternalError = (res: Response, error: any): void => {
    jsonError(res, error.message || 'INTERNAL_ERROR', 500)
}
