/**
 * AdSet Insights Routes
 * Endpoints for managing adset insights exports
 */

import { Router } from 'express'
import { FacebookSyncAdSetInsightsUseCase } from '../../../application/use-cases/facebook-sync-adset-insights'
import { logger } from '../../../infrastructure/shared/logger'
import { jsonSuccess, jsonError } from '../helpers/response-helpers'

export const adsetInsightsRoutes = Router()

/**
 * POST /api/v1/adset-insights/sync
 * Manually trigger an adset insights sync
 */
adsetInsightsRoutes.post('/sync', async (_req, res) => {
    try {
        logger.info('Manual adset insights sync triggered via API')
        const result = await FacebookSyncAdSetInsightsUseCase.sync()

        if (result.success) {
            return jsonSuccess(res, {
                message: 'AdSet insights sync completed successfully',
                exportsCreated: result.exportsCreated,
                adAccountIds: result.adAccountIds,
            })
        } else {
            return jsonError(res, `Sync completed with errors: ${result.errors?.join(', ')}`, 500)
        }
    } catch (error) {
        logger.error({ error }, 'AdSet insights sync failed')
        return jsonError(res, `Failed to run adset insights sync: ${(error as Error).message}`, 500)
    }
})
