/**
 * Entity: Account
 * Represents Facebook OAuth account connection
 */

import { FacebookAdAccount } from '../types/FacebookAdAccount'

export enum AccountStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    NEEDS_RECONNECT = 'needs_reconnect',
}

export interface Account {
    readonly id?: string
    readonly accountId: string
    readonly accessToken: string
    readonly scopes: readonly string[]
    readonly status: AccountStatus
    readonly connectedAt: Date
    readonly expiresAt: Date
    readonly lastErrorCode?: string
    readonly lastSyncAt?: Date
    readonly adAccounts?: readonly FacebookAdAccount[]
    readonly createdAt: Date
    readonly updatedAt: Date
}

// Pure functions that operate on the data

// Create a new account
export function createAccount(
    props: Partial<Account> & Pick<Account, 'accountId' | 'accessToken' | 'scopes' | 'expiresAt'>
): Account {
    const now = new Date()
    return {
        ...props,
        status: props.status || AccountStatus.CONNECTED,
        connectedAt: props.connectedAt || now,
        createdAt: props.createdAt || now,
        updatedAt: props.updatedAt || now,
        scopes: [...props.scopes],
        adAccounts: props.adAccounts ? [...props.adAccounts] : [],
    }
}

// Check if account is expired
export function isAccountExpired(account: Account): boolean {
    return new Date() >= account.expiresAt
}

// Check if account is expiring soon
export function isAccountExpiringSoon(account: Account, windowMinutes = 5): boolean {
    const threshold = new Date(Date.now() + windowMinutes * 60 * 1000)
    return account.expiresAt <= threshold
}

// Check if needs refresh
export function doesAccountNeedRefresh(account: Account, windowMinutes = 5): boolean {
    return !isAccountExpired(account) && isAccountExpiringSoon(account, windowMinutes)
}

// Update tokens - returns new account object
export function updateAccountTokens(account: Account, accessToken: string, expiresAt: Date): Account {
    return {
        ...account,
        accessToken,
        expiresAt,
        status: AccountStatus.CONNECTED,
        lastErrorCode: undefined,
        updatedAt: new Date(),
    }
}

// Update ad accounts - returns new account object
export function updateAccountAdAccounts(account: Account, adAccounts: FacebookAdAccount[]): Account {
    return {
        ...account,
        adAccounts: [...adAccounts],
        updatedAt: new Date(),
    }
}

// Set ad account active status - returns new account object
export function setAdAccountActiveStatus(account: Account, adAccountId: string, isActive: boolean): Account {
    const updatedAdAccounts = (account.adAccounts || []).map((acc) =>
        acc.adAccountId === adAccountId ? { ...acc, isActive } : acc
    )

    return {
        ...account,
        adAccounts: updatedAdAccounts,
        updatedAt: new Date(),
    }
}

// Check if ad account is active
export function isAdAccountActive(account: Account, adAccountId: string): boolean {
    const acc = (account.adAccounts || []).find((acc) => acc.adAccountId === adAccountId)
    return acc?.isActive === true
}

// Get active ad accounts
export function getActiveAdAccounts(account: Account): readonly FacebookAdAccount[] {
    return (account.adAccounts || []).filter((acc) => acc.isActive === true)
}

// Mark as needs reconnect - returns new account object
export function markAccountAsNeedsReconnect(account: Account, errorCode: string): Account {
    return {
        ...account,
        status: AccountStatus.NEEDS_RECONNECT,
        lastErrorCode: errorCode,
        updatedAt: new Date(),
    }
}

// Disconnect - returns new account object
export function disconnectAccount(account: Account): Account {
    return {
        ...account,
        status: AccountStatus.DISCONNECTED,
        updatedAt: new Date(),
    }
}

// Update last sync time - returns new account object
export function updateAccountLastSyncAt(account: Account): Account {
    return {
        ...account,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
    }
}

// Get time range for sync based on lastSyncAt
export function getAccountSyncTimeRange(account: Account): { since: Date; until: Date } {
    const until = new Date()
    let since: Date

    if (account.lastSyncAt) {
        since = new Date(account.lastSyncAt)
    } else {
        since = new Date()
        since.setDate(since.getDate() - 90)
    }

    return { since, until }
}

// Convert to JSON (for API responses)
export function accountToJSON(account: Account) {
    return {
        id: account.id,
        accountId: account.accountId,
        scopes: account.scopes,
        status: account.status,
        connectedAt: account.connectedAt,
        expiresAt: account.expiresAt,
        lastErrorCode: account.lastErrorCode,
        lastSyncAt: account.lastSyncAt,
        adAccounts: account.adAccounts,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
    }
}

/**
 * Account Domain - Grouped collection of all Account-related functions
 * Provides a clean, organized namespace for all Account operations
 */
export const AccountDomain = {
    createAccount,
    isAccountExpired,
    isAccountExpiringSoon,
    doesAccountNeedRefresh,
    updateAccountTokens,
    updateAccountAdAccounts,
    setAdAccountActiveStatus,
    isAdAccountActive,
    getActiveAdAccounts,
    markAccountAsNeedsReconnect,
    disconnectAccount,
    updateAccountLastSyncAt,
    getAccountSyncTimeRange,
    accountToJSON,
}
