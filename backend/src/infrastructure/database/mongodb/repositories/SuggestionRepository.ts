/**
 * Repository Implementation: SuggestionRepository
 * Uses plain functional approach following existing repository patterns
 */

import { ISuggestionRepository, Suggestion, ExceedingMetric, PaginatedSuggestions } from '../../../../domain'
import { SuggestionSchema } from '../schemas/SuggestionSchema'

// Convert Mongoose document to plain domain object with backward compatibility
const toDomain = (doc: any): Suggestion => {
    // Convert Mongoose document to plain object to avoid document pollution
    const plainDoc = doc.toObject ? doc.toObject() : doc

    return {
        id: plainDoc._id.toString(),
        accountId: plainDoc.accountId,
        adAccountId: plainDoc.adAccountId,
        adAccountName: plainDoc.adAccountName,
        campaignName: plainDoc.campaignName,
        adsetId: plainDoc.adsetId,
        adsetName: plainDoc.adsetName,
        adsetLink: plainDoc.adsetLink,
        currency: plainDoc.currency,
        // Handle both old and new field names for backward compatibility
        budget: plainDoc.budget ?? plainDoc.dailyBudget,
        budgetAfterScale: plainDoc.budgetAfterScale ?? plainDoc.budgetScaled,
        scalePercent: plainDoc.scalePercent,
        note: plainDoc.note,
        metrics: plainDoc.metrics as ReadonlyArray<ExceedingMetric>,
        metricsExceededCount: plainDoc.metricsExceededCount,
        status: plainDoc.status === 'applied' ? 'approved' : plainDoc.status, // Map old 'applied' to 'approved'
        recentScaleAt: plainDoc.recentScaleAt ?? null,
        createdAt: plainDoc.createdAt,
        updatedAt: plainDoc.updatedAt,
    }
}

// Convert domain object to database format
const fromDomain = (suggestion: Suggestion) => ({
    accountId: suggestion.accountId,
    adAccountId: suggestion.adAccountId,
    adAccountName: suggestion.adAccountName,
    campaignName: suggestion.campaignName,
    adsetId: suggestion.adsetId,
    adsetName: suggestion.adsetName,
    adsetLink: suggestion.adsetLink,
    currency: suggestion.currency,
    budget: suggestion.budget,
    budgetAfterScale: suggestion.budgetAfterScale,
    scalePercent: suggestion.scalePercent,
    note: suggestion.note,
    metrics: suggestion.metrics,
    metricsExceededCount: suggestion.metricsExceededCount,
    status: suggestion.status,
    recentScaleAt: suggestion.recentScaleAt,
})

/**
 * Save suggestion with upsert logic for duplicate handling
 */
const save = async (suggestion: Suggestion): Promise<Suggestion> => {
    const doc = fromDomain(suggestion)

    // Upsert based on composite key (adAccountId, adsetId, createdAt)
    // If suggestion already exists for same adset at same time, update it
    const result = await SuggestionSchema.findOneAndUpdate(
        {
            adAccountId: suggestion.adAccountId,
            adsetId: suggestion.adsetId,
            createdAt: suggestion.createdAt,
        },
        doc,
        {
            upsert: true,
            new: true,
            runValidators: true,
        }
    )

    return toDomain(result)
}

/**
 * Find suggestion by ID
 */
const findById = async (id: string): Promise<Suggestion | null> => {
    const doc = await SuggestionSchema.findById(id)
    return doc ? toDomain(doc) : null
}

/**
 * Find all suggestions for a specific adset (excluding pending)
 */
const findByAdsetId = async (adsetId: string): Promise<Suggestion[]> => {
    const docs = await SuggestionSchema.find({
        adsetId,
        status: { $in: ['approved', 'rejected', 'applied'] } // Include 'applied' for backward compatibility
    }).sort({ createdAt: -1 })
    return docs.map(toDomain)
}

/**
 * Find only pending suggestions for specific adset
 */
const findPendingByAdsetId = async (adsetId: string): Promise<Suggestion[]> => {
    const docs = await SuggestionSchema.find({
        adsetId,
        status: 'pending'
    }).sort({ createdAt: -1 })
    return docs.map(toDomain)
}

/**
 * Bulk delete suggestions by IDs
 */
const deleteBulk = async (ids: string[]): Promise<number> => {
    const result = await SuggestionSchema.deleteMany({
        _id: { $in: ids }
    })
    return result.deletedCount || 0
}

/**
 * Find suggestions by adset ID and status with pagination
 */
const findByAdsetIdAndStatus = async (
    adsetId: string,
    status: 'approved' | 'rejected',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    const query = SuggestionSchema.find({ adsetId, status }).sort({ createdAt: -1 })

    // Apply pagination if parameters provided
    if (offset !== undefined && offset > 0) {
        query.skip(offset)
    }
    if (limit !== undefined && limit > 0) {
        query.limit(limit)
    }

    // Execute query and get total count in parallel
    const [docs, total] = await Promise.all([
        query.exec(),
        SuggestionSchema.countDocuments({ adsetId, status })
    ])

    return {
        suggestions: docs.map(toDomain),
        total
    }
}

/**
 * Find all suggestions by status, sorted by exceeding count (descending)
 * Supports pagination with limit and offset
 */
const findByStatus = async (
    status: 'pending' | 'approved' | 'rejected',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    // For backward compatibility, include 'applied' when searching for 'approved'
    const statusFilter = status === 'approved'
        ? { $in: ['approved', 'applied'] }
        : status

    const query = SuggestionSchema.find({ status: statusFilter })
        .sort({ metricsExceededCount: -1 })

    // Apply pagination if limit is provided
    if (offset !== undefined && offset > 0) {
        query.skip(offset)
    }
    if (limit !== undefined && limit > 0) {
        query.limit(limit)
    }

    // Execute query and get total count in parallel
    const [docs, total] = await Promise.all([
        query.exec(),
        SuggestionSchema.countDocuments({ status: statusFilter })
    ])

    return {
        suggestions: docs.map(toDomain),
        total
    }
}

export const suggestionRepository: ISuggestionRepository = {
    save,
    findById,
    findByAdsetId,
    findPendingByAdsetId,
    deleteBulk,
    findByAdsetIdAndStatus,
    findByStatus,
}
