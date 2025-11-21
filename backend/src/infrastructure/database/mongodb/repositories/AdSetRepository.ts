/**
 * Repository Implementation: AdSetRepository
 * Uses plain functional approach for AdSet persistence
 */

import { IAdSetRepository, PaginatedAdSets } from '../../../../domain/repositories/IAdSetRepository'
import { AdSet } from '../../../../domain/aggregates/adset'
import { AdSetSchema } from '../schemas/AdSetSchema'

// Convert Mongoose document to plain domain object
const toDomain = (doc: any): AdSet => {
    // Convert Mongoose document to plain object to avoid document pollution
    const plainDoc = doc.toObject ? doc.toObject() : doc

    return {
        id: plainDoc._id.toString(),
        accountId: plainDoc.accountId,
        adAccountId: plainDoc.adAccountId,
        adsetId: plainDoc.adsetId,
        adsetName: plainDoc.adsetName,
        campaignId: plainDoc.campaignId,
        campaignName: plainDoc.campaignName,
        status: plainDoc.status,
        currency: plainDoc.currency,
        dailyBudget: plainDoc.dailyBudget,
        lifetimeBudget: plainDoc.lifetimeBudget,
        startTime: plainDoc.startTime,
        endTime: plainDoc.endTime,
        lastScaledAt: plainDoc.lastScaledAt,
        updatedTime: plainDoc.updatedTime,
        syncedAt: plainDoc.syncedAt,
    }
}

// Convert domain object to database format
const fromDomain = (adset: AdSet) => ({
    accountId: adset.accountId,
    adAccountId: adset.adAccountId,
    adsetId: adset.adsetId,
    adsetName: adset.adsetName,
    campaignId: adset.campaignId,
    campaignName: adset.campaignName,
    status: adset.status,
    currency: adset.currency,
    dailyBudget: adset.dailyBudget,
    lifetimeBudget: adset.lifetimeBudget,
    startTime: adset.startTime,
    endTime: adset.endTime,
    lastScaledAt: adset.lastScaledAt,
    updatedTime: adset.updatedTime,
    syncedAt: adset.syncedAt,
})

const save = async (adset: AdSet): Promise<AdSet> => {
    const doc = fromDomain(adset)
    const result = await AdSetSchema.findOneAndUpdate(
        { adAccountId: adset.adAccountId, adsetId: adset.adsetId },
        doc,
        {
            upsert: true,
            new: true,
            runValidators: true,
        }
    )

    return toDomain(result)
}

const saveBatch = async (adsets: AdSet[]): Promise<{ upsertedCount: number; modifiedCount: number }> => {
    if (adsets.length === 0) {
        return { upsertedCount: 0, modifiedCount: 0 }
    }

    const bulkOps = adsets.map(adset => ({
        updateOne: {
            filter: { adAccountId: adset.adAccountId, adsetId: adset.adsetId },
            update: {
                $set: fromDomain(adset),
            },
            upsert: true,
        },
    }))

    const result = await AdSetSchema.bulkWrite(bulkOps, { ordered: false })

    return {
        upsertedCount: result.upsertedCount || 0,
        modifiedCount: result.modifiedCount || 0,
    }
}

const findAllActive = async (): Promise<AdSet[]> => {
    const docs = await AdSetSchema.find({ status: 'ACTIVE' }).sort({ updatedTime: -1 })
    return docs.map(toDomain)
}

const findByAdSetId = async (adAccountId: string, adsetId: string): Promise<AdSet | null> => {
    const doc = await AdSetSchema.findOne({ adAccountId, adsetId })
    return doc ? toDomain(doc) : null
}

const findAllWithPagination = async (limit?: number, offset?: number): Promise<PaginatedAdSets> => {
    const query = AdSetSchema.find().sort({ lastScaledAt: -1, updatedTime: -1 })

    if (offset !== undefined) {
        query.skip(offset)
    }

    if (limit !== undefined) {
        query.limit(limit)
    }

    const docs = await query.exec()
    const total = await AdSetSchema.countDocuments()

    return {
        adsets: docs.map(toDomain),
        total,
    }
}

export const adSetRepository: IAdSetRepository = {
    save,
    saveBatch,
    findAllActive,
    findByAdSetId,
    findAllWithPagination,
}
