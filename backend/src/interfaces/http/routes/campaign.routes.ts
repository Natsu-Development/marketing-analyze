/**
 * Campaign Routes
 */

import { Router } from 'express'
import * as campaignController from '../controllers/CampaignController'
import * as CampaignSyncUseCase from '../../../application/use-cases/campaign-sync'
import { logger } from '../../../infrastructure/shared/logger'
import { jsonSuccess, jsonError } from '../helpers/response-helpers'

export const campaignRoutes = Router()

// Get campaigns with pagination
campaignRoutes.get('/', campaignController.getCampaigns)

// Manual campaign sync
campaignRoutes.post('/sync', async (_req, res) => {
    try {
        logger.info('Manual campaign sync triggered via API')
        const result = await CampaignSyncUseCase.sync()

        if (result.success) {
            return jsonSuccess(res, {
                message: 'Campaign sync completed successfully',
                campaignsFetched: result.campaignsFetched,
            })
        } else {
            return jsonError(res, `Sync completed with errors: ${result.errors?.join(', ')}`, 500)
        }
    } catch (error) {
        logger.error({ error }, 'Campaign sync failed')
        return jsonError(res, `Failed to run campaign sync: ${(error as Error).message}`, 500)
    }
})
