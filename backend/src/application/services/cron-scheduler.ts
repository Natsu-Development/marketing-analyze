/**
 * Cron Scheduler Service
 * Schedules and manages cron jobs for periodic tasks
 */

import * as cron from 'node-cron'
import { logger } from '../../infrastructure/shared/logger'
import { AdInsightUseCase } from '../use-cases/sync-ad-insights'
// Note: We use process.env directly here instead of appConfig to avoid circular dependencies

let adInsightsJob: cron.ScheduledTask | null = null

/**
 * Start the ad insights export cron job
 * Default schedule: Every day at 2 AM (can be configured via env)
 */
export function startAdInsightsCron(): void {
    const schedule = process.env.AD_INSIGHTS_CRON_SCHEDULE || '0 2 * * *' // Default: 2 AM daily (second is optional)

    logger.info(`Starting ad insights cron: ${schedule}`)

    if (!cron.validate(schedule)) {
        logger.error(`Invalid cron schedule: ${schedule}`)
        throw new Error(`Invalid cron schedule: ${schedule}`)
    }

    adInsightsJob = cron.schedule(schedule, async () => {
        logger.info('Running scheduled ad insights export')
        try {
            const result = await AdInsightUseCase.startImportAsync()
            if (result.success) {
                logger.info(`Export completed: ${result.exportsCreated} exports created`)
            } else {
                logger.error(`Export failed: ${result.errors?.join(', ')}`)
            }
        } catch (error) {
            logger.error(`Export failed: ${(error as Error).message}`)
        }
    })
}

/**
 * Stop the ad insights export cron job
 */
export function stopAdInsightsCron(): void {
    if (adInsightsJob) {
        adInsightsJob.stop()
        adInsightsJob = null
        logger.info('Ad insights export cron job stopped')
    }
}

/**
 * Run ad insights export immediately (for testing or manual triggers)
 */
export async function runAdInsightsExportNow(): Promise<void> {
    logger.info('Running ad insights export')
    try {
        const result = await AdInsightUseCase.startImportAsync()
        if (result.success) {
            logger.info(`Export completed: ${result.exportsCreated} exports created`)
        } else {
            logger.error(`Export failed: ${result.errors?.join(', ')}`)
        }
    } catch (error) {
        logger.error(`Export failed: ${(error as Error).message}`)
        throw error
    }
}

/**
 * Start all cron jobs
 */
export function startAllCronJobs(): void {
    startAdInsightsCron()
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(): void {
    stopAdInsightsCron()
}

/**
 * Cron Scheduler Service - Grouped collection of all cron scheduling functions
 */
export const CronSchedulerService = {
    startAdInsightsCron,
    stopAdInsightsCron,
    runAdInsightsExportNow,
    startAllCronJobs,
    stopAllCronJobs,
}
