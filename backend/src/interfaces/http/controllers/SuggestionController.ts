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

// Shared pagination schema
const PaginationSchema = z.object({
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
})

const StatusSchema = z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be one of: pending, approved, rejected' }),
})

const SuggestionStatusQuerySchema = PaginationSchema.extend({
    status: StatusSchema,
    type: z.enum(['adset', 'campaign'], {
        errorMap: () => ({ message: 'Type must be one of: adset, campaign' }),
    }).optional(),
})

const HistoryQuerySchema = PaginationSchema.extend({
    status: StatusSchema.optional(),
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
 * GET /api/suggestions?status=pending&type=adset&limit=20&offset=0
 * Retrieves suggestions by status with optional type filter
 */
export async function getSuggestionsByStatus(req: Request, res: Response): Promise<void> {
    try {
        const { status, type, limit, offset } = SuggestionStatusQuerySchema.parse(req.query)

        const result = type
            ? await suggestionRepository.findByTypeAndStatus(type, status, limit, offset)
            : await suggestionRepository.findByStatus(status, limit, offset)

        return jsonSuccess(res, {
            status, type, limit, offset,
            count: result.suggestions.length,
            total: result.total,
            suggestions: result.suggestions,
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}

/**
 * GET /api/suggestions/adset/:adsetId/history?status=approved&limit=20&offset=0
 * Retrieves adset suggestion history
 */
export async function getAdsetHistory(req: Request, res: Response): Promise<void> {
    try {
        const { adsetId } = z.object({ adsetId: z.string().min(1) }).parse(req.params)
        const { status, limit, offset } = HistoryQuerySchema.parse(req.query)

        const result = await suggestionRepository.findByAdsetIdPaginated(adsetId, status, limit, offset)

        return jsonSuccess(res, {
            adsetId, status, limit, offset,
            count: result.suggestions.length,
            total: result.total,
            suggestions: result.suggestions,
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}

/**
 * GET /api/suggestions/campaign/:campaignId/history?status=approved&limit=20&offset=0
 * Retrieves campaign suggestion history
 */
export async function getCampaignHistory(req: Request, res: Response): Promise<void> {
    try {
        const { campaignId } = z.object({ campaignId: z.string().min(1) }).parse(req.params)
        const { status, limit, offset } = HistoryQuerySchema.parse(req.query)

        const result = status
            ? await suggestionRepository.findByCampaignIdAndStatus(campaignId, status, limit, offset)
            : await suggestionRepository.findByCampaignId(campaignId, limit, offset)

        return jsonSuccess(res, {
            campaignId, status, limit, offset,
            count: result.suggestions.length,
            total: result.total,
            suggestions: result.suggestions,
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return handleValidationError(res, error)
        }
        return handleInternalError(res, error)
    }
}
