/**
 * HTTP Controller: AdAccountSettingController
 * Handles HTTP requests for ad account setting endpoints
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { AdAccountSettingUseCase } from '../../../application/use-cases/ad-account-setting'
import {
    jsonSuccess,
    jsonError,
    handleValidationError,
    handleInternalError,
    AdAccountIdParamSchema,
    UpsertAdAccountSettingSchema,
} from '../helpers'

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * PUT /api/ad-account-settings/:adAccountId
 * Upserts ad account setting
 */
export async function upsertAdAccountSetting(req: Request, res: Response): Promise<void> {
    try {
        // Validate path parameter
        const { adAccountId } = AdAccountIdParamSchema.parse(req.params)

        // Validate request body
        const settings = UpsertAdAccountSettingSchema.parse(req.body)

        // Invoke use case
        const result = await AdAccountSettingUseCase.upsert({
            adAccountId,
            settings,
        })

        if (!result.success) {
            const statusCode = result.error === 'VALIDATION_ERROR' ? 400 : 500
            return jsonError(res, result.error || 'UPSERT_FAILED', statusCode, result.message)
        }

        return jsonSuccess(res, result.data)
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}

/**
 * GET /api/ad-account-settings/:adAccountId
 * Retrieves ad account setting (returns default if not found)
 */
export async function getAdAccountSetting(req: Request, res: Response): Promise<void> {
    try {
        // Validate path parameter
        const { adAccountId } = AdAccountIdParamSchema.parse(req.params)

        // Invoke use case
        const result = await AdAccountSettingUseCase.retrieve({ adAccountId })

        if (!result.success) {
            return jsonError(res, result.error || 'RETRIEVAL_FAILED', 500, result.message)
        }

        // Filter out undefined fields from response
        const filteredData = Object.fromEntries(
            Object.entries(result.data || {}).filter(([_, value]) => value !== undefined)
        )

        return jsonSuccess(res, filteredData)
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}
