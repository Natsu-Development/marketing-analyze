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
    amountSpent?: number
    cpm?: number
    cpc?: number
    ctr?: number
    reach?: number
    frequency?: number
    inlineLinkCtr?: number
    costPerInlineLinkClick?: number
    purchaseRoas?: number
}

const AdSetInsightDataSchema = new Schema<IAdSetInsightDataDocument>(
    {
        adAccountId: { type: String, required: true },
        accountId: { type: String, required: true },
        accountName: { type: String },
        campaignId: { type: String, required: true },
        campaignName: { type: String },
        adsetId: { type: String, required: true },
        adsetName: { type: String },
        date: { type: Date, required: true },
        impressions: { type: Number },
        clicks: { type: Number },
        amountSpent: { type: Number },
        cpm: { type: Number },
        cpc: { type: Number },
        ctr: { type: Number },
        reach: { type: Number },
        frequency: { type: Number },
        inlineLinkCtr: { type: Number },
        costPerInlineLinkClick: { type: Number },
        purchaseRoas: { type: Number },
    },
    {
        collection: 'adset_insights',
        timestamps: false,
    }
)

// Unique compound index to prevent duplicates: one record per adset per day
AdSetInsightDataSchema.index({ adAccountId: 1, adsetId: 1, date: 1 }, { unique: true })

// Index for querying insights by adset (used in suggestion analysis)
AdSetInsightDataSchema.index({ adsetId: 1, date: 1 })

export const AdSetInsightDataModel = model<IAdSetInsightDataDocument>('AdSetInsightData', AdSetInsightDataSchema)
