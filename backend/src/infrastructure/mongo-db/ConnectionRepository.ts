/**
 * Simplified Repository Implementation
 * Uses plain functional approach instead of factory pattern
 */

import { IFacebookConnectionRepository } from '../../domain/IConnectionRepository'
import { FacebookConnection, validateFacebookConnection } from '../../domain/Connection'
import { FacebookConnectionModel } from './ConnectionSchema'

// Convert Mongoose document to plain domain object
const toDomain = (doc: any): FacebookConnection => {
    // Convert Mongoose document to plain object to avoid document pollution
    const plainDoc = doc.toObject ? doc.toObject() : doc

    return {
        id: plainDoc._id.toString(),
        fbUserId: plainDoc.fbUserId,
        accessToken: plainDoc.accessToken,
        scopes: [...(plainDoc.scopes || [])],
        status: plainDoc.status,
        connectedAt: plainDoc.connectedAt,
        expiresAt: plainDoc.expiresAt,
        lastErrorCode: plainDoc.lastErrorCode,
        // Convert subdocuments to plain objects
        adAccounts: (plainDoc.adAccounts || []).map((account: any) => ({
            name: account.name,
            status: account.status,
            currency: account.currency,
            timezone: account.timezone,
            spendCap: account.spendCap,
            adAccountId: account.adAccountId,
            isActive: account.isActive || false,
        })),
        createdAt: plainDoc.createdAt,
        updatedAt: plainDoc.updatedAt,
    }
}

// Convert domain object to database format
const fromDomain = (connection: FacebookConnection) => ({
    fbUserId: connection.fbUserId,
    accessToken: connection.accessToken,
    scopes: connection.scopes,
    status: connection.status,
    connectedAt: connection.connectedAt,
    expiresAt: connection.expiresAt,
    lastErrorCode: connection.lastErrorCode,
    adAccounts: connection.adAccounts || [],
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
})

const save = async (connection: FacebookConnection): Promise<FacebookConnection> => {
    validateFacebookConnection(connection)

    const doc = fromDomain(connection)
    const result = await FacebookConnectionModel.findOneAndUpdate({ fbUserId: connection.fbUserId }, doc, {
        upsert: true,
        new: true,
        runValidators: true,
    })

    return toDomain(result)
}

const findById = async (id: string): Promise<FacebookConnection | null> => {
    const doc = await FacebookConnectionModel.findById(id)
    return doc ? toDomain(doc) : null
}

const findByFbUserId = async (fbUserId: string): Promise<FacebookConnection | null> => {
    const doc = await FacebookConnectionModel.findOne({ fbUserId })
    return doc ? toDomain(doc) : null
}

const deleteByFbUserId = async (fbUserId: string): Promise<void> => {
    await FacebookConnectionModel.deleteOne({ fbUserId })
}

export const facebookConnectionRepository: IFacebookConnectionRepository = {
    save,
    findByFbUserId,
    deleteByFbUserId,
    findById,
}
