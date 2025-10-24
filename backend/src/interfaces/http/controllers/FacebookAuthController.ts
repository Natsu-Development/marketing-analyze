/**
 * HTTP Controller: FacebookAuthController
 * Handles HTTP requests for Facebook authentication endpoints
 * Uses direct imports instead of dependency injection
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import * as facebookAuth from '../../../application/use-cases/facebookAuth'
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
            const result = await facebookAuth.initiateConnection({})
            if (!result.success) {
                return jsonError(res, result.error || 'FAILED_TO_GENERATE_AUTH_URL', 500)
            }
            return jsonSuccess(res, {
                redirectUrl: result.redirectUrl,
                state: result.state,
            })
        }

        if (!body.fbUserId) {
            return jsonError(res, 'FB_USER_ID_REQUIRED', 400)
        }

        const result = await facebookAuth.disconnect({ fbUserId: body.fbUserId })
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

        const result = await facebookAuth.handleCallback({
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

/**
 * GET /api/auth/facebook/status
 * Returns current connection status
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
    try {
        const fbUserId = req.query.fbUserId as string

        if (!fbUserId) {
            return jsonError(res, 'FB_USER_ID_REQUIRED', 400)
        }

        const result = await facebookAuth.getStatus({ fbUserId })
        if (!result.success) {
            const statusCode = result.error === 'NO_CONNECTION' ? 404 : 500
            return jsonError(res, result.error || 'STATUS_ERROR', statusCode)
        }

        return jsonSuccess(res, {
            status: result.status,
            fbUserId: result.fbUserId,
            expiresAt: result.expiresAt,
            needsRefresh: result.needsRefresh,
            adAccountsCount: result.adAccountsCount,
        })
    } catch (error: any) {
        return handleInternalError(res, error)
    }
}

/**
 * GET /api/auth/facebook/token
 * Returns a valid access token (internal use)
 */
export async function getToken(req: Request, res: Response): Promise<void> {
    try {
        const fbUserId = req.query.fbUserId as string

        if (!fbUserId) {
            return jsonError(res, 'FB_USER_ID_REQUIRED', 400)
        }

        const result = await facebookAuth.getToken({ fbUserId })

        if (!result.success) {
            const statusCode = result.error === 'NO_CONNECTION' ? 404 : 400
            return jsonError(res, result.error || 'TOKEN_ERROR', statusCode)
        }

        return jsonSuccess(res, {
            accessToken: result.accessToken,
            expiresAt: result.expiresAt,
        })
    } catch (error: any) {
        return handleInternalError(res, error)
    }
}

/**
 * POST /api/auth/facebook/:userId/refresh-ad-accounts
 * Refreshes ad accounts for a user
 */
export async function refreshAdAccounts(req: Request, res: Response): Promise<void> {
    try {
        const fbUserId = req.params.userId

        if (!fbUserId) {
            return jsonError(res, 'FB_USER_ID_REQUIRED', 400)
        }

        const result = await facebookAuth.refreshAdAccounts({ fbUserId })

        if (!result.success) {
            const statusCode = result.error === 'NO_CONNECTION' ? 404 : 422
            return jsonError(res, result.error || 'REFRESH_FAILED', statusCode)
        }

        return jsonSuccess(res, {
            message: 'Ad accounts refreshed successfully',
            adAccountsCount: result.adAccountsCount,
            connection: result.connection,
        })
    } catch (error: any) {
        return handleInternalError(res, error)
    }
}

/**
 * PUT /api/auth/facebook/:userId/ad-accounts/:adAccountId/active
 * Updates the active status of a specific ad account
 */
export async function updateAdAccountActive(req: Request, res: Response): Promise<void> {
    try {
        const fbUserId = req.params.userId
        const adAccountId = req.params.adAccountId
        const { isActive } = req.body

        if (!fbUserId) {
            return jsonError(res, 'FB_USER_ID_REQUIRED', 400)
        }

        if (!adAccountId) {
            return jsonError(res, 'AD_ACCOUNT_ID_REQUIRED', 400)
        }

        if (typeof isActive !== 'boolean') {
            return jsonError(res, 'IS_ACTIVE_REQUIRED', 400)
        }

        const result = await facebookAuth.setAdAccountActive({
            fbUserId,
            adAccountId,
            isActive,
        })

        if (!result.success) {
            let statusCode = 422
            if (result.error === 'NO_CONNECTION') statusCode = 404
            if (result.error === 'AD_ACCOUNT_NOT_FOUND') statusCode = 404

            return jsonError(res, result.error || 'UPDATE_FAILED', statusCode)
        }

        return jsonSuccess(res, {
            message: `Ad account ${isActive ? 'activated' : 'deactivated'} successfully`,
            connection: result.connection,
        })
    } catch (error: any) {
        return handleInternalError(res, error)
    }
}
