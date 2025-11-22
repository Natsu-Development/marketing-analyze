/**
 * Repository Implementation: AdSet Insight Data
 */

import { IAdSetInsightRepository, AggregatedCampaignMetrics } from '../../../../domain/repositories/IAdSetInsightRepository'
import { AdSetInsight } from '../../../../domain/aggregates/adset-insights'
import { AdSetInsightDataModel } from '../schemas/AdSetInsightSchema'

const toDomain = (doc: any): AdSetInsight => {
    const plainDoc = doc.toObject ? doc.toObject() : doc

    return {
        id: plainDoc._id.toString(),
        adAccountId: plainDoc.adAccountId,
        accountId: plainDoc.accountId,
        accountName: plainDoc.accountName,
        campaignId: plainDoc.campaignId,
        campaignName: plainDoc.campaignName,
        adsetId: plainDoc.adsetId,
        adsetName: plainDoc.adsetName,
        impressions: plainDoc.impressions,
        clicks: plainDoc.clicks,
        amountSpent: plainDoc.amountSpent,
        cpm: plainDoc.cpm,
        cpc: plainDoc.cpc,
        ctr: plainDoc.ctr,
        reach: plainDoc.reach,
        frequency: plainDoc.frequency,
        inlineLinkCtr: plainDoc.inlineLinkCtr,
        costPerInlineLinkClick: plainDoc.costPerInlineLinkClick,
        purchaseRoas: plainDoc.purchaseRoas,
        postComments: plainDoc.postComments,
        costPerResult: plainDoc.costPerResult,
        purchases: plainDoc.purchases,
        totalMessagingContacts: plainDoc.totalMessagingContacts,
        purchasesConversionValue: plainDoc.purchasesConversionValue,
        // Calculated fields
        costPerPurchase: plainDoc.costPerPurchase,
        costPerInteract: plainDoc.costPerInteract,
        costDivideRevenue: plainDoc.costDivideRevenue,
    }
}

const saveBatch = async (insights: AdSetInsight[]): Promise<void> => {
    if (insights.length === 0) return

    // Use bulkWrite with upsert to prevent duplicates
    // Each sync replaces the previous aggregated data for the adset
    const operations = insights.map((insight) => ({
        updateOne: {
            filter: {
                adAccountId: insight.adAccountId,
                adsetId: insight.adsetId,
            },
            update: {
                $set: {
                    accountId: insight.accountId,
                    accountName: insight.accountName,
                    campaignId: insight.campaignId,
                    campaignName: insight.campaignName,
                    adsetName: insight.adsetName,
                    impressions: insight.impressions,
                    clicks: insight.clicks,
                    amountSpent: insight.amountSpent,
                    cpm: insight.cpm,
                    cpc: insight.cpc,
                    ctr: insight.ctr,
                    reach: insight.reach,
                    frequency: insight.frequency,
                    inlineLinkCtr: insight.inlineLinkCtr,
                    costPerInlineLinkClick: insight.costPerInlineLinkClick,
                    purchaseRoas: insight.purchaseRoas,
                    postComments: insight.postComments,
                    costPerResult: insight.costPerResult,
                    purchases: insight.purchases,
                    totalMessagingContacts: insight.totalMessagingContacts,
                    purchasesConversionValue: insight.purchasesConversionValue,
                    // Calculated fields
                    costPerPurchase: insight.costPerPurchase,
                    costPerInteract: insight.costPerInteract,
                    costDivideRevenue: insight.costDivideRevenue,
                },
            },
            upsert: true,
        },
    }))

    await AdSetInsightDataModel.bulkWrite(operations, { ordered: false })
}

const findByAdAccountId = async (adAccountId: string): Promise<AdSetInsight[]> => {
    const docs = await AdSetInsightDataModel.find({ adAccountId }).sort({ updatedAt: -1 })
    return docs.map(toDomain)
}

const findByAdsetId = async (adsetId: string): Promise<AdSetInsight[]> => {
    const docs = await AdSetInsightDataModel.find({ adsetId }).sort({ updatedAt: -1 })
    return docs.map(toDomain)
}

/**
 * Aggregate adset insights by campaignId for campaign-level metrics
 * Uses MongoDB aggregation pipeline to calculate:
 * - Sum for volume metrics: impressions, clicks, spend, reach, purchases, purchasesConversionValue
 * - Weighted average for CPM and CTR: (sum of metric * impressions) / sum of impressions
 * - Calculated ratios: frequency, costPerInlineLinkClick, purchaseRoas
 */
const aggregateByCampaignId = async (campaignId: string): Promise<AggregatedCampaignMetrics | null> => {
    const pipeline = [
        // Filter by campaignId, exclude null/undefined values
        {
            $match: {
                campaignId,
                impressions: { $ne: null, $gt: 0 },
            },
        },
        // Group and aggregate
        {
            $group: {
                _id: '$campaignId',
                // Volume metrics (sum)
                totalImpressions: { $sum: '$impressions' },
                totalClicks: { $sum: '$clicks' },
                totalAmountSpent: { $sum: '$amountSpent' },
                totalReach: { $sum: '$reach' },
                totalPurchases: { $sum: '$purchases' },
                totalPurchasesConversionValue: { $sum: '$purchasesConversionValue' },
                // For weighted averages: sum(metric * impressions)
                weightedCpm: { $sum: { $multiply: [{ $ifNull: ['$cpm', 0] }, '$impressions'] } },
                weightedCtr: { $sum: { $multiply: [{ $ifNull: ['$ctr', 0] }, '$impressions'] } },
                weightedInlineLinkCtr: { $sum: { $multiply: [{ $ifNull: ['$inlineLinkCtr', 0] }, '$impressions'] } },
                // For costPerInlineLinkClick: sum of inline link clicks (derived from ctr and clicks)
                totalInlineLinkClicks: {
                    $sum: {
                        $cond: [
                            { $and: [{ $ne: ['$costPerInlineLinkClick', null] }, { $gt: ['$costPerInlineLinkClick', 0] }] },
                            { $divide: ['$amountSpent', '$costPerInlineLinkClick'] },
                            0,
                        ],
                    },
                },
            },
        },
        // Calculate final metrics
        {
            $project: {
                _id: 0,
                campaignId: '$_id',
                // Volume metrics
                impressions: '$totalImpressions',
                clicks: '$totalClicks',
                amountSpent: '$totalAmountSpent',
                reach: '$totalReach',
                purchases: '$totalPurchases',
                purchasesConversionValue: '$totalPurchasesConversionValue',
                // Weighted averages
                cpm: {
                    $cond: [{ $gt: ['$totalImpressions', 0] }, { $divide: ['$weightedCpm', '$totalImpressions'] }, 0],
                },
                ctr: {
                    $cond: [{ $gt: ['$totalImpressions', 0] }, { $divide: ['$weightedCtr', '$totalImpressions'] }, 0],
                },
                // Calculated ratios
                frequency: {
                    $cond: [{ $gt: ['$totalReach', 0] }, { $divide: ['$totalImpressions', '$totalReach'] }, 0],
                },
                inlineLinkCtr: {
                    $cond: [{ $gt: ['$totalImpressions', 0] }, { $divide: ['$weightedInlineLinkCtr', '$totalImpressions'] }, 0],
                },
                costPerInlineLinkClick: {
                    $cond: [{ $gt: ['$totalInlineLinkClicks', 0] }, { $divide: ['$totalAmountSpent', '$totalInlineLinkClicks'] }, 0],
                },
                purchaseRoas: {
                    $cond: [{ $gt: ['$totalAmountSpent', 0] }, { $divide: ['$totalPurchasesConversionValue', '$totalAmountSpent'] }, 0],
                },
            },
        },
    ]

    const results = await AdSetInsightDataModel.aggregate(pipeline)

    if (results.length === 0) {
        return null
    }

    return results[0] as AggregatedCampaignMetrics
}

export const adsetInsightDataRepository: IAdSetInsightRepository = {
    saveBatch,
    findByAdAccountId,
    findByAdsetId,
    aggregateByCampaignId,
}
