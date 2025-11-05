/**
 * Entity: Account
 * Represents a Facebook Marketing account as an aggregate root
 * Manages OAuth state, ad accounts, and business rules for account operations
 * Implemented using functional programming style following DDD principles
 */

import { AdAccount, updateAdAccountLastSyncAdSet, updateAdAccountLastSyncInsight } from '../../value-objects/AdAccount'
import { AdInsightsTimeRange } from '../../value-objects/TimeRange'

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
 * Check if account token is expired
 */
export function isAccountExpired(account: Account): boolean {
    return account.expiresAt <= new Date()
}

/**
 * Check if account can export data
 */
export function canAccountExport(account: Account): {
    canExport: boolean
    reason: string
} {
    if (account.status !== AccountStatus.CONNECTED) {
        return {
            canExport: false,
            reason: `Account status is ${account.status}`,
        }
    }

    if (isAccountExpired(account)) {
        return {
            canExport: false,
            reason: 'Access token is expired',
        }
    }

    if (account.adAccounts.length === 0) {
        return {
            canExport: false,
            reason: 'No ad accounts available',
        }
    }

    return {
        canExport: true,
        reason: '',
    }
}

/**
 * Get active ad accounts
 */
export function getActiveAdAccounts(account: Account): readonly AdAccount[] {
    return account.adAccounts.filter(adAccount => adAccount.isActive)
}

/**
 * Update account ad accounts
 */
export function updateAdAccounts(account: Account, adAccounts: readonly AdAccount[]): Account {
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
 * Update lastSyncAdSet for specific ad account by ID
 */
export function updateAdAccountSyncAdSet(account: Account, adAccountId: string, timestamp: Date): Account {
    const updatedAdAccounts = account.adAccounts.map(adAccount =>
        adAccount.adAccountId === adAccountId
            ? updateAdAccountLastSyncAdSet(adAccount, timestamp)
            : adAccount
    )

    return {
        ...account,
        adAccounts: updatedAdAccounts,
        updatedAt: new Date(),
    }
}

/**
 * Update lastSyncInsight for specific ad account by ID
 */
export function updateAdAccountSyncInsight(account: Account, adAccountId: string, timestamp: Date): Account {
    const updatedAdAccounts = account.adAccounts.map(adAccount =>
        adAccount.adAccountId === adAccountId
            ? updateAdAccountLastSyncInsight(adAccount, timestamp)
            : adAccount
    )

    return {
        ...account,
        adAccounts: updatedAdAccounts,
        updatedAt: new Date(),
    }
}

/**
 * Find ad account by ID
 * Returns the ad account if found, undefined otherwise
 */
export function findAdAccount(account: Account, adAccountId: string): AdAccount | undefined {
    return account.adAccounts.find(aa => aa.adAccountId === adAccountId)
}

/**
 * Get ad account currency
 * Returns the currency code for the specified ad account
 * Throws error if ad account not found
 */
export function getAdAccountCurrency(account: Account, adAccountId: string): string {
    const adAccount = findAdAccount(account, adAccountId)
    if (!adAccount) {
        throw new Error(`Ad account ${adAccountId} not found in account ${account.accountId}`)
    }
    return adAccount.currency
}

/**
 * Validate export time range
 * Domain logic: business rules for valid time ranges
 */
export function validateTimeRange(timeRange: AdInsightsTimeRange): {
    valid: boolean
    errors: string[]
} {
    const errors: string[] = []

    const sinceDate = new Date(timeRange.since)
    const untilDate = new Date(timeRange.until)

    if (isNaN(sinceDate.getTime())) {
        errors.push('Invalid since date format')
    }

    if (isNaN(untilDate.getTime())) {
        errors.push('Invalid until date format')
    }

    if (sinceDate > untilDate) {
        errors.push('Since date must be before until date')
    }

    // Check maximum range (business rule: max 90 days)
    const maxRangeMs = 90 * 24 * 60 * 60 * 1000 // 90 days
    if (untilDate.getTime() - sinceDate.getTime() > maxRangeMs) {
        errors.push('Time range cannot exceed 90 days')
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Calculate insights sync time range for specific ad account
 * Returns two-tier fallback: per-account lastSyncInsight → 90 days default
 */
export function getAdAccountInsightSyncTimeRange(account: Account, adAccountId: string): { since: string; until: string } {
    const adAccount = findAdAccount(account, adAccountId)
    const until = new Date()
    let since: Date

    if (adAccount?.lastSyncInsight) {
        // Use per-account insight sync timestamp
        since = new Date(adAccount.lastSyncInsight)
    } else {
        // Default to 90 days for initial sync
        since = new Date(until)
        since.setDate(since.getDate() - 90)
    }

    return {
        since: since.toISOString().split('T')[0], // YYYY-MM-DD format
        until: until.toISOString().split('T')[0]
    }
}

/**
 * Account Domain - Grouped collection of all Account-related functions
 * Following DDD principles with functional programming style
 */
export const AccountDomain = {
    createAccount,
    isAccountExpired,
    canAccountExport,
    getActiveAdAccounts,
    findAdAccount,
    getAdAccountCurrency,
    updateAdAccounts,
    setAdAccountActive,
    disconnectAccount,
    updateAdAccountSyncAdSet,
    updateAdAccountSyncInsight,
    validateTimeRange,
    getAdAccountInsightSyncTimeRange,
}
