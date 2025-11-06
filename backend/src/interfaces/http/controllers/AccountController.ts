/**
 * HTTP Controller: AccountController
 * Handles HTTP requests for account endpoints
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { accountRepository } from '../../../config/dependencies'
import { AccountUseCase } from '../../../application/use-cases/account'
import {
    jsonSuccess,
    jsonError,
    handleValidationError,
    handleInternalError,
} from '../helpers'

// ============================================================================
// Validation Schemas
// ============================================================================

const AccountIdParamSchema = z.object({
    accountId: z.string().min(1, 'Account ID is required'),
})

const AdAccountIdParamSchema = z.object({
    accountId: z.string().min(1, 'Account ID is required'),
    adAccountId: z.string().min(1, 'Ad Account ID is required'),
})

const UpdateActiveStatusSchema = z.object({
    isActive: z.boolean({
        required_error: 'isActive is required',
        invalid_type_error: 'isActive must be a boolean',
    }),
})

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * GET /api/accounts/:accountId
 * Retrieves account information by account ID (excluding sensitive data)
 */
export async function getAccountInfo(req: Request, res: Response): Promise<void> {
    try {
        // Validate path parameter
        const { accountId } = AccountIdParamSchema.parse(req.params)

        // Fetch account from repository
        const account = await accountRepository.findByAccountId(accountId)

        if (!account) {
            return jsonError(res, 'NOT_FOUND', 404, `Account with ID '${accountId}' not found`)
        }

        // Transform response to exclude sensitive fields (accessToken, scopes)
        const safeAccount = {
            id: account.id,
            accountId: account.accountId,
            status: account.status,
            connectedAt: account.connectedAt,
            expiresAt: account.expiresAt,
            lastErrorCode: account.lastErrorCode,
            adAccounts: account.adAccounts,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        }

        return jsonSuccess(res, safeAccount)
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}

/**
 * POST /api/accounts/:accountId/refresh-ad-accounts
 * Refreshes ad accounts for an account
 */
export async function refreshAdAccounts(req: Request, res: Response): Promise<void> {
    try {
        // Validate path parameter
        const { accountId } = AccountIdParamSchema.parse(req.params)

        // Invoke use case
        const result = await AccountUseCase.refreshAdAccounts({ accountId })

        if (!result.success) {
            const statusCode = result.error === 'NO_CONNECTION' ? 404 : 422
            return jsonError(res, result.error || 'REFRESH_FAILED', statusCode, result.message)
        }

        return jsonSuccess(res, {
            message: 'Ad accounts refreshed successfully',
            adAccountsCount: result.adAccountsCount,
            account: result.account,
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}

/**
 * PUT /api/accounts/:accountId/ad-accounts/:adAccountId/active
 * Updates the active status of a specific ad account
 */
export async function updateAdAccountActive(req: Request, res: Response): Promise<void> {
    try {
        // Validate path parameters
        const { accountId, adAccountId } = AdAccountIdParamSchema.parse(req.params)

        // Validate request body
        const { isActive } = UpdateActiveStatusSchema.parse(req.body)

        // Invoke use case
        const result = await AccountUseCase.setAdAccountActive({
            accountId,
            adAccountId,
            isActive,
        })

        if (!result.success) {
            let statusCode = 422
            if (result.error === 'NO_CONNECTION') statusCode = 404
            if (result.error === 'AD_ACCOUNT_NOT_FOUND') statusCode = 404

            return jsonError(res, result.error || 'UPDATE_FAILED', statusCode, result.message)
        }

        return jsonSuccess(res, {
            message: `Ad account ${isActive ? 'activated' : 'deactivated'} successfully`,
            account: result.account,
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}
