/**
 * MongoDB Schema: FacebookConnection
 * Defines the database schema for Facebook OAuth connections
 */

import { Schema, model, Document } from 'mongoose'
import { ConnectionStatus } from '../../domain/Connection'
import { FacebookAdAccount } from '../../domain/IFacebookClient'

export interface IFacebookConnectionDocument extends Document {
    fbUserId: string
    accessToken: string
    scopes: string[]
    status: ConnectionStatus
    connectedAt: Date
    expiresAt: Date
    lastErrorCode?: string
    adAccounts?: FacebookAdAccount[]
    createdAt: Date
    updatedAt: Date
}

const FacebookConnectionSchema = new Schema<IFacebookConnectionDocument>(
    {
        fbUserId: {
            type: String,
            required: true,
            index: true,
            unique: true,
        },
        accessToken: {
            type: String,
            required: true,
        },
        scopes: {
            type: [String],
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ConnectionStatus),
            default: ConnectionStatus.CONNECTED,
        },
        connectedAt: {
            type: Date,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        lastErrorCode: {
            type: String,
        },
        adAccounts: {
            type: [
                {
                    _id: false, // Prevent auto-generation of _id
                    name: { type: String, required: true },
                    status: { type: Number, required: true },
                    currency: { type: String, required: true },
                    timezone: { type: String, required: true },
                    spendCap: { type: String },
                    adAccountId: { type: String, required: true },
                    isActive: { type: Boolean, default: false },
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
        collection: 'facebook_connections',
    }
)

// Index for finding expiring tokens
FacebookConnectionSchema.index({ expiresAt: 1, status: 1 })

export const FacebookConnectionModel = model<IFacebookConnectionDocument>(
    'FacebookConnection',
    FacebookConnectionSchema
)
