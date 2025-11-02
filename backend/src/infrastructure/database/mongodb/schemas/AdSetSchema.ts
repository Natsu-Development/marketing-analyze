/**
 * MongoDB Schema: AdSet
 * Defines the database schema for Facebook Ad Set metadata
 */

import { Schema, model, Document } from 'mongoose'

export interface IAdSetDocument extends Document {
    adAccountId: string
    adsetId: string
    adsetName: string
    campaignId: string
    campaignName: string
    status: string
    dailyBudget?: number
    lifetimeBudget?: number
    startTime?: Date
    endTime?: Date
    updatedTime: Date
    syncedAt: Date
}

const AdSetSchemaInstance = new Schema<IAdSetDocument>(
    {
        adAccountId: {
            type: String,
            required: true,
            index: true,
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
            index: true,
        },
        campaignName: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'UNKNOWN'],
            index: true,
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
            index: true,
        },
    },
    {
        timestamps: false,
        collection: 'adsets',
    }
)

// Compound unique index to prevent duplicates
AdSetSchemaInstance.index({ adAccountId: 1, adsetId: 1 }, { unique: true })

export const AdSetSchema = model<IAdSetDocument>('AdSet', AdSetSchemaInstance)
