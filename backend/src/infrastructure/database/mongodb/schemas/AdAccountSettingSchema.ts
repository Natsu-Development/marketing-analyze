/**
 * MongoDB Schema: AdAccountSetting
 * Defines the database schema for ad account settings including metric thresholds
 */

import { Schema, model, Document } from 'mongoose'

export interface IAdAccountSettingDocument extends Document {
    adAccountId: string
    cpm?: number
    ctr?: number
    frequency?: number
    inlineLinkCtr?: number
    costPerInlineLinkClick?: number
    purchaseRoas?: number
    purchases?: number
    costPerPurchase?: number
    scalePercent?: number
    initScaleDay?: number
    note?: string
    createdAt: Date
    updatedAt: Date
}

const AdAccountSettingSchemaInstance = new Schema<IAdAccountSettingDocument>(
    {
        adAccountId: {
            type: String,
            required: true,
        },
        cpm: {
            type: Number,
        },
        ctr: {
            type: Number,
        },
        frequency: {
            type: Number,
        },
        inlineLinkCtr: {
            type: Number,
        },
        costPerInlineLinkClick: {
            type: Number,
        },
        purchaseRoas: {
            type: Number,
        },
        purchases: {
            type: Number,
        },
        costPerPurchase: {
            type: Number,
        },
        scalePercent: {
            type: Number,
        },
        initScaleDay: {
            type: Number,
        },
        note: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'ad_account_settings',
    }
)

// Unique index on adAccountId to ensure one configuration per ad account
AdAccountSettingSchemaInstance.index({ adAccountId: 1 }, { unique: true })

export const AdAccountSettingSchema = model<IAdAccountSettingDocument>('AdAccountSetting', AdAccountSettingSchemaInstance)
