/**
 * MongoDB Schema: Suggestion
 * Defines the database schema for adset performance suggestions storage
 * Stores only metrics that exceeded thresholds with their calculated values
 */

import { Schema, model, Document } from 'mongoose'

/**
 * Exceeding metric subdocument interface
 */
export interface IExceedingMetricDocument {
    metricName: string
    value: number
}

/**
 * Suggestion document interface
 */
export interface ISuggestionDocument extends Document {
    accountId: string
    adAccountId: string
    adAccountName: string
    campaignName: string
    adsetId: string
    adsetName: string
    adsetLink: string
    dailyBudget: number
    budgetScaled: number
    scalePercent?: number
    note?: string
    metrics: IExceedingMetricDocument[]
    metricsExceededCount: number
    status: 'pending' | 'rejected' | 'applied'
    createdAt: Date
    updatedAt: Date
}

/**
 * Exceeding metric subdocument schema
 */
const ExceedingMetricSchema = new Schema<IExceedingMetricDocument>(
    {
        metricName: {
            type: String,
            required: true,
            enum: [
                'impressions',
                'clicks',
                'spend',
                'cpm',
                'cpc',
                'ctr',
                'reach',
                'frequency',
                'linkCtr',
                'costPerInlineLinkClick',
                'costPerResult',
                'roas',
            ],
        },
        value: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
)

/**
 * Suggestion schema definition
 */
const SuggestionSchemaInstance = new Schema<ISuggestionDocument>(
    {
        accountId: {
            type: String,
            required: true,
            index: true,
        },
        adAccountId: {
            type: String,
            required: true,
            index: true,
        },
        adAccountName: {
            type: String,
            required: true,
        },
        campaignName: {
            type: String,
            required: true,
        },
        adsetId: {
            type: String,
            required: true,
            index: true,
        },
        adsetName: {
            type: String,
            required: true,
        },
        adsetLink: {
            type: String,
            required: true,
        },
        dailyBudget: {
            type: Number,
            required: true,
            min: 0,
        },
        budgetScaled: {
            type: Number,
            required: true,
            min: 0,
        },
        scalePercent: {
            type: Number,
        },
        note: {
            type: String,
        },
        metrics: {
            type: [ExceedingMetricSchema],
            required: true,
            validate: {
                validator: function (v: IExceedingMetricDocument[]) {
                    return v.length > 0
                },
                message: 'Metrics array must contain at least one exceeding metric',
            },
        },
        metricsExceededCount: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'rejected', 'applied'],
            default: 'pending',
            index: true,
        },
    },
    {
        timestamps: true,
        collection: 'suggestions',
    }
)

/**
 * Composite unique index on (adAccountId, adsetId, createdAt) to prevent duplicate suggestions
 * Allows for multiple suggestions for the same adset over time
 */
SuggestionSchemaInstance.index({ adAccountId: 1, adsetId: 1, createdAt: 1 }, { unique: true })

/**
 * Index for querying pending suggestions
 */
SuggestionSchemaInstance.index({ status: 1 })

/**
 * Index for querying suggestions by ad account
 */
SuggestionSchemaInstance.index({ adAccountId: 1 })

export const SuggestionSchema = model<ISuggestionDocument>('Suggestion', SuggestionSchemaInstance)
