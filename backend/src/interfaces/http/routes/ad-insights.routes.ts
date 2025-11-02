/**
 * Ad Insights Routes
 * Endpoints for managing ad insights exports
 */

import { Router } from 'express'
import { CronSchedulerService } from '../../../application/services/cron-scheduler'
import { logger } from '../../../infrastructure/shared/logger'
import { jsonSuccess, jsonError } from '../helpers/response-helpers'

export const adInsightsRoutes = Router()

/**
 * POST /api/v1/ad-insights/export
 * Manually trigger an ad insights export
 */
adInsightsRoutes.post('/export', async (_req, res) => {
    try {
        await CronSchedulerService.runAdInsightsExportNow()
        await CronSchedulerService.runAdSetSyncNow()
        return jsonSuccess(res, { message: 'Ad insights and adsets sync completed successfully' })
    } catch (error) {
        logger.error({ error }, 'Export failed')
        return jsonError(res, 'Failed to run ad insights export', 500)
    }
})
