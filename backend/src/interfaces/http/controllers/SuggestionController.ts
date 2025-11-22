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
    type: z.enum(['adset', 'campaign'], {
        errorMap: () => ({ message: 'Type must be one of: adset, campaign' }),
    }).optional(),
    adsetId: z.string().min(1).optional(),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
    offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
})

const CampaignHistoryQuerySchema = z.object({
    campaign_id: z.string().min(1, 'campaign_id is required'),
    status: z.enum(['pending', 'approved', 'rejected'], {
        errorMap: () => ({ message: 'Status must be one of: pending, approved, rejected' }),
    }).optional(),
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
 * GET /api/suggestions?status=pending&type=adset&adsetId=123&limit=20&offset=0
 * Retrieves suggestions with optional filtering by status, type, and/or adsetId
 * KISS: Simplified query logic with early returns
 */
export async function getSuggestionsByStatus(req: Request, res: Response): Promise<void> {
    try {
        const { status, type, adsetId, limit, offset } = SuggestionStatusQuerySchema.parse(req.query)

        // Helper: Apply manual pagination
        const applyPagination = (suggestions: any[]) => ({
            suggestions: suggestions.slice(offset || 0, (offset || 0) + (limit || suggestions.length)),
            total: suggestions.length,
        })

        // Require at least one filter
        if (!status && !adsetId && !type) {
            return jsonError(res, 'VALIDATION_ERROR', 400, 'At least one filter (status, type, or adsetId) is required')
        }

        // Query based on filters
        let result

        // Type + status filter (new for campaign support)
        if (type && status) {
            result = await suggestionRepository.findByTypeAndStatus(type, status, limit, offset)
        } else if (adsetId && status === 'pending') {
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
        } else if (status) {
            // Status only
            result = await suggestionRepository.findByStatus(status, limit, offset)
        } else {
            return jsonError(res, 'VALIDATION_ERROR', 400, 'Invalid filter combination')
        }

        return jsonSuccess(res, {
            status,
            type,
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

/**
 * GET /api/campaign/history?campaign_id=123&status=approved&limit=20&offset=0
 * Retrieves campaign suggestion history for a specific campaign
 */
export async function getCampaignHistory(req: Request, res: Response): Promise<void> {
    try {
        const { campaign_id, status, limit, offset } = CampaignHistoryQuerySchema.parse(req.query)

        let result

        if (status) {
            // Filter by campaignId and status
            result = await suggestionRepository.findByCampaignIdAndStatus(campaign_id, status, limit, offset)
        } else {
            // Get all suggestions for campaign (pending, approved, rejected)
            // We need to get each status separately and combine
            const [pending, approved, rejected] = await Promise.all([
                suggestionRepository.findPendingByCampaignId(campaign_id),
                suggestionRepository.findByCampaignIdAndStatus(campaign_id, 'approved', limit, offset),
                suggestionRepository.findByCampaignIdAndStatus(campaign_id, 'rejected', limit, offset),
            ])

            const allSuggestions = [...pending, ...approved.suggestions, ...rejected.suggestions]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

            result = {
                suggestions: allSuggestions.slice(offset || 0, (offset || 0) + (limit || allSuggestions.length)),
                total: pending.length + approved.total + rejected.total,
            }
        }

        return jsonSuccess(res, {
            campaignId: campaign_id,
            status,
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
