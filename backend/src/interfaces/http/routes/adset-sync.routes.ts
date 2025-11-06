/**
 * AdSet Sync Routes
 * Endpoints for managing adset metadata sync
 */

import { Router } from 'express'
import { FacebookSyncAdSetUseCase } from '../../../application/use-cases/facebook-sync-adset'
import { logger } from '../../../infrastructure/shared/logger'
import { jsonSuccess, jsonError } from '../helpers/response-helpers'

export const adsetSyncRoutes = Router()

/**
 * POST /api/v1/adset-sync/sync
 * Manually trigger an adset metadata sync
 */
adsetSyncRoutes.post('/sync', async (_req, res) => {
    try {
        logger.info('Manual adset metadata sync triggered via API')
        const result = await FacebookSyncAdSetUseCase.sync()

        if (result.success) {
            return jsonSuccess(res, {
                message: 'AdSet metadata sync completed successfully',
                adAccountsSynced: result.adAccountsSynced,
                adsetsSynced: result.adsetsSynced,
            })
        } else {
            return jsonError(res, `Sync completed with errors: ${result.errors?.join(', ')}`, 500)
        }
    } catch (error) {
        logger.error({ error }, 'AdSet metadata sync failed')
        return jsonError(res, `Failed to run adset metadata sync: ${(error as Error).message}`, 500)
    }
})
