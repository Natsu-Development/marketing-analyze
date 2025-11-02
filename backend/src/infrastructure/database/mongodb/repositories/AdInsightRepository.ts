/**
 * Repository Implementation: Adset Insight Data
 */

import { IAdInsightRepository } from '../../../../domain/repositories/IAdSetInsightRepository'
import { AdSetInsight } from '../../../../domain/aggregates/ad-insights'
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
        cpm: plainDoc.cpm,
        cpc: plainDoc.cpc,
        ctr: plainDoc.ctr,
        reach: plainDoc.reach,
        frequency: plainDoc.frequency,
        linkCtr: plainDoc.linkCtr,
        costPerInlineLinkClick: plainDoc.costPerInlineLinkClick,
        costPerResult: plainDoc.costPerResult,
        roas: plainDoc.roas,
        spend: plainDoc.spend,
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
                    cpm: insight.cpm,
                    cpc: insight.cpc,
                    ctr: insight.ctr,
                    reach: insight.reach,
                    frequency: insight.frequency,
                    linkCtr: insight.linkCtr,
                    costPerInlineLinkClick: insight.costPerInlineLinkClick,
                    costPerResult: insight.costPerResult,
                    roas: insight.roas,
                    spend: insight.spend,
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

export const adsetInsightDataRepository: IAdInsightRepository = {
    saveBatch,
    findByAdAccountId,
}
