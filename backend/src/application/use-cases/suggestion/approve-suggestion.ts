/**
 * Approve Suggestion Use Case
 * Approves a suggestion and updates Facebook adset budget
 * KISS: Simple, direct implementation with early returns
 */

import { SuggestionDomain } from '../../../domain'
import { accountRepository, suggestionRepository, facebookClient } from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { ApproveSuggestionInput, ApproveSuggestionResult } from './types'

/**
 * Execute suggestion approval
 * Steps: fetch → validate → get token → update Facebook → save
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

    // 4. Update Facebook adset budget
    await facebookClient.updateAdsetBudget({
        accessToken: account.accessToken,
        adsetId: suggestion.adsetId,
        dailyBudget: suggestion.budgetScaled,
    })

    // 5. Save approved suggestion
    const result = await suggestionRepository.save(approvedSuggestion)

    logger.info(`Approved suggestion ${suggestionId} and updated adset ${suggestion.adsetId} budget to ${suggestion.budgetScaled}`)

    return {
        success: true,
        data: result,
    }
}
