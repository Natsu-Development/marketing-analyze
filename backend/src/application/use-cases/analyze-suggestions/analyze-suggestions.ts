/**
 * Analyze Suggestions Use Case
 * Orchestrates automated adset performance analysis and suggestion generation
 * KISS: Main workflow only, helpers in separate file
 */

import { AdSetDomain } from '../../../domain'
import { accountRepository, adSetRepository } from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { AnalysisResult } from './types'
import { groupAdsetsByAccount, validateAccountConfig, processSingleAdset } from './helpers'

/**
 * Execute suggestion analysis for all eligible adsets
 * KISS: Clean main workflow with focused helper functions
 */
export async function execute(): Promise<AnalysisResult> {
    logger.info('Starting suggestion analysis')

    let adsetsProcessed = 0
    let suggestionsCreated = 0
    let suggestionsUpdated = 0
    const errorMessages: string[] = []

    try {
        // Get eligible adsets
        const activeAdsets = await adSetRepository.findAllActive()
        const eligibleAdsets = activeAdsets.filter(AdSetDomain.isEligibleForAnalysis)

        logger.info(`Found ${eligibleAdsets.length} eligible adsets out of ${activeAdsets.length} active`)

        // Group by ad account
        const adsetsByAccount = groupAdsetsByAccount(eligibleAdsets)

        // Process each ad account
        for (const [adAccountId, adsets] of adsetsByAccount.entries()) {
            // Validate account config
            const config = await validateAccountConfig(adAccountId)
            if (!config) {
                continue
            }

            // Get account details
            const accountId = adsets[0].accountId
            const adAccountName = await accountRepository.findAdAccountNameById(adAccountId)

            if (!adAccountName) {
                logger.warn(`Ad account name not found for ${adAccountId}, skipping`)
                continue
            }

            // Process each adset
            for (const adset of adsets) {
                const result = await processSingleAdset(adset, config, accountId, adAccountName)

                if (result.processed) adsetsProcessed++
                if (result.created) suggestionsCreated++
                if (result.updated) suggestionsUpdated++
                if (result.error) errorMessages.push(result.error)
            }
        }

        logger.info(
            `Analysis complete: ${adsetsProcessed} processed, ${suggestionsCreated} created, ${suggestionsUpdated} updated, ${errorMessages.length} errors`
        )

        return {
            success: errorMessages.length === 0,
            adsetsProcessed,
            suggestionsCreated,
            suggestionsUpdated,
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
            suggestionsUpdated,
            errors: 1,
            errorMessages: [errorMsg],
        }
    }
}
