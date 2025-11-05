/**
 * MongoDB Schema: AdSet
 * Defines the database schema for Facebook Ad Set metadata
 */

import { Schema, model, Document } from 'mongoose'

export interface IAdSetDocument extends Document {
    accountId: string
    adAccountId: string
    adsetId: string
    adsetName: string
    campaignId: string
    campaignName: string
    status: string
    currency: string
    dailyBudget?: number
    lifetimeBudget?: number
    startTime?: Date
    endTime?: Date
    updatedTime: Date
    syncedAt: Date
}

const AdSetSchemaInstance = new Schema<IAdSetDocument>(
    {
        accountId: {
            type: String,
            required: true,
        },
        adAccountId: {
            type: String,
            required: true,
        },
        adsetId: {
            type: String,
            required: true,
        },
        adsetName: {
            type: String,
            required: true,
        },
        campaignId: {
            type: String,
            required: true,
        },
        campaignName: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'UNKNOWN'],
        },
        currency: {
            type: String,
            required: true,
        },
        dailyBudget: {
            type: Number,
        },
        lifetimeBudget: {
            type: Number,
        },
        startTime: {
            type: Date,
        },
        endTime: {
            type: Date,
        },
        updatedTime: {
            type: Date,
            required: true,
        },
        syncedAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: false,
        collection: 'adsets',
    }
)

// Compound unique index to prevent duplicates
AdSetSchemaInstance.index({ adAccountId: 1, adsetId: 1 }, { unique: true })

// Indexes for common queries
AdSetSchemaInstance.index({ accountId: 1 })
AdSetSchemaInstance.index({ status: 1 })
AdSetSchemaInstance.index({ campaignId: 1 })
AdSetSchemaInstance.index({ syncedAt: 1 })

export const AdSetSchema = model<IAdSetDocument>('AdSet', AdSetSchemaInstance)
