/**
 * HTTP Controller: AdSetController
 * Handles HTTP requests for adset endpoints
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { adSetRepository } from '../../../config/dependencies'
import { jsonSuccess, handleValidationError, handleInternalError } from '../helpers'

// ============================================================================
// Validation Schemas
// ============================================================================

const AdSetListQuerySchema = z.object({
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
})

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * GET /api/adsets?limit=20&offset=0
 * Retrieves adsets with pagination, sorted by lastScaledAt descending
 */
export async function getAdSets(req: Request, res: Response): Promise<void> {
    try {
        // Validate query parameters
        const { limit, offset } = AdSetListQuerySchema.parse(req.query)

        // Fetch paginated adsets from repository
        const result = await adSetRepository.findAllWithPagination(limit, offset)

        return jsonSuccess(res, {
            count: result.adsets.length,
            total: result.total,
            limit,
            offset,
            adsets: result.adsets.map((adset) => ({
                adsetId: adset.adsetId,
                adsetName: adset.adsetName,
                adAccountId: adset.adAccountId,
                campaignName: adset.campaignName,
                status: adset.status,
                dailyBudget: adset.dailyBudget,
                lastScaledAt: adset.lastScaledAt,
            })),
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}
