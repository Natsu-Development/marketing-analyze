/**
 * Repository Implementation: SuggestionRepository
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

// Build entity filter based on type
const buildEntityFilter = (type: SuggestionType, entityId: string) =>
    type === 'campaign' ? { campaignId: entityId } : { adsetId: entityId }

// Helper for paginated queries
const paginatedQuery = async (
    filter: Record<string, any>,
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => {
    const query = SuggestionSchema.find(filter).sort({ createdAt: -1 })
    if (offset && offset > 0) query.skip(offset)
    if (limit && limit > 0) query.limit(limit)

    const [docs, total] = await Promise.all([
        query.exec(),
        SuggestionSchema.countDocuments(filter)
    ])
    return { suggestions: docs.map(toDomain), total }
}

const saveAdsetSuggestion = async (suggestion: Suggestion): Promise<Suggestion> => {
    const filter = { adAccountId: suggestion.adAccountId, adsetId: suggestion.adsetId, type: 'adset', status: 'pending' }
    const result = await SuggestionSchema.findOneAndUpdate(
        filter,
        fromDomain(suggestion),
        { upsert: true, new: true, runValidators: true }
    )
    return toDomain(result)
}

const saveCampaignSuggestion = async (suggestion: Suggestion): Promise<Suggestion> => {
    const filter = { adAccountId: suggestion.adAccountId, campaignId: suggestion.campaignId, type: 'campaign', status: 'pending' }
    const result = await SuggestionSchema.findOneAndUpdate(
        filter,
        fromDomain(suggestion),
        { upsert: true, new: true, runValidators: true }
    )
    return toDomain(result)
}

const findById = async (id: string): Promise<Suggestion | null> => {
    const doc = await SuggestionSchema.findById(id)
    return doc ? toDomain(doc) : null
}

const deleteBulk = async (ids: string[]): Promise<number> => {
    const result = await SuggestionSchema.deleteMany({ _id: { $in: ids } })
    return result.deletedCount || 0
}

const findPending = async (type: SuggestionType, entityId: string): Promise<Suggestion[]> => {
    const filter = { ...buildEntityFilter(type, entityId), type, status: 'pending' }
    const docs = await SuggestionSchema.find(filter).sort({ createdAt: -1 })
    return docs.map(toDomain)
}

const findByTypeAndStatus = async (
    type: SuggestionType,
    status: 'pending' | 'approved' | 'rejected',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => paginatedQuery({ type, status }, limit, offset)

const findByEntityAndStatus = async (
    type: SuggestionType,
    entityId: string,
    status: 'pending' | 'approved' | 'rejected',
    limit?: number,
    offset?: number
): Promise<PaginatedSuggestions> => paginatedQuery({ ...buildEntityFilter(type, entityId), type, status }, limit, offset)

export const suggestionRepository: ISuggestionRepository = {
    saveAdsetSuggestion,
    saveCampaignSuggestion,
    findById,
    deleteBulk,
    findPending,
    findByTypeAndStatus,
    findByEntityAndStatus,
}
