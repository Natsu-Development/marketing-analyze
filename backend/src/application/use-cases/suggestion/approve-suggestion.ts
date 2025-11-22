/**
 * Approve Suggestion Use Case
 * Approves a suggestion and updates Facebook budget (adset or campaign)
 * Routes to appropriate handler based on suggestion type field
 */

import { SuggestionDomain, AdSetDomain, CampaignDomain, Suggestion } from '../../../domain'
import {
    accountRepository,
    suggestionRepository,
    adSetRepository,
    campaignRepository,
    facebookClient,
} from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { ApproveSuggestionInput, ApproveSuggestionResult } from './types'

/**
 * Execute suggestion approval
 * Routes to appropriate handler based on suggestion.type
 */
export async function execute(input: ApproveSuggestionInput): Promise<ApproveSuggestionResult> {
    const { suggestionId } = input

    // 1. Fetch suggestion
    const suggestion = await suggestionRepository.findById(suggestionId)
    if (!suggestion) {
        return {
            success: false,
            error: 'NOT_FOUND',
            message: `Suggestion ${suggestionId} not found`,
        }
    }

    // 2. Approve using domain logic (validates status is pending)
    const approvedSuggestion = SuggestionDomain.approveSuggestion(suggestion)

    // 3. Get account and access token using accountId from suggestion
    const account = await accountRepository.findByAccountId(suggestion.accountId)
    if (!account) {
        logger.warn(`Account ${suggestion.accountId} not found`)
        return {
            success: false,
            error: 'ACCOUNT_NOT_FOUND',
            message: `Account ${suggestion.accountId} not found`,
        }
    }

    // 4. Route based on suggestion type
    if (suggestion.type === 'campaign') {
        return executeCampaignApproval(suggestion, approvedSuggestion, account.accessToken)
    }

    // Default: adset approval (backward compatible)
    return executeAdsetApproval(suggestion, approvedSuggestion, account.accessToken)
}

/**
 * Execute adset suggestion approval
 */
async function executeAdsetApproval(
    suggestion: Suggestion,
    approvedSuggestion: Suggestion,
    accessToken: string
): Promise<ApproveSuggestionResult> {
    // Update Facebook adset budget
    await facebookClient.updateAdsetBudget({
        accessToken,
        adsetId: suggestion.adsetId,
        dailyBudget: suggestion.budgetAfterScale,
    })

    // Mark adset as scaled (update lastScaledAt for recurring scale threshold)
    const adset = await adSetRepository.findByAdSetId(suggestion.adAccountId, suggestion.adsetId)
    if (adset) {
        const scaledAdset = AdSetDomain.markAsScaled(adset)
        await adSetRepository.save(scaledAdset)
        logger.info(`Marked adset ${suggestion.adsetId} as scaled at ${scaledAdset.lastScaledAt?.toISOString()}`)
    } else {
        logger.warn(`Adset ${suggestion.adsetId} not found to mark as scaled`)
    }

    // Save approved suggestion
    const result = await suggestionRepository.save(approvedSuggestion)

    logger.info(`Approved adset suggestion ${suggestion.id} and updated adset ${suggestion.adsetId} budget to ${suggestion.budgetAfterScale}`)

    return {
        success: true,
        data: result,
    }
}

/**
 * Execute campaign suggestion approval
 */
async function executeCampaignApproval(
    suggestion: Suggestion,
    approvedSuggestion: Suggestion,
    accessToken: string
): Promise<ApproveSuggestionResult> {
    const campaignId = suggestion.campaignId

    if (!campaignId) {
        logger.error(`Campaign suggestion ${suggestion.id} missing campaignId`)
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Campaign suggestion missing campaignId',
        }
    }

    // Update Facebook campaign budget
    await facebookClient.updateCampaignBudget({
        accessToken,
        campaignId,
        dailyBudget: suggestion.budgetAfterScale,
    })

    // Mark campaign as scaled and update dailyBudget
    const campaign = await campaignRepository.findByCampaignId(suggestion.adAccountId, campaignId)
    if (campaign) {
        // First update dailyBudget, then mark as scaled
        const updatedCampaign = CampaignDomain.updateCampaign(campaign, { dailyBudget: suggestion.budgetAfterScale })
        const scaledCampaign = CampaignDomain.markAsScaled(updatedCampaign)
        await campaignRepository.save(scaledCampaign)
        logger.info(`Marked campaign ${campaignId} as scaled at ${scaledCampaign.lastScaledAt?.toISOString()} with budget ${suggestion.budgetAfterScale}`)
    } else {
        logger.warn(`Campaign ${campaignId} not found to mark as scaled`)
    }

    // Save approved suggestion
    const result = await suggestionRepository.save(approvedSuggestion)

    logger.info(`Approved campaign suggestion ${suggestion.id} and updated campaign ${campaignId} budget to ${suggestion.budgetAfterScale}`)

    return {
        success: true,
        data: result,
    }
}
