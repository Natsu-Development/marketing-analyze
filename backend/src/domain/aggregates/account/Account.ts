/**
 * Entity: Account
 * Represents a Facebook Marketing account as an aggregate root
 * Manages OAuth state, ad accounts, and business rules for account operations
 * Implemented using functional programming style following DDD principles
 */

import { AdAccount } from '../../value-objects/AdAccount'

export enum AccountStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    NEEDS_RECONNECT = 'needs_reconnect'
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
    readonly adAccounts: readonly AdAccount[]
    readonly createdAt: Date
    readonly updatedAt: Date
}

// Pure functions that operate on the Account data

/**
 * Create a new Account
 */
export function createAccount(props: {
    accountId: string
    accessToken: string
    scopes: readonly string[]
    expiresAt: Date
    adAccounts?: readonly AdAccount[]
    status?: AccountStatus
}): Account {
    const now = new Date()
    return {
        accountId: props.accountId,
        accessToken: props.accessToken,
        scopes: [...props.scopes], // Ensure immutability
        expiresAt: props.expiresAt,
        adAccounts: props.adAccounts || [],
        status: props.status || AccountStatus.CONNECTED,
        connectedAt: now,
        createdAt: now,
        updatedAt: now,
    }
}

/**
 * Create Account from persistence data
 */
export function createAccountFromPersistence(props: {
    id?: string
    accountId: string
    accessToken: string
    scopes: readonly string[]
    status: AccountStatus
    connectedAt: Date
    expiresAt: Date
    lastErrorCode?: string
    lastSyncAt?: Date
    adAccounts: readonly AdAccount[]
    createdAt: Date
    updatedAt: Date
}): Account {
    return {
        ...props,
        scopes: [...props.scopes], // Ensure immutability
        adAccounts: [...props.adAccounts], // Ensure immutability
    }
}

/**
 * Check if account token is expired
 */
export function isAccountExpired(account: Account): boolean {
    return account.expiresAt <= new Date()
}

/**
 * Check if account token is expiring soon (default: within 5 minutes)
 */
export function isAccountExpiringSoon(account: Account, windowMinutes: number = 5): boolean {
    const windowMs = windowMinutes * 60 * 1000
    const now = Date.now()
    return account.expiresAt.getTime() - now <= windowMs && !isAccountExpired(account)
}

/**
 * Check if account needs token refresh (default: within 15 minutes)
 */
export function doesAccountNeedRefresh(account: Account, windowMinutes: number = 15): boolean {
    const windowMs = windowMinutes * 60 * 1000
    const now = Date.now()
    return account.expiresAt.getTime() - now <= windowMs && !isAccountExpired(account)
}

/**
 * Check if account can export data
 */
export function canAccountExport(account: Account): {
    canExport: boolean
    reason: string
    timeRange: { since: string; until: string }
} {
    if (account.status !== AccountStatus.CONNECTED) {
        return {
            canExport: false,
            reason: `Account status is ${account.status}`,
            timeRange: { since: '', until: '' }
        }
    }

    if (isAccountExpired(account)) {
        return {
            canExport: false,
            reason: 'Access token is expired',
            timeRange: { since: '', until: '' }
        }
    }

    if (account.adAccounts.length === 0) {
        return {
            canExport: false,
            reason: 'No ad accounts available',
            timeRange: { since: '', until: '' }
        }
    }

    const timeRange = getAccountExportTimeRange(account)
    return {
        canExport: true,
        reason: '',
        timeRange
    }
}

/**
 * Check if account has an active ad account
 */
export function hasActiveAdAccount(account: Account, adAccountId: string): boolean {
    return account.adAccounts.some(adAccount =>
        adAccount.adAccountId === adAccountId && adAccount.isActive
    )
}

/**
 * Get active ad accounts
 */
export function getActiveAdAccounts(account: Account): readonly AdAccount[] {
    return account.adAccounts.filter(adAccount => adAccount.isActive)
}

/**
 * Get default sync time range (last 90 days)
 */
export function getDefaultSyncTimeRange(): { since: Date; until: Date } {
    const until = new Date()
    const since = new Date(until)
    since.setDate(since.getDate() - 90) // Last 90 days

    return { since, until }
}

/**
 * Get export time range (last 89 days to avoid timezone issues)
 */
export function getAccountExportTimeRange(_account: Account): { since: string; until: string } {
    const { since, until } = getDefaultSyncTimeRange()

    // Return as ISO strings for API compatibility
    return {
        since: since.toISOString().split('T')[0], // YYYY-MM-DD format
        until: until.toISOString().split('T')[0]
    }
}

/**
 * Update account tokens
 */
export function updateAccountTokens(account: Account, accessToken: string, expiresAt: Date): Account {
    return {
        ...account,
        accessToken,
        expiresAt,
        updatedAt: new Date(),
    }
}

/**
 * Update account ad accounts
 */
export function updateAccountAdAccounts(account: Account, adAccounts: readonly AdAccount[]): Account {
    return {
        ...account,
        adAccounts: [...adAccounts], // Ensure immutability
        updatedAt: new Date(),
    }
}

/**
 * Set ad account active status
 */
export function setAdAccountActive(account: Account, adAccountId: string, isActive: boolean): Account {
    const updatedAdAccounts = account.adAccounts.map(adAccount =>
        adAccount.adAccountId === adAccountId
            ? { ...adAccount, isActive }
            : adAccount
    )

    return {
        ...account,
        adAccounts: updatedAdAccounts,
        updatedAt: new Date(),
    }
}

/**
 * Mark account as needing reconnection
 */
export function markAccountAsNeedsReconnect(account: Account, errorCode: string): Account {
    return {
        ...account,
        status: AccountStatus.NEEDS_RECONNECT,
        lastErrorCode: errorCode,
        updatedAt: new Date(),
    }
}

/**
 * Disconnect account
 */
export function disconnectAccount(account: Account): Account {
    return {
        ...account,
        status: AccountStatus.DISCONNECTED,
        updatedAt: new Date(),
    }
}

/**
 * Update last sync timestamp
 */
export function updateAccountLastSync(account: Account): Account {
    return {
        ...account,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
    }
}

/**
 * Get account health status
 */
export function getAccountHealthStatus(account: Account): 'healthy' | 'warning' | 'critical' {
    if (isAccountExpired(account) || account.status === AccountStatus.NEEDS_RECONNECT) {
        return 'critical'
    }

    if (doesAccountNeedRefresh(account) || isAccountExpiringSoon(account)) {
        return 'warning'
    }

    return 'healthy'
}

/**
 * Convert account to JSON (for API responses)
 */
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
        adAccounts: account.adAccounts.map(adAccount => ({
            name: adAccount.name,
            status: adAccount.status,
            currency: adAccount.currency,
            timezone: adAccount.timezone,
            spendCap: adAccount.spendCap,
            adAccountId: adAccount.adAccountId,
            isActive: adAccount.isActive,
        })),
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
    }
}

/**
 * Account Domain - Grouped collection of all Account-related functions
 * Following DDD principles with functional programming style
 */
export const AccountDomain = {
    createAccount,
    createAccountFromPersistence,
    isAccountExpired,
    isAccountExpiringSoon,
    doesAccountNeedRefresh,
    canAccountExport,
    hasActiveAdAccount,
    getActiveAdAccounts,
    getDefaultSyncTimeRange,
    getAccountExportTimeRange,
    updateAccountTokens,
    updateAccountAdAccounts,
    setAdAccountActive,
    markAccountAsNeedsReconnect,
    disconnectAccount,
    updateAccountLastSync,
    getAccountHealthStatus,
    accountToJSON,
}
