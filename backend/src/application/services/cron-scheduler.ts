/**
 * Cron Scheduler Service
 * Schedules and manages cron jobs for periodic tasks
 */

import * as cron from 'node-cron'
import { logger } from '../../infrastructure/shared/logger'
import { FacebookSyncAdSetInsightsUseCase } from '../use-cases/facebook-sync-adset-insights'
import { FacebookSyncAdSetUseCase } from '../use-cases/facebook-sync-adset'
import * as AnalyzeSuggestionsUseCase from '../use-cases/analyze-suggestions'
// Note: We use process.env directly here instead of appConfig to avoid circular dependencies

let adSetInsightsJob: cron.ScheduledTask | null = null
let adSetSyncJob: cron.ScheduledTask | null = null
let suggestionAnalysisJob: cron.ScheduledTask | null = null

/**
 * Start the adset insights export cron job
 * Default schedule: Every day at 2 AM (can be configured via env)
 */
export function startAdSetInsightsCron(): void {
    const schedule = process.env.ADSET_INSIGHTS_CRON_SCHEDULE || '0 2 * * *' // Default: 2 AM daily (second is optional)

    logger.info(`Starting adset insights cron: ${schedule}`)

    if (!cron.validate(schedule)) {
        logger.error(`Invalid cron schedule: ${schedule}`)
        throw new Error(`Invalid cron schedule: ${schedule}`)
    }

    adSetInsightsJob = cron.schedule(schedule, async () => {
        logger.info('Running scheduled adset insights export')
        try {
            const result = await FacebookSyncAdSetInsightsUseCase.sync()
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
 * Stop the adset insights export cron job
 */
export function stopAdSetInsightsCron(): void {
    if (adSetInsightsJob) {
        adSetInsightsJob.stop()
        adSetInsightsJob = null
        logger.info('AdSet insights export cron job stopped')
    }
}

/**
 * Start the adset metadata sync cron job
 * Default schedule: Every Monday at 1 AM (can be configured via env)
 * Falls back to AD_INSIGHTS_CRON_SCHEDULE if ADSET_SYNC_CRON_SCHEDULE not set
 */
export function startAdSetSyncCron(): void {
    const schedule = process.env.ADSET_SYNC_CRON_SCHEDULE as string

    logger.info(`Starting adset metadata sync cron: ${schedule}`)

    if (!cron.validate(schedule)) {
        logger.error(`Invalid cron schedule: ${schedule}`)
        throw new Error(`Invalid cron schedule: ${schedule}`)
    }

    adSetSyncJob = cron.schedule(schedule, async () => {
        logger.info('Running scheduled adset metadata sync')
        try {
            const result = await FacebookSyncAdSetUseCase.sync()
            if (result.success) {
                logger.info(`AdSet sync completed: ${result.adAccountsSynced} ad accounts, ${result.adsetsSynced} adsets synced`)
            } else {
                logger.error(`AdSet sync failed: ${result.errors?.join(', ')}`)
            }
        } catch (error) {
            logger.error(`AdSet sync failed: ${(error as Error).message}`)
        }
    })
}

/**
 * Stop the adset metadata sync cron job
 */
export function stopAdSetSyncCron(): void {
    if (adSetSyncJob) {
        adSetSyncJob.stop()
        adSetSyncJob = null
        logger.info('AdSet metadata sync cron job stopped')
    }
}

/**
 * Start the suggestion analysis cron job
 * Default schedule: Every day at 3 AM (can be configured via env)
 */
export function startSuggestionAnalysisCron(): void {
    const schedule = process.env.SUGGESTION_ANALYSIS_CRON_SCHEDULE || '0 3 * * *' // Default: 3 AM daily

    logger.info(`Starting suggestion analysis cron: ${schedule}`)

    if (!cron.validate(schedule)) {
        logger.error(`Invalid cron schedule: ${schedule}`)
        throw new Error(`Invalid cron schedule: ${schedule}`)
    }

    suggestionAnalysisJob = cron.schedule(schedule, async () => {
        logger.info('Running scheduled suggestion analysis')
        try {
            const result = await AnalyzeSuggestionsUseCase.execute()
            logger.info(
                `Suggestion analysis completed: ${result.adsetsProcessed} adsets processed, ${result.suggestionsCreated} suggestions created, ${result.errors} errors`
            )
            if (!result.success && result.errorMessages) {
                logger.error(`Suggestion analysis errors: ${result.errorMessages.join('; ')}`)
            }
        } catch (error) {
            logger.error(`Suggestion analysis failed: ${(error as Error).message}`, { stack: (error as Error).stack })
        }
    })
}

/**
 * Stop the suggestion analysis cron job
 */
export function stopSuggestionAnalysisCron(): void {
    if (suggestionAnalysisJob) {
        suggestionAnalysisJob.stop()
        suggestionAnalysisJob = null
        logger.info('Suggestion analysis cron job stopped')
    }
}

/**
 * Start all cron jobs
 */
export function startAllCronJobs(): void {
    startAdSetSyncCron() // Run adset sync before insights sync
    startAdSetInsightsCron()
    startSuggestionAnalysisCron()
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(): void {
    stopAdSetSyncCron()
    stopAdSetInsightsCron()
    stopSuggestionAnalysisCron()
}

/**
 * Cron Scheduler Service - Grouped collection of all cron scheduling functions
 * Note: Manual triggers are now available via separate API endpoints
 */
export const CronSchedulerService = {
    startAdSetInsightsCron,
    stopAdSetInsightsCron,
    startAdSetSyncCron,
    stopAdSetSyncCron,
    startSuggestionAnalysisCron,
    stopSuggestionAnalysisCron,
    startAllCronJobs,
    stopAllCronJobs,
}
