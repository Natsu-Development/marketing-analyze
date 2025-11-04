/**
 * Suggestion Routes
 * RESTful routes for suggestion approval and rejection
 */

import { Router } from 'express'
import * as suggestionController from '../controllers/SuggestionController'

/**
 * Suggestion routes
 *
 * Routes:
 * - POST   /:suggestionId/approve   - Approve suggestion and update Facebook budget
 * - POST   /:suggestionId/reject    - Reject suggestion
 */
export const suggestionRoutes = Router()

// Approve suggestion
suggestionRoutes.post('/:suggestionId/approve', suggestionController.approveSuggestion)

// Reject suggestion
suggestionRoutes.post('/:suggestionId/reject', suggestionController.rejectSuggestion)
