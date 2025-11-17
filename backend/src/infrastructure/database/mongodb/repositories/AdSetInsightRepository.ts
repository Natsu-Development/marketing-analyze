/**
 * Repository Implementation: AdSet Insight Data
 */

import { IAdSetInsightRepository } from '../../../../domain/repositories/IAdSetInsightRepository'
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
        date: plainDoc.date,
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
    const operations = insights.map((insight) => ({
        updateOne: {
            filter: {
                adAccountId: insight.adAccountId,
                adsetId: insight.adsetId,
                date: insight.date,
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
    const docs = await AdSetInsightDataModel.find({ adAccountId }).sort({ date: -1 })
    return docs.map(toDomain)
}

const findByAdsetId = async (adsetId: string): Promise<AdSetInsight[]> => {
    const docs = await AdSetInsightDataModel.find({ adsetId }).sort({ date: -1 })
    return docs.map(toDomain)
}

export const adsetInsightDataRepository: IAdSetInsightRepository = {
    saveBatch,
    findByAdAccountId,
    findByAdsetId,
}
