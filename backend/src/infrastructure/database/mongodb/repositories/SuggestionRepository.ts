/**
 * Repository Implementation: SuggestionRepository
 * Uses plain functional approach following existing repository patterns
 */

import { ISuggestionRepository, Suggestion, ExceedingMetric, PaginatedSuggestions, SuggestionType } from '../../../../domain'
import { SuggestionSchema } from '../schemas/SuggestionSchema'

const toDomain = (doc: any): Suggestion => {
    const plainDoc = doc.toObject ? doc.toObject() : doc

    return {
        id: plainDoc._id.toString(),
        type: plainDoc.type,
        accountId: plainDoc.accountId,
        adAccountId: plainDoc.adAccountId,
        adAccountName: plainDoc.adAccountName,
        campaignId: plainDoc.campaignId,
        campaignName: plainDoc.campaignName,
        adsetId: plainDoc.adsetId,
        adsetName: plainDoc.adsetName,
        adsetLink: plainDoc.adsetLink,
        currency: plainDoc.currency,
        budget: plainDoc.budget,
        budgetAfterScale: plainDoc.budgetAfterScale,
        scalePercent: plainDoc.scalePercent,
        note: plainDoc.note,
        metrics: plainDoc.metrics as ReadonlyArray<ExceedingMetric>,
        metricsExceededCount: plainDoc.metricsExceededCount,
        status: plainDoc.status,
        recentScaleAt: plainDoc.recentScaleAt ?? null,
        createdAt: plainDoc.createdAt,
        updatedAt: plainDoc.updatedAt,
    }
}

// Convert domain object to database format
const fromDomain = (suggestion: Suggestion) => ({
    type: suggestion.type,
    accountId: suggestion.accountId,
    adAccountId: suggestion.adAccountId,
    adAccountName: suggestion.adAccountName,
    campaignId: suggestion.campaignId,
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
        status: { $in: ['approved', 'rejected'] }
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
    status: 'pending' | 'approved' | 'rejected',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    const filter = { adsetId, status }
    const query = SuggestionSchema.find(filter).sort({ createdAt: -1 })

    if (offset !== undefined && offset > 0) {
        query.skip(offset)
    }
    if (limit !== undefined && limit > 0) {
        query.limit(limit)
    }

    const [docs, total] = await Promise.all([
        query.exec(),
        SuggestionSchema.countDocuments(filter)
    ])

    return {
        suggestions: docs.map(toDomain),
        total
    }
}

/**
 * Find all suggestions by status, sorted by exceeding count (descending)
 */
const findByStatus = async (
    status: 'pending' | 'approved' | 'rejected',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    const filter = { status }
    const query = SuggestionSchema.find(filter).sort({ metricsExceededCount: -1 })

    if (offset !== undefined && offset > 0) {
        query.skip(offset)
    }
    if (limit !== undefined && limit > 0) {
        query.limit(limit)
    }

    const [docs, total] = await Promise.all([
        query.exec(),
        SuggestionSchema.countDocuments(filter)
    ])

    return {
        suggestions: docs.map(toDomain),
        total
    }
}

/**
 * Find pending suggestions by campaignId
 */
const findPendingByCampaignId = async (campaignId: string): Promise<Suggestion[]> => {
    const docs = await SuggestionSchema.find({
        campaignId,
        type: 'campaign',
        status: 'pending'
    }).sort({ createdAt: -1 })
    return docs.map(toDomain)
}

/**
 * Find suggestions by campaignId and status with pagination
 */
const findByCampaignIdAndStatus = async (
    campaignId: string,
    status: 'pending' | 'approved' | 'rejected',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    const query = SuggestionSchema.find({
        campaignId,
        type: 'campaign',
        status
    }).sort({ createdAt: -1 })

    if (offset !== undefined && offset > 0) {
        query.skip(offset)
    }
    if (limit !== undefined && limit > 0) {
        query.limit(limit)
    }

    const [docs, total] = await Promise.all([
        query.exec(),
        SuggestionSchema.countDocuments({ campaignId, type: 'campaign', status })
    ])

    return {
        suggestions: docs.map(toDomain),
        total
    }
}

/**
 * Find suggestions by type and status with pagination
 */
const findByTypeAndStatus = async (
    type: SuggestionType,
    status: 'pending' | 'approved' | 'rejected',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    const filter = { type, status }
    const query = SuggestionSchema.find(filter).sort({ createdAt: -1 })

    if (offset !== undefined && offset > 0) {
        query.skip(offset)
    }
    if (limit !== undefined && limit > 0) {
        query.limit(limit)
    }

    const [docs, total] = await Promise.all([
        query.exec(),
        SuggestionSchema.countDocuments(filter)
    ])

    return {
        suggestions: docs.map(toDomain),
        total
    }
}

/**
 * Find all campaign suggestions by campaignId (all statuses) with pagination
 */
const findByCampaignId = async (
    campaignId: string,
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    const filter = { campaignId, type: 'campaign' }
    const query = SuggestionSchema.find(filter).sort({ createdAt: -1 })

    if (offset !== undefined && offset > 0) {
        query.skip(offset)
    }
    if (limit !== undefined && limit > 0) {
        query.limit(limit)
    }

    const [docs, total] = await Promise.all([
        query.exec(),
        SuggestionSchema.countDocuments(filter)
    ])

    return {
        suggestions: docs.map(toDomain),
        total
    }
}

/**
 * Find all adset suggestions by adsetId (all statuses or filtered) with pagination
 */
const findByAdsetIdPaginated = async (
    adsetId: string,
    status?: 'pending' | 'approved' | 'rejected',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    const filter: Record<string, any> = { adsetId }
    if (status) {
        filter.status = status
    }

    const query = SuggestionSchema.find(filter).sort({ createdAt: -1 })

    if (offset !== undefined && offset > 0) {
        query.skip(offset)
    }
    if (limit !== undefined && limit > 0) {
        query.limit(limit)
    }

    const [docs, total] = await Promise.all([
        query.exec(),
        SuggestionSchema.countDocuments(filter)
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
    findPendingByCampaignId,
    findByCampaignIdAndStatus,
    findByTypeAndStatus,
    findByCampaignId,
    findByAdsetIdPaginated,
}
