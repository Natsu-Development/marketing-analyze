/**
 * Cron Scheduler Service
 * Schedules and manages cron jobs for periodic tasks
 */

import * as cron from 'node-cron'
import { logger } from '../../infrastructure/shared/logger'
import { FacebookSyncAdSetInsightsUseCase } from '../use-cases/facebook-sync-adset-insights'
import { FacebookSyncAdSetUseCase } from '../use-cases/facebook-sync-adset'
import * as CampaignSyncUseCase from '../use-cases/campaign-sync'
import * as AnalyzeSuggestionsUseCase from '../use-cases/analyze-suggestions'
// Note: We use process.env directly here instead of appConfig to avoid circular dependencies

let adSetInsightsJob: cron.ScheduledTask | null = null
let adSetSyncJob: cron.ScheduledTask | null = null
let campaignSyncJob: cron.ScheduledTask | null = null
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
 * Start the campaign sync cron job
 * Default schedule: Every Monday at 1 AM (can be configured via env)
 */
export function startCampaignSyncCron(): void {
    const schedule = process.env.CAMPAIGN_SYNC_CRON_SCHEDULE || '0 1 * * 1' // Default: Monday 1 AM weekly

    logger.info(`Starting campaign sync cron: ${schedule}`)

    if (!cron.validate(schedule)) {
        logger.error(`Invalid cron schedule: ${schedule}`)
        throw new Error(`Invalid cron schedule: ${schedule}`)
    }

    campaignSyncJob = cron.schedule(schedule, async () => {
        logger.info('Running scheduled campaign sync')
        try {
            const result = await CampaignSyncUseCase.sync()
            if (result.success) {
                logger.info(`Campaign sync completed: ${result.campaignsFetched} campaigns fetched`)
            } else {
                logger.error(`Campaign sync failed: ${result.errors?.join(', ')}`)
            }
        } catch (error) {
            logger.error(`Campaign sync failed: ${(error as Error).message}`)
        }
    })
}

/**
 * Stop the campaign sync cron job
 */
export function stopCampaignSyncCron(): void {
    if (campaignSyncJob) {
        campaignSyncJob.stop()
        campaignSyncJob = null
        logger.info('Campaign sync cron job stopped')
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
            logger.info(`Suggestion analysis completed: ${result.suggestionsCreated} suggestions created`)
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
    startCampaignSyncCron() // Campaign sync runs weekly
    startAdSetInsightsCron()
    startSuggestionAnalysisCron()
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(): void {
    stopAdSetSyncCron()
    stopCampaignSyncCron()
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
    startCampaignSyncCron,
    stopCampaignSyncCron,
    startSuggestionAnalysisCron,
    stopSuggestionAnalysisCron,
    startAllCronJobs,
    stopAllCronJobs,
}
