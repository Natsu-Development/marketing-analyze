/**
 * MongoDB Schema: Campaign
 * Defines the database schema for Facebook Campaign metadata
 */

import { Schema, model, Document } from 'mongoose'

export interface ICampaignDocument extends Document {
    accountId: string
    adAccountId: string
    campaignId: string
    campaignName: string
    status: string
    dailyBudget?: number
    lifetimeBudget?: number
    currency: string
    startTime?: Date
    endTime?: Date
    lastScaledAt?: Date | null
    syncedAt: Date
}

const CampaignSchemaInstance = new Schema<ICampaignDocument>(
    {
        accountId: { type: String, required: true },
        adAccountId: { type: String, required: true },
        campaignId: { type: String, required: true },
        campaignName: { type: String, required: true },
        status: {
            type: String,
            required: true,
            enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'UNKNOWN'],
        },
        dailyBudget: { type: Number },
        lifetimeBudget: { type: Number },
        currency: { type: String, required: true },
        startTime: { type: Date },
        endTime: { type: Date },
        lastScaledAt: { type: Date, default: null },
        syncedAt: { type: Date, required: true },
    },
    {
        timestamps: false,
        collection: 'campaigns',
    }
)

// Unique composite index
CampaignSchemaInstance.index({ adAccountId: 1, campaignId: 1 }, { unique: true })

// Query indexes
CampaignSchemaInstance.index({ status: 1, dailyBudget: 1 })
CampaignSchemaInstance.index({ lastScaledAt: -1 })
CampaignSchemaInstance.index({ accountId: 1 })

export const CampaignSchema = model<ICampaignDocument>('Campaign', CampaignSchemaInstance)
