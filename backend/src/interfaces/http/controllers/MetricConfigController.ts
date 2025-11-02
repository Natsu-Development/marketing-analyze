/**
 * HTTP Controller: MetricConfigController
 * Handles HTTP requests for metric configuration endpoints
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { MetricConfigUseCase } from '../../../application/use-cases/metric-config'
import {
    jsonSuccess,
    jsonError,
    handleValidationError,
    handleInternalError,
    AdAccountIdParamSchema,
    UpsertMetricConfigSchema,
} from '../helpers'

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * PUT /api/metric-config/:adAccountId
 * Upserts metric configuration for an ad account
 */
export async function upsertMetricConfiguration(req: Request, res: Response): Promise<void> {
    try {
        // Validate path parameter
        const { adAccountId } = AdAccountIdParamSchema.parse(req.params)

        // Validate request body
        const metrics = UpsertMetricConfigSchema.parse(req.body)

        // Invoke use case
        const result = await MetricConfigUseCase.upsert({
            adAccountId,
            metrics,
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
 * GET /api/metric-config/:adAccountId
 * Retrieves metric configuration for an ad account (returns default if not found)
 */
export async function getMetricConfiguration(req: Request, res: Response): Promise<void> {
    try {
        // Validate path parameter
        const { adAccountId } = AdAccountIdParamSchema.parse(req.params)

        // Invoke use case
        const result = await MetricConfigUseCase.retrieve({ adAccountId })

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
