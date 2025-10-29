/**
 * Cron Scheduler Service
 * Schedules and manages cron jobs for periodic tasks
 */

import * as cron from 'node-cron'
import { logger } from '../../infrastructure/shared/logger'
import { AdInsightUseCase } from '../use-cases/adSetInsights'
// Note: We use process.env directly here instead of appConfig to avoid circular dependencies

let adInsightsJob: cron.ScheduledTask | null = null

/**
 * Start the ad insights export cron job
 * Default schedule: Every day at 2 AM (can be configured via env)
 */
export function startAdInsightsCron(): void {
    const schedule = process.env.AD_INSIGHTS_CRON_SCHEDULE || '0 2 * * *' // Default: 2 AM daily (second is optional)

    logger.info(`Starting ad insights export cron job with schedule: ${schedule}`)

    if (!cron.validate(schedule)) {
        logger.error(`Invalid cron schedule: ${schedule}`)
        throw new Error(`Invalid cron schedule: ${schedule}`)
    }

    adInsightsJob = cron.schedule(schedule, async () => {
        logger.info('Running scheduled ad insights export...')
        try {
            const result = await AdInsightUseCase.export()
            if (result.success) {
                logger.info(`Ad insights export completed successfully. Created ${result.exportsCreated} exports.`)
            } else {
                logger.error(`Ad insights export completed with errors: ${result.errors?.join(', ')}`)
            }
        } catch (error) {
            logger.error(`Ad insights export failed: ${(error as Error).message}`)
        }
    })

    logger.info('Ad insights export cron job started successfully')
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
    logger.info('Running ad insights export immediately...')
    try {
        const result = await AdInsightUseCase.export()
        if (result.success) {
            logger.info(`Ad insights export completed. Created ${result.exportsCreated} exports.`)
        } else {
            logger.error(`Ad insights export completed with errors: ${result.errors?.join(', ')}`)
        }
    } catch (error) {
        logger.error(`Ad insights export failed: ${(error as Error).message}`)
        throw error
    }
}

/**
 * Start all cron jobs
 */
export function startAllCronJobs(): void {
    logger.info('Starting all cron jobs...')
    startAdInsightsCron()
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(): void {
    logger.info('Stopping all cron jobs...')
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
