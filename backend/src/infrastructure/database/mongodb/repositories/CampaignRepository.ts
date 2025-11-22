/**
 * Repository Implementation: CampaignRepository
 */

import { ICampaignRepository, PaginatedCampaigns, BatchResult } from '../../../../domain/repositories/ICampaignRepository'
import { Campaign } from '../../../../domain/aggregates/campaign'
import { CampaignSchema } from '../schemas/CampaignSchema'

const toDomain = (doc: any): Campaign => {
    const plain = doc.toObject ? doc.toObject() : doc
    return {
        id: plain._id.toString(),
        accountId: plain.accountId,
        adAccountId: plain.adAccountId,
        campaignId: plain.campaignId,
        campaignName: plain.campaignName,
        status: plain.status,
        dailyBudget: plain.dailyBudget,
        lifetimeBudget: plain.lifetimeBudget,
        currency: plain.currency,
        startTime: plain.startTime,
        endTime: plain.endTime,
        lastScaledAt: plain.lastScaledAt ?? null,
        syncedAt: plain.syncedAt,
    }
}

const fromDomain = (campaign: Campaign) => ({
    accountId: campaign.accountId,
    adAccountId: campaign.adAccountId,
    campaignId: campaign.campaignId,
    campaignName: campaign.campaignName,
    status: campaign.status,
    dailyBudget: campaign.dailyBudget,
    lifetimeBudget: campaign.lifetimeBudget,
    currency: campaign.currency,
    startTime: campaign.startTime,
    endTime: campaign.endTime,
    lastScaledAt: campaign.lastScaledAt,
    syncedAt: campaign.syncedAt,
})

const save = async (campaign: Campaign): Promise<Campaign> => {
    const result = await CampaignSchema.findOneAndUpdate(
        { adAccountId: campaign.adAccountId, campaignId: campaign.campaignId },
        fromDomain(campaign),
        { upsert: true, new: true, runValidators: true }
    )
    return toDomain(result)
}

const saveBatch = async (campaigns: Campaign[]): Promise<BatchResult> => {
    if (campaigns.length === 0) {
        return { upsertedCount: 0, modifiedCount: 0 }
    }

    const bulkOps = campaigns.map(campaign => ({
        updateOne: {
            filter: { adAccountId: campaign.adAccountId, campaignId: campaign.campaignId },
            update: { $set: fromDomain(campaign) },
            upsert: true,
        },
    }))

    const result = await CampaignSchema.bulkWrite(bulkOps, { ordered: false })
    return {
        upsertedCount: result.upsertedCount || 0,
        modifiedCount: result.modifiedCount || 0,
    }
}

const findByCampaignId = async (adAccountId: string, campaignId: string): Promise<Campaign | null> => {
    const doc = await CampaignSchema.findOne({ adAccountId, campaignId })
    return doc ? toDomain(doc) : null
}

const findByAdAccountId = async (adAccountId: string): Promise<Campaign[]> => {
    const docs = await CampaignSchema.find({ adAccountId }).sort({ campaignName: 1 })
    return docs.map(toDomain)
}

const findActiveCampaigns = async (): Promise<Campaign[]> => {
    const docs = await CampaignSchema.find({ status: 'ACTIVE' }).sort({ campaignName: 1 })
    return docs.map(toDomain)
}

/**
 * Find active campaigns with budget at campaign level
 */
const findActiveWithBudget = async (): Promise<Campaign[]> => {
    const docs = await CampaignSchema.find({
        status: 'ACTIVE',
        $or: [
            { dailyBudget: { $gt: 0 } },
            { lifetimeBudget: { $gt: 0 } },
        ],
    }).sort({ campaignName: 1 })
    return docs.map(toDomain)
}

/**
 * Find all campaigns with pagination, sorted by lastScaledAt descending
 */
const findAllPaginated = async (limit?: number, offset?: number): Promise<PaginatedCampaigns> => {
    const pipeline: any[] = [
        {
            $addFields: {
                hasScaledAt: { $cond: { if: { $eq: ['$lastScaledAt', null] }, then: 0, else: 1 } },
            },
        },
        { $sort: { hasScaledAt: -1, lastScaledAt: -1, campaignName: 1 } },
    ]

    if (offset && offset > 0) pipeline.push({ $skip: offset })
    if (limit && limit > 0) pipeline.push({ $limit: limit })

    const [docs, total] = await Promise.all([
        CampaignSchema.aggregate(pipeline),
        CampaignSchema.countDocuments(),
    ])

    return {
        campaigns: docs.map((doc: any) => ({
            id: doc._id.toString(),
            accountId: doc.accountId,
            adAccountId: doc.adAccountId,
            campaignId: doc.campaignId,
            campaignName: doc.campaignName,
            status: doc.status,
            dailyBudget: doc.dailyBudget,
            lifetimeBudget: doc.lifetimeBudget,
            currency: doc.currency,
            startTime: doc.startTime,
            endTime: doc.endTime,
            lastScaledAt: doc.lastScaledAt ?? null,
            syncedAt: doc.syncedAt,
        })),
        total,
    }
}

export const campaignRepository: ICampaignRepository = {
    save,
    saveBatch,
    findByCampaignId,
    findByAdAccountId,
    findActiveCampaigns,
    findActiveWithBudget,
    findAllPaginated,
}
