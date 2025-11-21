/**
 * Helper functions for analyze suggestions workflow
 * All supporting logic separated from main orchestration
 */

import { AdSetDomain, AdAccountSettingDomain, SuggestionAnalyzer, SuggestionDomain } from '../../../domain'
import { AdSet } from '../../../domain/aggregates/adset'
import { AdAccountSetting } from '../../../domain/aggregates/ad-account-setting'
import { ExceedingMetric } from '../../../domain/aggregates/suggestion'
import {
    adAccountSettingRepository,
    adsetInsightDataRepository,
    suggestionRepository,
    telegramClient,
} from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { AdsetProcessingResult } from './types'

/**
 * Group adsets by ad account ID
 */
export function groupAdsetsByAccount(adsets: AdSet[]): Map<string, AdSet[]> {
    const grouped = new Map<string, AdSet[]>()
    for (const adset of adsets) {
        const existing = grouped.get(adset.adAccountId) || []
        existing.push(adset)
        grouped.set(adset.adAccountId, existing)
    }
    return grouped
}

/**
 * Validate account has valid threshold configuration
 */
export async function validateAccountConfig(adAccountId: string): Promise<AdAccountSetting | null> {
    const config = await adAccountSettingRepository.findByAdAccountId(adAccountId)

    if (!config || !SuggestionAnalyzer.hasValidThresholds(config)) {
        logger.debug(`Skipping ${adAccountId}: no valid threshold configuration`)
        return null
    }

    return config
}

/**
 * Check if adset meets scale timing requirements
 */
export function checkScaleTiming(adset: AdSet, config: AdAccountSetting): boolean {
    const adsetAge = AdSetDomain.getAgeInDays(adset)
    const meetsInitial = AdAccountSettingDomain.meetsInitialScaleThreshold(adsetAge, adset.lastScaledAt, config)

    if (!meetsInitial) {
        logger.debug(
            `Skipping ${adset.adsetId}: timing threshold not met (age: ${adsetAge}, initScaleDay: ${config.initScaleDay})`
        )
        return false
    }

    return true
}

/**
 * Analyze adset metrics and find exceeding ones
 * Uses the latest aggregated insight record from Facebook (time_increment: 'all_day')
 */
export async function analyzeAdsetMetrics(
    adsetId: string,
    config: AdAccountSetting
): Promise<ExceedingMetric[] | null> {
    const insights = await adsetInsightDataRepository.findByAdsetId(adsetId)

    if (insights.length === 0) {
        logger.debug(`Skipping ${adsetId}: no insight data`)
        return null
    }

    // Use only the latest aggregated record (already sorted by date desc)
    // Facebook provides aggregated data with time_increment: 'all_day'
    const latestInsight = insights[0]

    // Map insight fields to aggregated metrics format
    const aggregated = {
        impressions: latestInsight.impressions || 0,
        clicks: latestInsight.clicks || 0,
        amountSpent: latestInsight.amountSpent || 0,
        cpm: latestInsight.cpm || 0,
        cpc: latestInsight.cpc || 0,
        ctr: latestInsight.ctr || 0,
        reach: latestInsight.reach || 0,
        frequency: latestInsight.frequency || 0,
        inlineLinkCtr: latestInsight.inlineLinkCtr || 0,
        costPerInlineLinkClick: latestInsight.costPerInlineLinkClick || 0,
        purchaseRoas: latestInsight.purchaseRoas || 0,
    }

    const exceedingMetrics = SuggestionAnalyzer.findExceedingMetrics(aggregated, config)

    if (exceedingMetrics.length === 0) {
        logger.debug(`Skipping ${adsetId}: no metrics exceed thresholds`)
        return null
    }

    return exceedingMetrics
}

/**
 * Create a new suggestion
 */
export async function createSuggestion(
    adset: AdSet,
    exceedingMetrics: ExceedingMetric[],
    config: AdAccountSetting,
    accountId: string,
    adAccountName: string
): Promise<void> {
    const suggestion = SuggestionDomain.createSuggestion({
        accountId,
        adAccountId: adset.adAccountId,
        adAccountName,
        campaignName: adset.campaignName,
        adsetId: adset.adsetId,
        adsetName: adset.adsetName,
        currency: adset.currency,
        budget: adset.dailyBudget!,
        scalePercent: config.scalePercent,
        note: config.note,
        metrics: exceedingMetrics,
        recentScaleAt: adset.lastScaledAt ?? null,
    })

    await suggestionRepository.save(suggestion)
    await telegramClient.notifySuggestionCreated({ suggestion, accountId })

    logger.info(`Created suggestion for ${adset.adsetName}: budget ${adset.dailyBudget} → ${suggestion.budgetAfterScale}`)
}

/**
 * Update pending suggestion and cleanup duplicates
 */
export async function updateSuggestion(
    pendingSuggestions: any[],
    adset: AdSet,
    exceedingMetrics: ExceedingMetric[],
    config: AdAccountSetting,
    accountId: string
): Promise<void> {
    const mostRecent = pendingSuggestions[0]
    const suggestion = SuggestionDomain.updatePendingSuggestion(mostRecent, {
        budget: adset.dailyBudget!,
        scalePercent: config.scalePercent,
        note: config.note,
        metrics: exceedingMetrics,
        recentScaleAt: adset.lastScaledAt ?? null,
    })

    await suggestionRepository.save(suggestion)
    await telegramClient.notifySuggestionCreated({ suggestion, accountId })

    logger.info(`Updated pending suggestion for ${adset.adsetName}: ${mostRecent.budget} → ${adset.dailyBudget}`)

    // Cleanup duplicates if any
    if (pendingSuggestions.length > 1) {
        const duplicateIds = pendingSuggestions.slice(1).map(s => s.id!).filter(Boolean)
        const deletedCount = await suggestionRepository.deleteBulk(duplicateIds)
        logger.warn(`Deleted ${deletedCount} duplicate pending suggestions for ${adset.adsetId}`)
    }
}

/**
 * Process a single adset through the analysis pipeline
 */
export async function processSingleAdset(
    adset: AdSet,
    config: AdAccountSetting,
    accountId: string,
    adAccountName: string
): Promise<AdsetProcessingResult> {
    try {
        if (!checkScaleTiming(adset, config)) {
            return { processed: false, created: false, updated: false }
        }

        const exceedingMetrics = await analyzeAdsetMetrics(adset.adsetId, config)
        if (!exceedingMetrics) {
            return { processed: false, created: false, updated: false }
        }

        const pendingSuggestions = await suggestionRepository.findPendingByAdsetId(adset.adsetId)

        if (pendingSuggestions.length === 0) {
            await createSuggestion(adset, exceedingMetrics, config, accountId, adAccountName)
            return { processed: true, created: true, updated: false }
        }

        await updateSuggestion(pendingSuggestions, adset, exceedingMetrics, config, accountId)
        return { processed: true, created: false, updated: true }
    } catch (error) {
        const errorMsg = `Error processing adset ${adset.adsetId}: ${(error as Error).message}`
        logger.error(errorMsg)
        return { processed: true, created: false, updated: false, error: errorMsg }
    }
}
