/**
 * Repository Implementation: AccountRepository
 * Uses plain functional approach instead of factory pattern
 */

import { IAccountRepository, Account } from '../../../../domain'
import { AccountSchema } from '../schemas/AccountSchema'

// Convert Mongoose document to plain domain object
const toDomain = (doc: any): Account => {
    // Convert Mongoose document to plain object to avoid document pollution
    const plainDoc = doc.toObject ? doc.toObject() : doc

    return {
        id: plainDoc._id.toString(),
        accountId: plainDoc.accountId,
        accessToken: plainDoc.accessToken,
        scopes: [...(plainDoc.scopes || [])],
        status: plainDoc.status,
        connectedAt: plainDoc.connectedAt,
        expiresAt: plainDoc.expiresAt,
        lastErrorCode: plainDoc.lastErrorCode,
        lastSyncAt: plainDoc.lastSyncAt,
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
const fromDomain = (account: Account) => ({
    accountId: account.accountId,
    accessToken: account.accessToken,
    scopes: account.scopes,
    status: account.status,
    connectedAt: account.connectedAt,
    expiresAt: account.expiresAt,
    lastErrorCode: account.lastErrorCode,
    lastSyncAt: account.lastSyncAt,
    adAccounts: account.adAccounts || [],
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
})

const save = async (account: Account): Promise<Account> => {
    const doc = fromDomain(account)
    const result = await AccountSchema.findOneAndUpdate({ accountId: account.accountId }, doc, {
        upsert: true,
        new: true,
        runValidators: true,
    })

    return toDomain(result)
}

const findById = async (id: string): Promise<Account | null> => {
    const doc = await AccountSchema.findById(id)
    return doc ? toDomain(doc) : null
}

const findByAccountId = async (accountId: string): Promise<Account | null> => {
    const doc = await AccountSchema.findOne({ accountId })
    return doc ? toDomain(doc) : null
}

const findAllConnected = async (): Promise<Account[]> => {
    const docs = await AccountSchema.find({ status: 'connected' })
    return docs.map(toDomain)
}

const deleteByAccountId = async (accountId: string): Promise<void> => {
    await AccountSchema.deleteOne({ accountId })
}

export const accountRepository: IAccountRepository = {
    save,
    findByAccountId,
    findAllConnected,
    deleteByAccountId,
    findById,
}
