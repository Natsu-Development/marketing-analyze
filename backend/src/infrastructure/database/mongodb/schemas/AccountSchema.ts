/**
 * MongoDB Schema: Account (Facebook OAuth)
 * Defines the database schema for Facebook OAuth account connections
 */

import { Schema, model, Document } from 'mongoose'
import { AccountStatus } from '../../../../domain/aggregates/account'
import { AdAccount } from '../../../../domain/value-objects/AdAccount'

export interface IAccountDocument extends Document {
    accountId: string
    accessToken: string
    scopes: string[]
    status: AccountStatus
    connectedAt: Date
    expiresAt: Date
    lastErrorCode?: string
    lastSyncAt?: Date
    adAccounts?: AdAccount[]
    createdAt: Date
    updatedAt: Date
}

const AccountSchemaInstance = new Schema<IAccountDocument>(
    {
        accountId: {
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
            enum: Object.values(AccountStatus),
            default: AccountStatus.CONNECTED,
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
        lastSyncAt: {
            type: Date,
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
                    lastSyncAdSet: { type: Date },
                    lastSyncInsight: { type: Date },
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
        collection: 'accounts',
    }
)

// Index for finding expiring tokens
AccountSchemaInstance.index({ expiresAt: 1, status: 1 })

// Indexes for sync eligibility queries
AccountSchemaInstance.index({ 'adAccounts.lastSyncInsight': 1, 'adAccounts.isActive': 1 })

export const AccountSchema = model<IAccountDocument>('Account', AccountSchemaInstance)
