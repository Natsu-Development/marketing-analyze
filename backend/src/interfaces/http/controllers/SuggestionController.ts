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
    status: z.enum(['pending', 'approved', 'rejected'], {
        errorMap: () => ({ message: 'Status must be one of: pending, approved, rejected' }),
    }).optional(),
    adsetId: z.string().min(1).optional(),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
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
 * GET /api/suggestions?status=pending&adsetId=123&limit=20&offset=0
 * Retrieves suggestions with optional filtering by status and/or adsetId
 * KISS: Simplified query logic with early returns
 */
export async function getSuggestionsByStatus(req: Request, res: Response): Promise<void> {
    try {
        const { status, adsetId, limit, offset } = SuggestionStatusQuerySchema.parse(req.query)

        // Helper: Apply manual pagination
        const applyPagination = (suggestions: any[]) => ({
            suggestions: suggestions.slice(offset || 0, (offset || 0) + (limit || suggestions.length)),
            total: suggestions.length,
        })

        // Require at least one filter
        if (!status && !adsetId) {
            return jsonError(res, 'VALIDATION_ERROR', 400, 'At least one filter (status or adsetId) is required')
        }

        // Query based on filters
        let result

        if (adsetId && status === 'pending') {
            // Special case: pending + adsetId
            const suggestions = await suggestionRepository.findPendingByAdsetId(adsetId)
            result = applyPagination(suggestions)
        } else if (adsetId && status && (status === 'approved' || status === 'rejected')) {
            // Both filters: adsetId + status (approved/rejected only)
            result = await suggestionRepository.findByAdsetIdAndStatus(adsetId, status, limit, offset)
        } else if (adsetId) {
            // AdsetId only: returns approved + rejected (excludes pending)
            const suggestions = await suggestionRepository.findByAdsetId(adsetId)
            result = applyPagination(suggestions)
        } else {
            // Status only
            result = await suggestionRepository.findByStatus(status!, limit, offset)
        }

        return jsonSuccess(res, {
            status,
            adsetId,
            count: result.suggestions.length,
            total: result.total,
            limit,
            offset,
            suggestions: result.suggestions,
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}
