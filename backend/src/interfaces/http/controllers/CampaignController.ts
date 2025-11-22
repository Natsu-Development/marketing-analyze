/**
 * HTTP Controller: CampaignController
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { campaignRepository } from '../../../config/dependencies'
import { jsonSuccess, handleValidationError, handleInternalError } from '../helpers'

const GetCampaignsQuerySchema = z.object({
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
})

/**
 * GET /api/campaigns?limit=20&offset=0
 */
export async function getCampaigns(req: Request, res: Response): Promise<void> {
    try {
        const { limit, offset } = GetCampaignsQuerySchema.parse(req.query)
        const result = await campaignRepository.findAllPaginated(limit, offset)

        return jsonSuccess(res, {
            count: result.campaigns.length,
            total: result.total,
            limit,
            offset,
            campaigns: result.campaigns,
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}
