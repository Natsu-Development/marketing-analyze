/**
 * HTTP Controller: FacebookAuthController
 * Handles HTTP requests for Facebook authentication endpoints
 * Uses direct imports instead of dependency injection
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { FacebookAuthUseCase } from '../../../application/use-cases/facebook-auth'
import {
    jsonSuccess,
    jsonError,
    buildRedirectUrl,
    handleValidationError,
    handleInternalError,
    SessionActionSchema,
    CallbackQuerySchema,
} from '../helpers'

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * POST /api/auth/facebook/session
 * Initiates connection or disconnects
 */
export async function handleSession(req: Request, res: Response): Promise<void> {
    try {
        const body = SessionActionSchema.parse(req.body)

        if (body.action === 'connect') {
            const result = await FacebookAuthUseCase.initiateConnection({})
            if (!result.success) {
                return jsonError(res, result.error || 'FAILED_TO_GENERATE_AUTH_URL', 500)
            }
            return jsonSuccess(res, {
                redirectUrl: result.redirectUrl,
                state: result.state,
            })
        }

        if (!body.accountId) {
            return jsonError(res, 'ACCOUNT_ID_REQUIRED', 400)
        }

        const result = await FacebookAuthUseCase.disconnect({ accountId: body.accountId })
        if (!result.success) {
            return jsonError(res, result.error || 'DISCONNECT_FAILED', 400)
        }
        
        return jsonSuccess(res, { message: result.message })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}

/**
 * GET /api/auth/facebook/callback
 * Handles OAuth callback from Facebook
 */
export async function handleCallback(req: Request, res: Response): Promise<void> {
    try {
        const { code, state } = CallbackQuerySchema.parse(req.query)

        const result = await FacebookAuthUseCase.handleCallback({
            code,
            state,
        })

        if (result.success) {
            return res.redirect(buildRedirectUrl('success'))
        }

        return res.redirect(buildRedirectUrl('error', result.error))
    } catch (error) {
        return res.redirect(buildRedirectUrl('error', 'UNKNOWN_ERROR'))
    }
}

