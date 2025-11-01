/**
 * MongoDB Schema: Adset Insight Data
 * Stores adset-level insight data from Facebook exports
 */

import { Schema, model, Document } from 'mongoose'

export interface IAdSetInsightDataDocument extends Document {
    adAccountId: string
    accountId: string
    accountName?: string
    campaignId: string
    campaignName?: string
    adsetId: string
    adsetName?: string
    date: Date // Date from Facebook report for daily aggregation
    impressions?: number
    clicks?: number
    spend?: number
    cpm?: number
    cpc?: number
    ctr?: number
    reach?: number
    frequency?: number
    linkCtr?: number
    costPerInlineLinkClick?: number
    costPerResult?: number
    roas?: number
}

const AdSetInsightDataSchema = new Schema<IAdSetInsightDataDocument>(
    {
        adAccountId: { type: String, required: true, index: true },
        accountId: { type: String, required: true },
        accountName: { type: String },
        campaignId: { type: String, required: true, index: true },
        campaignName: { type: String },
        adsetId: { type: String, required: true, index: true },
        adsetName: { type: String },
        date: { type: Date, required: true, index: true },
        impressions: { type: Number },
        clicks: { type: Number },
        spend: { type: Number },
        cpm: { type: Number },
        cpc: { type: Number },
        ctr: { type: Number },
        reach: { type: Number },
        frequency: { type: Number },
        linkCtr: { type: Number },
        costPerInlineLinkClick: { type: Number },
        costPerResult: { type: Number },
        roas: { type: Number },
    },
    {
        collection: 'adset_insights',
        timestamps: false,
    }
)

// Unique compound index to prevent duplicates: adsetId + date (one record per adset per day)
AdSetInsightDataSchema.index({ adAccountId: 1, adsetId: 1, date: 1 }, { unique: true })

export const AdSetInsightDataModel = model<IAdSetInsightDataDocument>('AdSetInsightData', AdSetInsightDataSchema)
