/**
 * HTTP Controller: SuggestionController
 * Handles HTTP requests for suggestion endpoints
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { ApproveSuggestionUseCase, RejectSuggestionUseCase } from '../../../application/use-cases/suggestion'
import { suggestionRepository } from '../../../config/dependencies'
import { jsonSuccess, jsonError, handleValidationError, handleInternalError } from '../helpers'

// ============================================================================
// Validation Schemas
// ============================================================================

const SuggestionIdParamSchema = z.object({
    suggestionId: z.string().min(1, 'Suggestion ID is required'),
})

const SuggestionStatusQuerySchema = z.object({
    status: z.enum(['pending', 'rejected', 'applied'], {
        errorMap: () => ({ message: 'Status must be one of: pending, rejected, applied' }),
    }),
})

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * POST /api/suggestions/:suggestionId/approve
 * Approves a suggestion and updates Facebook adset budget
 */
export async function approveSuggestion(req: Request, res: Response): Promise<void> {
    try {
        // Validate path parameter
        const { suggestionId } = SuggestionIdParamSchema.parse(req.params)

        // Invoke use case (handles domain errors internally)
        const result = await ApproveSuggestionUseCase.execute({ suggestionId })

        // Handle use case result
        if (!result.success) {
            const statusCode =
                result.error === 'NOT_FOUND'
                    ? 404
                    : result.error === 'ACCOUNT_NOT_FOUND'
                      ? 404
                      : result.error === 'VALIDATION_ERROR'
                        ? 400
                        : 500

            return jsonError(res, result.error || 'APPROVAL_FAILED', statusCode, result.message)
        }

        return jsonSuccess(res, result.data)
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}

/**
 * POST /api/suggestions/:suggestionId/reject
 * Rejects a suggestion
 */
export async function rejectSuggestion(req: Request, res: Response): Promise<void> {
    try {
        // Validate path parameter
        const { suggestionId } = SuggestionIdParamSchema.parse(req.params)

        // Invoke use case
        const result = await RejectSuggestionUseCase.execute({ suggestionId })

        if (!result.success) {
            const statusCode = result.error === 'NOT_FOUND' ? 404 : result.error === 'VALIDATION_ERROR' ? 400 : 500

            return jsonError(res, result.error || 'REJECTION_FAILED', statusCode, result.message)
        }

        return jsonSuccess(res, result.data)
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}

/**
 * GET /api/suggestions?status=applied
 * Retrieves suggestions by status, sorted by exceeding count (descending)
 */
export async function getSuggestionsByStatus(req: Request, res: Response): Promise<void> {
    try {
        // Validate query parameter
        const { status } = SuggestionStatusQuerySchema.parse(req.query)

        // Fetch suggestions from repository
        const suggestions = await suggestionRepository.findByStatus(status)

        return jsonSuccess(res, {
            status,
            count: suggestions.length,
            suggestions,
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}
