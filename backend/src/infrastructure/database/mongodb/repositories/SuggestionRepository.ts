/**
 * Repository Implementation: SuggestionRepository
 * Uses plain functional approach following existing repository patterns
 */

import { ISuggestionRepository, Suggestion, ExceedingMetric, PaginatedSuggestions } from '../../../../domain'
import { SuggestionSchema } from '../schemas/SuggestionSchema'

// Convert Mongoose document to plain domain object
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
        dailyBudget: plainDoc.dailyBudget,
        budgetScaled: plainDoc.budgetScaled,
        scalePercent: plainDoc.scalePercent,
        note: plainDoc.note,
        metrics: plainDoc.metrics as ReadonlyArray<ExceedingMetric>,
        metricsExceededCount: plainDoc.metricsExceededCount,
        status: plainDoc.status,
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
    dailyBudget: suggestion.dailyBudget,
    budgetScaled: suggestion.budgetScaled,
    scalePercent: suggestion.scalePercent,
    note: suggestion.note,
    metrics: suggestion.metrics,
    metricsExceededCount: suggestion.metricsExceededCount,
    status: suggestion.status,
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
 * Find all suggestions for a specific ad account
 */
const findByAdAccountId = async (adAccountId: string): Promise<Suggestion[]> => {
    const docs = await SuggestionSchema.find({ adAccountId }).sort({ createdAt: -1 })
    return docs.map(toDomain)
}

/**
 * Find all suggestions for a specific adset
 */
const findByAdsetId = async (adsetId: string): Promise<Suggestion[]> => {
    const docs = await SuggestionSchema.find({ adsetId }).sort({ createdAt: -1 })
    return docs.map(toDomain)
}

/**
 * Update suggestion status
 */
const updateStatus = async (id: string, status: 'pending' | 'rejected' | 'applied'): Promise<Suggestion | null> => {
    const result = await SuggestionSchema.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true }
    )

    return result ? toDomain(result) : null
}

/**
 * Find all suggestions by status, sorted by exceeding count (descending)
 * Supports pagination with limit and offset
 */
const findByStatus = async (
    status: 'pending' | 'rejected' | 'applied',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    const query = SuggestionSchema.find({ status })
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
        SuggestionSchema.countDocuments({ status })
    ])

    return {
        suggestions: docs.map(toDomain),
        total
    }
}

export const suggestionRepository: ISuggestionRepository = {
    save,
    findById,
    findByAdAccountId,
    findByAdsetId,
    updateStatus,
    findByStatus,
}
