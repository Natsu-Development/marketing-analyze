/**
 * Suggestion Routes
 * RESTful routes for suggestion approval, rejection, and analysis
 */

import { Router } from 'express'
import * as suggestionController from '../controllers/SuggestionController'
import * as AnalyzeSuggestionsUseCase from '../../../application/use-cases/analyze-suggestions'
import { logger } from '../../../infrastructure/shared/logger'
import { jsonSuccess, jsonError } from '../helpers/response-helpers'

/**
 * Suggestion routes
 *
 * Routes:
 * - GET    ?status=pending&type=adset     - Get suggestions by status with optional type filter
 * - GET    /adset/:adsetId/history        - Get adset suggestion history
 * - GET    /campaign/:campaignId/history  - Get campaign suggestion history
 * - POST   /analyze                       - Manually trigger suggestion analysis
 * - POST   /:suggestionId/approve         - Approve suggestion and update Facebook budget
 * - POST   /:suggestionId/reject          - Reject suggestion
 */
export const suggestionRoutes = Router()

// Get suggestions by status with optional type filter
suggestionRoutes.get('/', suggestionController.getSuggestionsByStatus)

// Get adset suggestion history
suggestionRoutes.get('/adset/:adsetId/history', suggestionController.getAdsetHistory)

// Get campaign suggestion history
suggestionRoutes.get('/campaign/:campaignId/history', suggestionController.getCampaignHistory)

// Analyze suggestions
suggestionRoutes.post('/analyze', async (_req, res) => {
    try {
        logger.info('Manual suggestion analysis triggered via API')
        const result = await AnalyzeSuggestionsUseCase.execute()

        if (result.success) {
            return jsonSuccess(res, {
                message: 'Suggestion analysis completed successfully',
                suggestionsCreated: result.suggestionsCreated,
            })
        } else {
            return jsonError(res, `Analysis completed with errors: ${result.errorMessages?.join(', ')}`, 500)
        }
    } catch (error) {
        logger.error({ error }, 'Suggestion analysis failed')
        return jsonError(res, `Failed to run suggestion analysis: ${(error as Error).message}`, 500)
    }
})

// Approve suggestion
suggestionRoutes.post('/:suggestionId/approve', suggestionController.approveSuggestion)

// Reject suggestion
suggestionRoutes.post('/:suggestionId/reject', suggestionController.rejectSuggestion)
