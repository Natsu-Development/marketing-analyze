/**
 * MongoDB Schema: Export Result
 * Stores ad insights export results
 */

import { Schema, model, Document } from 'mongoose'

export interface IExportResultDocument extends Document {
    adAccountId: string
    reportRunId: string
    fileUrl: string
    recordCount: number
    timeRange: {
        since: string
        until: string
    }
    status: 'pending' | 'completed' | 'failed'
    error?: string
    completedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const ExportResultSchema = new Schema<IExportResultDocument>(
    {
        adAccountId: {
            type: String,
            required: true,
        },
        reportRunId: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        recordCount: {
            type: Number,
            required: true,
        },
        timeRange: {
            since: { type: String, required: true },
            until: { type: String, required: true },
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        error: {
            type: String,
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        collection: 'export_results',
    }
)

// Unique index on reportRunId
ExportResultSchema.index({ reportRunId: 1 }, { unique: true })

// Compound index for finding latest exports per ad account
ExportResultSchema.index({ adAccountId: 1, createdAt: -1 })

export const ExportResultModel = model<IExportResultDocument>('ExportResult', ExportResultSchema)
