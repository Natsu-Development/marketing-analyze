/**
 * Domain Service: Account Management
 * Contains business logic for account management, OAuth flows, and token handling
 * Uses functional programming style with pure functions
 */

import { Account, AccountDomain, AccountStatus } from '../aggregates/account'
import { AdAccount } from '../value-objects/AdAccount'
import { AdInsightsTimeRange } from '../value-objects/TimeRange'

export interface OAuthTokenData {
    accessToken: string
    expiresAt: Date
    scopes?: string[]
}

export interface AccountValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

export interface AccountAttentionStatus {
    needsReconnect: boolean
    needsTokenRefresh: boolean
    hasWarnings: boolean
    reasons: string[]
}

export interface ExportValidation {
    valid: boolean
    errors: string[]
    warnings: string[]
}


/**
 * Validate OAuth token data
 */
export function validateOAuthTokenData(tokenData: OAuthTokenData): AccountValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!tokenData.accessToken || tokenData.accessToken.trim().length === 0) {
        errors.push('Access token is required')
    }

    if (!tokenData.expiresAt) {
        errors.push('Token expiration date is required')
    } else if (tokenData.expiresAt <= new Date()) {
        errors.push('Token is already expired')
    } else if (tokenData.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
        // 5 minutes
        warnings.push('Token expires very soon')
    }

    if (!tokenData.scopes || tokenData.scopes.length === 0) {
        errors.push('Token scopes are required')
    } else {
        const requiredScopes = ['ads_read', 'ads_management']
        const missingScopes = requiredScopes.filter((scope) => !tokenData.scopes!.includes(scope))
        if (missingScopes.length > 0) {
            errors.push(`Missing required scopes: ${missingScopes.join(', ')}`)
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    }
}

/**
 * Process successful OAuth connection
 */
export function processOAuthConnection(
    existingAccount: Account | null,
    tokenData: OAuthTokenData,
    adAccounts: AdAccount[]
): Account {
    const validation = validateOAuthTokenData(tokenData)
    if (!validation.isValid) {
        throw new Error(`Invalid OAuth token data: ${validation.errors.join(', ')}`)
    }

    const baseAccount = existingAccount || {
        accountId: extractAccountIdFromToken(tokenData.accessToken),
    }

    let updatedAccount = AccountDomain.createAccount({
        ...baseAccount,
        accessToken: tokenData.accessToken,
        scopes: tokenData.scopes || [],
        expiresAt: tokenData.expiresAt,
        status: AccountStatus.CONNECTED,
    })

    // Update ad accounts
    updatedAccount = AccountDomain.updateAccountAdAccounts(updatedAccount, adAccounts)

    return updatedAccount
}

/**
 * Handle token refresh
 */
export function processTokenRefresh(account: Account, newTokenData: OAuthTokenData): Account {
    const validation = validateOAuthTokenData(newTokenData)
    if (!validation.isValid) {
        throw new Error(`Invalid refresh token data: ${validation.errors.join(', ')}`)
    }

    return AccountDomain.updateAccountTokens(account, newTokenData.accessToken, newTokenData.expiresAt)
}

/**
 * Handle connection failure
 */
export function processConnectionFailure(account: Account, errorCode: string): Account {
    return AccountDomain.markAccountAsNeedsReconnect(account, errorCode)
}

/**
 * Check if account requires attention
 */
export function getAccountAttentionStatus(account: Account): AccountAttentionStatus {
    const reasons: string[] = []

    const needsReconnect = account.status === AccountStatus.NEEDS_RECONNECT
    if (needsReconnect) {
        reasons.push('Account needs reconnection')
    }

    const needsTokenRefresh = AccountDomain.doesAccountNeedRefresh(account)
    if (needsTokenRefresh) {
        reasons.push('Access token needs refresh')
    }

    const isExpired = AccountDomain.isAccountExpired(account)
    if (isExpired) {
        reasons.push('Access token is expired')
    }

    const hasWarnings = !isExpired && AccountDomain.isAccountExpiringSoon(account)

    return {
        needsReconnect,
        needsTokenRefresh,
        hasWarnings,
        reasons,
    }
}


/**
 * Extract account ID from access token (simplified - in reality this would decode JWT)
 */
export function extractAccountIdFromToken(accessToken: string): string {
    // This is a placeholder - in a real implementation you'd decode the token
    // For now, we'll use a hash of the token as a temporary account ID
    return `acc_${Buffer.from(accessToken.slice(0, 10)).toString('hex')}`
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

    if (sinceDate >= untilDate) {
        errors.push('Since date must be before until date')
    }

    // Check maximum range (business rule: max 90 days)
    const maxRangeMs = 90 * 24 * 60 * 60 * 1000 // 90 days
    if (untilDate.getTime() - sinceDate.getTime() > maxRangeMs) {
        errors.push('Time range cannot exceed 90 days')
    }

    // Check minimum range (business rule: at least 1 day)
    const minRangeMs = 24 * 60 * 60 * 1000 // 1 day
    if (untilDate.getTime() - sinceDate.getTime() < minRangeMs) {
        errors.push('Time range must be at least 1 day')
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Account Management Domain Service - Functional approach
 * Provides a clean, organized namespace for all account management operations
 */
export const AccountService = {
    validateOAuthTokenData,
    processOAuthConnection,
    processTokenRefresh,
    processConnectionFailure,
    getAccountAttentionStatus,
    extractAccountIdFromToken,
    validateTimeRange,
}
