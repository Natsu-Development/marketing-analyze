/**
 * Shared Helper Functions for Suggestion Analysis
 */

import { SuggestionAnalyzer, SuggestionDomain } from '../../../domain'
import { AdAccountSetting } from '../../../domain/aggregates/ad-account-setting'
import { ExceedingMetric, Suggestion } from '../../../domain/aggregates/suggestion'
import { adAccountSettingRepository, suggestionRepository } from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { SuggestionParams } from './types'

/**
 * Generic group by ad account ID
 */
export function groupByAdAccount<T extends { adAccountId: string }>(items: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>()
    for (const item of items) {
        const existing = grouped.get(item.adAccountId) || []
        existing.push(item)
        grouped.set(item.adAccountId, existing)
    }
    return grouped
}

/**
 * Validate account threshold configuration
 */
export async function validateAccountConfig(
    adAccountId: string,
    requireAllThresholds: boolean = false
): Promise<AdAccountSetting | null> {
    const config = await adAccountSettingRepository.findByAdAccountId(adAccountId)
    if (!config) {
        logger.debug(`Skipping ${adAccountId}: no threshold configuration`)
        return null
    }

    const isValid = requireAllThresholds
        ? SuggestionAnalyzer.hasAllThresholds(config)
        : SuggestionAnalyzer.hasValidThresholds(config)

    if (!isValid) {
        logger.debug(`Skipping ${adAccountId}: invalid threshold configuration`)
        return null
    }

    return config
}

/**
 * Analyze metrics - returns qualifying metrics if ALL conditions met
 */
export function analyzeMetrics(
    metrics: Record<string, number>,
    config: AdAccountSetting,
    entityId: string
): ExceedingMetric[] | null {
    const { qualifyingMetrics, allConditionsMet } = SuggestionAnalyzer.findQualifyingMetrics(metrics as any, config)
    if (!allConditionsMet) {
        logger.debug(`Skipping ${entityId}: not all conditions met`)
        return null
    }
    return qualifyingMetrics
}

/**
 * Create a new suggestion
 */
export async function createSuggestion(params: SuggestionParams): Promise<Suggestion> {
    const { type, entityId, entityName, campaignName, accountId, adAccountId, adAccountName, currency, budget, lastScaledAt, exceedingMetrics, config } = params

    const suggestion = type === 'campaign'
        ? SuggestionDomain.createCampaignSuggestion({
            accountId, adAccountId, adAccountName,
            campaignId: entityId,
            campaignName: entityName,
            currency, budget,
            scalePercent: config.scalePercent,
            note: config.note,
            metrics: exceedingMetrics,
            recentScaleAt: lastScaledAt ?? null,
        })
        : SuggestionDomain.createSuggestion({
            accountId, adAccountId, adAccountName,
            campaignName: campaignName || '',
            adsetId: entityId,
            adsetName: entityName,
            currency, budget,
            scalePercent: config.scalePercent,
            note: config.note,
            metrics: exceedingMetrics,
            recentScaleAt: lastScaledAt ?? null,
        })

    const saved = type === 'campaign'
        ? await suggestionRepository.saveCampaignSuggestion(suggestion)
        : await suggestionRepository.saveAdsetSuggestion(suggestion)
    logger.info(`Created ${type} suggestion for ${entityName}: budget ${budget} → ${saved.budgetAfterScale}`)
    return saved
}

/**
 * Update existing pending suggestion and cleanup duplicates
 */
export async function updateSuggestion(
    pendingSuggestions: Suggestion[],
    params: SuggestionParams
): Promise<Suggestion> {
    const { type, entityId, entityName, budget, lastScaledAt, exceedingMetrics, config } = params
    const mostRecent = pendingSuggestions[0]

    const updated = SuggestionDomain.updatePendingSuggestion(mostRecent, {
        budget,
        scalePercent: config.scalePercent,
        note: config.note,
        metrics: exceedingMetrics,
        recentScaleAt: lastScaledAt ?? null,
    })

    type === 'campaign'
        ? await suggestionRepository.saveCampaignSuggestion(updated)
        : await suggestionRepository.saveAdsetSuggestion(updated)
    logger.info(`Updated ${type} suggestion for ${entityName}: ${mostRecent.budget} → ${budget}`)

    // Cleanup duplicates
    if (pendingSuggestions.length > 1) {
        const duplicateIds = pendingSuggestions.slice(1).map(s => s.id!).filter(Boolean)
        await suggestionRepository.deleteBulk(duplicateIds)
        logger.warn(`Deleted ${duplicateIds.length} duplicate ${type} suggestions for ${entityId}`)
    }

    return updated
}

/**
 * Find pending suggestions by entity
 */
export async function findPendingSuggestions(type: 'adset' | 'campaign', entityId: string): Promise<Suggestion[]> {
    return suggestionRepository.findPending(type, entityId)
}
