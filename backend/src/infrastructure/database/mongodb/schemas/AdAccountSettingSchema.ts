/**
 * MongoDB Schema: AdAccountSetting
 * Defines the database schema for ad account settings including metric thresholds
 */

import { Schema, model, Document } from 'mongoose'

export interface IAdAccountSettingDocument extends Document {
    adAccountId: string
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
    scalePercent?: number
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
        impressions: {
            type: Number,
        },
        clicks: {
            type: Number,
        },
        spend: {
            type: Number,
        },
        cpm: {
            type: Number,
        },
        cpc: {
            type: Number,
        },
        ctr: {
            type: Number,
        },
        reach: {
            type: Number,
        },
        frequency: {
            type: Number,
        },
        linkCtr: {
            type: Number,
        },
        costPerInlineLinkClick: {
            type: Number,
        },
        costPerResult: {
            type: Number,
        },
        roas: {
            type: Number,
        },
        scalePercent: {
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
