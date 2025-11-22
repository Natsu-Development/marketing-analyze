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
    postComments?: number
    costPerResult?: number
    purchases?: number
    totalMessagingContacts?: number
    purchasesConversionValue?: number
    // Calculated fields
    costPerPurchase?: number
    costPerInteract?: number
    costDivideRevenue?: number
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
        postComments: { type: Number },
        costPerResult: { type: Number },
        purchases: { type: Number },
        totalMessagingContacts: { type: Number },
        purchasesConversionValue: { type: Number },
        // Calculated fields
        costPerPurchase: { type: Number },
        costPerInteract: { type: Number },
        costDivideRevenue: { type: Number },
    },
    {
        collection: 'adset_insights',
        timestamps: true,
    }
)

// Unique compound index to prevent duplicates: one aggregated record per adset
AdSetInsightDataSchema.index({ adAccountId: 1, adsetId: 1 }, { unique: true })

// Index for querying insights by adset (used in suggestion analysis)
AdSetInsightDataSchema.index({ adsetId: 1 })

export const AdSetInsightDataModel = model<IAdSetInsightDataDocument>('AdSetInsightData', AdSetInsightDataSchema)
