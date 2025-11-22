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
    type: 'adset' | 'campaign'
    accountId: string
    adAccountId: string
    adAccountName: string
    campaignId?: string  // For campaign suggestions
    campaignName: string
    adsetId: string
    adsetName: string
    adsetLink: string
    currency: string
    budget: number
    budgetAfterScale: number
    scalePercent?: number
    note?: string
    metrics: IExceedingMetricDocument[]
    metricsExceededCount: number
    status: 'pending' | 'approved' | 'rejected'
    recentScaleAt?: Date | null
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
                'cpm',
                'ctr',
                'frequency',
                'inlineLinkCtr',
                'costPerInlineLinkClick',
                'purchaseRoas',
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
        type: {
            type: String,
            required: true,
            enum: ['adset', 'campaign'],
            default: 'adset',
        },
        accountId: {
            type: String,
            required: true,
        },
        adAccountId: {
            type: String,
            required: true,
        },
        adAccountName: {
            type: String,
            required: true,
        },
        campaignId: {
            type: String,
            required: false,
        },
        campaignName: {
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
        adsetLink: {
            type: String,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        },
        budget: {
            type: Number,
            required: true,
            min: 0,
        },
        budgetAfterScale: {
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
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        recentScaleAt: {
            type: Date,
            required: false,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'suggestions',
    }
)

// Composite unique index to prevent duplicate suggestions (one per adset per timestamp)
SuggestionSchemaInstance.index({ adAccountId: 1, adsetId: 1, createdAt: 1 }, { unique: true })

// Optimized indexes following KISS principle
// Status-only queries (most common)
SuggestionSchemaInstance.index({ status: 1 })

// Compound index for adset + status historical queries
// This index also covers adsetId-only queries via prefix matching
SuggestionSchemaInstance.index({ adsetId: 1, status: 1, createdAt: -1 })

// Campaign suggestion indexes
// Compound index for campaign + status historical queries
SuggestionSchemaInstance.index({ campaignId: 1, status: 1, createdAt: -1 })

// Type + status index for filtering suggestions by type
SuggestionSchemaInstance.index({ type: 1, status: 1 })

export const SuggestionSchema = model<ISuggestionDocument>('Suggestion', SuggestionSchemaInstance)
