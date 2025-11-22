/**
 * Adset Suggestion Analysis
 */

import { AdSetDomain, AdAccountSettingDomain } from '../../../domain'
import { AdSet } from '../../../domain/aggregates/adset'
import { AdAccountSetting } from '../../../domain/aggregates/ad-account-setting'
import { Suggestion } from '../../../domain/aggregates/suggestion'
import { accountRepository, adSetRepository, adsetInsightDataRepository } from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { AnalysisResultInternal, ProcessingResult, SuggestionParams } from './types'
import {
    groupByAdAccount,
    validateAccountConfig,
    analyzeMetrics,
    findPendingSuggestions,
    createSuggestion,
    updateSuggestion,
} from './helpers'

/**
 * Execute adset suggestion analysis
 */
export async function executeAdsetAnalysis(): Promise<AnalysisResultInternal> {
    logger.info('Starting adset suggestion analysis')

    let created = 0
    const errors: string[] = []
    const suggestions: Suggestion[] = []

    try {
        const activeAdsets = await adSetRepository.findAllActive()
        const eligible = activeAdsets.filter(AdSetDomain.isEligibleForAnalysis)
        logger.info(`Found ${eligible.length} eligible adsets out of ${activeAdsets.length} active`)

        for (const [adAccountId, adsets] of groupByAdAccount(eligible).entries()) {
            const config = await validateAccountConfig(adAccountId)
            if (!config) continue

            const adAccountName = await accountRepository.findAdAccountNameById(adAccountId)
            if (!adAccountName) continue

            const accountId = adsets[0].accountId

            for (const adset of adsets) {
                const result = await processAdset(adset, config, accountId, adAccountName)
                if (result.created) created++
                if (result.error) errors.push(result.error)
                if (result.suggestion) suggestions.push(result.suggestion)
            }
        }

        logger.info(`Adset analysis: ${created} suggestions created`)

        return {
            success: errors.length === 0,
            suggestionsCreated: created,
            createdSuggestions: suggestions,
            errorMessages: errors.length > 0 ? errors : undefined,
        }
    } catch (error) {
        const msg = `Adset analysis failed: ${(error as Error).message}`
        logger.error(msg)
        return {
            success: false,
            suggestionsCreated: created,
            createdSuggestions: suggestions,
            errorMessages: [msg],
        }
    }
}

/**
 * Process single adset
 */
async function processAdset(
    adset: AdSet,
    config: AdAccountSetting,
    accountId: string,
    adAccountName: string
): Promise<ProcessingResult> {
    try {
        // Check timing
        const age = AdSetDomain.getAgeInDays(adset)
        if (!AdAccountSettingDomain.meetsInitialScaleThreshold(age, adset.lastScaledAt, config)) {
            return { processed: false, created: false, updated: false }
        }

        // Get metrics
        const insights = await adsetInsightDataRepository.findByAdsetId(adset.adsetId)
        if (insights.length === 0) return { processed: false, created: false, updated: false }

        const latest = insights[0]
        const metrics = {
            impressions: latest.impressions || 0,
            clicks: latest.clicks || 0,
            amountSpent: latest.amountSpent || 0,
            cpm: latest.cpm || 0,
            cpc: latest.cpc || 0,
            ctr: latest.ctr || 0,
            reach: latest.reach || 0,
            frequency: latest.frequency || 0,
            inlineLinkCtr: latest.inlineLinkCtr || 0,
            costPerInlineLinkClick: latest.costPerInlineLinkClick || 0,
            purchaseRoas: latest.purchaseRoas || 0,
            purchases: latest.purchases || 0,
            costPerPurchase: latest.costPerPurchase || 0,
        }

        // Analyze
        const exceedingMetrics = analyzeMetrics(metrics, config, adset.adsetId)
        if (!exceedingMetrics) return { processed: false, created: false, updated: false }

        // Create or update
        const params: SuggestionParams = {
            type: 'adset',
            entityId: adset.adsetId,
            entityName: adset.adsetName,
            campaignName: adset.campaignName,
            accountId,
            adAccountId: adset.adAccountId,
            adAccountName,
            currency: adset.currency,
            budget: adset.dailyBudget!,
            lastScaledAt: adset.lastScaledAt,
            exceedingMetrics,
            config,
        }

        const pending = await findPendingSuggestions('adset', adset.adsetId)
        const suggestion = pending.length === 0
            ? await createSuggestion(params)
            : await updateSuggestion(pending, params)

        return {
            processed: true,
            created: pending.length === 0,
            updated: pending.length > 0,
            suggestion,
        }
    } catch (error) {
        const msg = `Error processing adset ${adset.adsetId}: ${(error as Error).message}`
        logger.error(msg)
        return { processed: true, created: false, updated: false, error: msg }
    }
}
