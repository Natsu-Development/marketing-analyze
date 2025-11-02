/**
 * MongoDB Schema: MetricConfig
 * Defines the database schema for metric configuration storage per ad account
 */

import { Schema, model, Document } from 'mongoose'

export interface IMetricConfigDocument extends Document {
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
    createdAt: Date
    updatedAt: Date
}

const MetricConfigSchemaInstance = new Schema<IMetricConfigDocument>(
    {
        adAccountId: {
            type: String,
            required: true,
            unique: true,
            index: true,
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
    },
    {
        timestamps: true,
        collection: 'metric_configs',
    }
)

// Unique index on adAccountId to ensure one configuration per ad account
MetricConfigSchemaInstance.index({ adAccountId: 1 }, { unique: true })

export const MetricConfigSchema = model<IMetricConfigDocument>('MetricConfig', MetricConfigSchemaInstance)
