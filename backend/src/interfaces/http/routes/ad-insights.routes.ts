/**
 * Ad Insights Routes
 * Endpoints for managing ad insights exports
 */

import { Router } from 'express'
import { CronSchedulerService } from '../../../application/services/cronScheduler'
import { logger } from '../../../infrastructure/shared/logger'
import { jsonSuccess, jsonError } from '../helpers/responseHelpers'

export const adInsightsRoutes = Router()

/**
 * POST /api/v1/ad-insights/export
 * Manually trigger an ad insights export
 */
adInsightsRoutes.post('/export', async (_req, res) => {
    try {
        logger.info('Manual ad insights export triggered')
        await CronSchedulerService.runAdInsightsExportNow()
        return jsonSuccess(res, { message: 'Ad insights export completed successfully' })
    } catch (error) {
        logger.error('Failed to run ad insights export:', error)
        return jsonError(res, 'Failed to run ad insights export', 500)
    }
})
