/**
 * Analyze Suggestions Use Case - Entry Point
 * Triggered by SUGGESTION_ANALYSIS_CRON_SCHEDULE
 * Flow: Adset Analysis → Campaign Analysis → Telegram Notification
 */

import { telegramClient } from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { AnalysisResult } from './types'
import { executeAdsetAnalysis } from './analyze-adset'
import { executeCampaignAnalysis } from './analyze-campaign'

/**
 * Execute unified suggestion analysis
 */
export async function execute(): Promise<AnalysisResult> {
    logger.info('Starting suggestion analysis')

    const adset = await executeAdsetAnalysis()
    const campaign = await executeCampaignAnalysis()

    // Send notification if any suggestions created
    if (adset.createdSuggestions.length > 0 || campaign.createdSuggestions.length > 0) {
        await telegramClient.notify({
            adsets: adset.createdSuggestions,
            campaigns: campaign.createdSuggestions,
        })
    }

    const totalCreated = adset.suggestionsCreated + campaign.suggestionsCreated
    const errors = [...(adset.errorMessages || []), ...(campaign.errorMessages || [])]

    logger.info(`Analysis complete: ${totalCreated} suggestions created`)

    return {
        success: adset.success && campaign.success,
        suggestionsCreated: totalCreated,
        errorMessages: errors.length > 0 ? errors : undefined,
    }
}
