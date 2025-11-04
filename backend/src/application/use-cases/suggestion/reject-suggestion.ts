/**
 * Reject Suggestion Use Case
 * Rejects a suggestion and updates status
 * KISS: Simple, direct implementation with early returns
 */

import { SuggestionDomain } from '../../../domain'
import { suggestionRepository } from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { RejectSuggestionInput, RejectSuggestionResult } from './types'

/**
 * Execute suggestion rejection
 * Steps: fetch → validate → save
 */
export async function execute(input: RejectSuggestionInput): Promise<RejectSuggestionResult> {
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

    // 2. Reject using domain logic (validates status is pending)
    const rejectedSuggestion = SuggestionDomain.rejectSuggestion(suggestion)

    // 3. Save rejected suggestion
    const result = await suggestionRepository.save(rejectedSuggestion)

    logger.info(`Rejected suggestion ${suggestionId}`)

    return {
        success: true,
        data: result,
    }
}
