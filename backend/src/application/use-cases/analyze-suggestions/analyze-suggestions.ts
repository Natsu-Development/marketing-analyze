/**
 * Analyze Suggestions Use Case
 * Orchestrates automated adset performance analysis and suggestion generation
 * KISS: Simple, direct, minimal abstractions
 */

import { AdSetDomain, SuggestionDomain, SuggestionAnalyzer } from '../../../domain'
import {
    accountRepository,
    adSetRepository,
    adsetInsightDataRepository,
    adAccountSettingRepository,
    suggestionRepository,
} from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { AnalysisResult } from './types'

/**
 * Execute suggestion analysis for all eligible adsets
 * KISS: Direct implementation without unnecessary helper functions
 */
export async function execute(): Promise<AnalysisResult> {
    logger.info('Starting suggestion analysis')

    let adsetsProcessed = 0
    let suggestionsCreated = 0
    const errorMessages: string[] = []

    try {
        // Query only ACTIVE adsets and filter using domain logic
        const activeAdsets = await adSetRepository.findAllActive()
        const eligibleAdsets = activeAdsets.filter(AdSetDomain.isEligibleForAnalysis)

        logger.info(`Found ${eligibleAdsets.length} eligible adsets out of ${activeAdsets.length} active adsets`)

        // Group adsets by ad account (inline - KISS)
        const adsetsByAccount = new Map<string, typeof eligibleAdsets>()
        for (const adset of eligibleAdsets) {
            const existing = adsetsByAccount.get(adset.adAccountId) || []
            existing.push(adset)
            adsetsByAccount.set(adset.adAccountId, existing)
        }

        // Process each ad account
        for (const [adAccountId, adsets] of adsetsByAccount.entries()) {
            // Get and validate threshold config (inline - KISS)
            const config = await adAccountSettingRepository.findByAdAccountId(adAccountId)

            if (!config || !SuggestionAnalyzer.hasValidThresholds(config)) {
                logger.debug(`Skipping ${adsets.length} adsets for ${adAccountId}: no valid threshold configuration`)
                continue
            }

            // Get account ID from first adset (all adsets in group share same accountId)
            const accountId = adsets[0].accountId

            // Get ad account name using repository
            const adAccountName = await accountRepository.findAdAccountNameById(adAccountId)

            if (!adAccountName) {
                logger.warn(`Ad account name not found for ${adAccountId}, skipping`)
                continue
            }

            // Process each adset
            for (const adset of adsets) {
                try {
                    // Fetch insights
                    const insights = await adsetInsightDataRepository.findByAdsetId(adset.adsetId)

                    if (insights.length === 0) {
                        logger.debug(`Skipping ${adset.adsetId}: no insight data`)
                        continue
                    }

                    // Aggregate metrics using domain service
                    const aggregated = SuggestionAnalyzer.aggregateInsightMetrics(insights)
                    if (!aggregated) {
                        continue
                    }

                    // Find exceeding metrics using domain service
                    const exceedingMetrics = SuggestionAnalyzer.findExceedingMetrics(aggregated, config)

                    if (exceedingMetrics.length === 0) {
                        logger.debug(`Skipping ${adset.adsetId}: no metrics exceed thresholds`)
                        continue
                    }

                    // Create and save suggestion using domain factory
                    const suggestion = SuggestionDomain.createSuggestion({
                        accountId,
                        adAccountId: adset.adAccountId,
                        adAccountName,
                        campaignName: adset.campaignName,
                        adsetId: adset.adsetId,
                        adsetName: adset.adsetName,
                        dailyBudget: adset.dailyBudget!,
                        scalePercent: config.scalePercent,
                        note: config.note,
                        metrics: exceedingMetrics,
                    })

                    await suggestionRepository.save(suggestion)

                    logger.info(
                        `Created suggestion for ${adset.adsetName} (${adset.adsetId}) with ${exceedingMetrics.length} exceeding metrics`
                    )

                    adsetsProcessed++
                    suggestionsCreated++
                } catch (error) {
                    adsetsProcessed++
                    const errorMsg = `Error processing adset ${adset.adsetId}: ${(error as Error).message}`
                    errorMessages.push(errorMsg)
                    logger.error(errorMsg)
                }
            }
        }

        logger.info(
            `Suggestion analysis completed: ${adsetsProcessed} adsets processed, ${suggestionsCreated} suggestions created, ${errorMessages.length} errors`
        )

        return {
            success: errorMessages.length === 0,
            adsetsProcessed,
            suggestionsCreated,
            errors: errorMessages.length,
            errorMessages: errorMessages.length > 0 ? errorMessages : undefined,
        }
    } catch (error) {
        const errorMsg = `Suggestion analysis failed: ${(error as Error).message}`
        logger.error(errorMsg, { stack: (error as Error).stack })

        return {
            success: false,
            adsetsProcessed,
            suggestionsCreated,
            errors: 1,
            errorMessages: [errorMsg],
        }
    }
}
