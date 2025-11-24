/**
 * Campaign Suggestion Analysis
 */

import { Campaign, CampaignDomain, AdAccountSettingDomain } from '../../../domain'
import { AdAccountSetting } from '../../../domain/aggregates/ad-account-setting'
import { Suggestion } from '../../../domain/aggregates/suggestion'
import { accountRepository, campaignRepository, adsetInsightDataRepository } from '../../../config/dependencies'
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
 * Execute campaign suggestion analysis
 */
export async function executeCampaignAnalysis(): Promise<AnalysisResultInternal> {
    logger.info('Starting campaign suggestion analysis')

    let created = 0
    const errors: string[] = []
    const suggestions: Suggestion[] = []

    try {
        const activeCampaigns = await campaignRepository.findActiveWithBudget()
        const eligible = activeCampaigns.filter(CampaignDomain.isEligibleForAnalysis)
        logger.info(`Found ${eligible.length} eligible campaigns out of ${activeCampaigns.length} active`)

        for (const [adAccountId, campaigns] of groupByAdAccount(eligible).entries()) {
            // Campaigns require ALL 6 thresholds
            const config = await validateAccountConfig(adAccountId, true)
            if (!config) continue

            const adAccountName = await accountRepository.findAdAccountNameById(adAccountId)
            if (!adAccountName) continue

            const accountId = campaigns[0].accountId

            for (const campaign of campaigns) {
                const result = await processCampaign(campaign, config, accountId, adAccountName)
                if (result.created) created++
                if (result.error) errors.push(result.error)
                if (result.suggestion) suggestions.push(result.suggestion)
            }
        }

        logger.info(`Campaign analysis: ${created} suggestions created`)

        return {
            success: errors.length === 0,
            suggestionsCreated: created,
            createdSuggestions: suggestions,
            errorMessages: errors.length > 0 ? errors : undefined,
        }
    } catch (error) {
        const msg = `Campaign analysis failed: ${(error as Error).message}`
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
 * Process single campaign
 */
async function processCampaign(
    campaign: Campaign,
    config: AdAccountSetting,
    accountId: string,
    adAccountName: string
): Promise<ProcessingResult> {
    try {
        // Check timing (same as adset)
        const age = CampaignDomain.getAgeInDays(campaign)
        if (!AdAccountSettingDomain.meetsInitialScaleThreshold(age, campaign.lastScaledAt ?? undefined, config)) {
            return { processed: false, created: false, updated: false }
        }

        // Get aggregated metrics
        const aggregated = await adsetInsightDataRepository.aggregateByCampaignId(campaign.campaignId)
        if (!aggregated) return { processed: false, created: false, updated: false }
        
        const metrics = {
            impressions: aggregated.impressions || 0,
            clicks: aggregated.clicks || 0,
            amountSpent: aggregated.amountSpent || 0,
            cpm: aggregated.cpm || 0,
            ctr: aggregated.ctr || 0,
            reach: aggregated.reach || 0,
            frequency: aggregated.frequency || 0,
            inlineLinkCtr: aggregated.inlineLinkCtr || 0,
            costPerInlineLinkClick: aggregated.costPerInlineLinkClick || 0,
            purchaseRoas: aggregated.purchaseRoas || 0,
            purchases: aggregated.purchases || 0,
            costPerPurchase: aggregated.purchases > 0 ? aggregated.amountSpent / aggregated.purchases : 0,
            cpc: aggregated.clicks > 0 ? aggregated.amountSpent / aggregated.clicks : 0
        }

        // Analyze
        const exceedingMetrics = analyzeMetrics(metrics, config, campaign.campaignId)
        if (!exceedingMetrics) return { processed: false, created: false, updated: false }

        // Create or update
        const params: SuggestionParams = {
            type: 'campaign',
            entityId: campaign.campaignId,
            entityName: campaign.campaignName,
            accountId,
            adAccountId: campaign.adAccountId,
            adAccountName,
            currency: campaign.currency,
            budget: campaign.dailyBudget!,
            lastScaledAt: campaign.lastScaledAt,
            exceedingMetrics,
            config,
        }

        const pending = await findPendingSuggestions('campaign', campaign.campaignId)
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
        const msg = `Error processing campaign ${campaign.campaignId}: ${(error as Error).message}`
        logger.error(msg)
        return { processed: true, created: false, updated: false, error: msg }
    }
}
