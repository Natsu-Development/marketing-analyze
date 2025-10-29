/**
 * Facebook Authentication Use Cases
 * Simplified functional approach - plain objects + pure functions
 */

import { Account, AccountStatus, AccountDomain } from '../../domain'
import { accountRepository as repo } from '../../config/dependencies'
import { facebookOAuthClient } from '../../config/dependencies'

const REQUIRED_SCOPES = ['ads_read', 'ads_management', 'public_profile']

// Initiate Connection (Session)
export interface InitiateConnectionRequest {
    userId?: string // For future multi-tenancy
}

export interface InitiateConnectionResponse {
    success: boolean
    redirectUrl?: string
    state?: string
    error?: string
}

export async function initiateConnection(_request: InitiateConnectionRequest): Promise<InitiateConnectionResponse> {
    try {
        const authUrl = await facebookOAuthClient.generateAuthUrl()
        return {
            success: true,
            redirectUrl: authUrl.url,
            state: authUrl.state,
        }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'FAILED_TO_GENERATE_AUTH_URL' }
    }
}

// Disconnect Account
export interface DisconnectRequest {
    accountId: string
}

export interface DisconnectResponse {
    success: boolean
    message?: string
    error?: string
}

export async function disconnect(request: DisconnectRequest): Promise<DisconnectResponse> {
    try {
        const account = await repo.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // Use functional approach to mark as disconnected
        const disconnectedAccount = AccountDomain.disconnectAccount(account)
        await repo.save(disconnectedAccount)

        return { success: true, message: 'Facebook account disconnected successfully' }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

// Get Account Status
export interface GetStatusRequest {
    accountId: string
}

export interface GetStatusResponse {
    success: boolean
    status?: string
    accountId?: string
    expiresAt?: Date
    needsRefresh?: boolean
    adAccountsCount?: number
    error?: string
}

export async function getStatus(request: GetStatusRequest): Promise<GetStatusResponse> {
    try {
        const account = await repo.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        return {
            success: true,
            status: account.status.toUpperCase(),
            accountId: account.accountId,
            expiresAt: account.expiresAt,
            needsRefresh: AccountDomain.doesAccountNeedRefresh(account),
            adAccountsCount: account.adAccounts?.length || 0,
        }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

// Get Valid Token
export interface GetTokenRequest {
    accountId: string
}

export interface GetTokenResponse {
    success: boolean
    accessToken?: string
    expiresAt?: Date
    error?: string
}

export async function getToken(request: GetTokenRequest): Promise<GetTokenResponse> {
    try {
        let account = await repo.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // If expired, fail
        if (AccountDomain.isAccountExpired(account)) {
            const needsReconnectAccount = AccountDomain.markAccountAsNeedsReconnect(account, 'TOKEN_EXPIRED')
            await repo.save(needsReconnectAccount)
            return { success: false, error: 'NEEDS_RECONNECT' }
        }

        // If needs refresh, try to refresh
        if (AccountDomain.doesAccountNeedRefresh(account)) {
            const refreshResult = await refreshToken({ accountId: request.accountId })
            if (!refreshResult.success) {
                return { success: false, error: 'NEEDS_RECONNECT' }
            }
            account = refreshResult.account!
        }

        return {
            success: true,
            accessToken: account.accessToken,
            expiresAt: account.expiresAt,
        }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

// Refresh Ad Accounts
export interface RefreshAdAccountsRequest {
    accountId: string
}

export interface RefreshAdAccountsResponse {
    success: boolean
    message?: string
    adAccountsCount?: number
    account?: Account
    error?: string
}

export async function refreshAdAccounts(request: RefreshAdAccountsRequest): Promise<RefreshAdAccountsResponse> {
    try {
        const account = await repo.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // Get fresh token
        const tokenResult = await getToken({ accountId: request.accountId })
        if (!tokenResult.success) {
            return { success: false, error: tokenResult.error }
        }

        // Fetch ad accounts from Facebook
        const adAccountsResponse = await facebookOAuthClient.getAdAccounts(tokenResult.accessToken!)
        const adAccounts = adAccountsResponse.adAccounts

        // Update account with new ad accounts
        const updatedAccount = AccountDomain.updateAccountAdAccounts(account, adAccounts)
        const savedAccount = await repo.save(updatedAccount)

        return {
            success: true,
            message: 'Ad accounts refreshed successfully',
            adAccountsCount: adAccounts.length,
            account: savedAccount,
        }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

// Set Ad Account Active Status
export interface SetAdAccountActiveRequest {
    accountId: string
    adAccountId: string
    isActive: boolean
}

export interface SetAdAccountActiveResponse {
    success: boolean
    account?: Account
    error?: string
}

export async function setAdAccountActive(request: SetAdAccountActiveRequest): Promise<SetAdAccountActiveResponse> {
    try {
        const account = await repo.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // Use functional approach - no methods on objects, just functions
        const updatedAccount = AccountDomain.setAdAccountActiveStatus(account, request.adAccountId, request.isActive)

        const savedAccount = await repo.save(updatedAccount)
        return { success: true, account: savedAccount }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

// Handle OAuth Callback
export interface HandleCallbackRequest {
    code: string
    state?: string
    expectedState?: string
}

export interface HandleCallbackResponse {
    success: boolean
    account?: Account
    error?: string
}

export async function handleCallback(request: HandleCallbackRequest): Promise<HandleCallbackResponse> {
    try {
        // Validate CSRF protection
        if (request.expectedState && request.state !== request.expectedState) {
            return { success: false, error: 'STATE_MISMATCH' }
        }

        // Exchange code for tokens
        const tokenResponse = await facebookOAuthClient.exchangeCode(request.code)
        const longLivedToken = await facebookOAuthClient.exchangeLongLivedToken(tokenResponse.accessToken)

        // Validate token and get user info
        const debugInfo = await facebookOAuthClient.debugToken(longLivedToken.accessToken)

        // Validate scopes
        const hasAllScopes = REQUIRED_SCOPES.every((scope) => debugInfo.scopes.includes(scope))
        if (!hasAllScopes) {
            return { success: false, error: 'SCOPE_MISMATCH' }
        }

        // Fetch ad accounts information
        let adAccounts: any[] = []
        try {
            const adAccountsResponse = await facebookOAuthClient.getAdAccounts(longLivedToken.accessToken)
            adAccounts = adAccountsResponse.adAccounts
        } catch (error) {
            console.warn('Failed to fetch ad accounts, continuing without them:', error)
        }

        // Create account using functional approach - no factory pattern!
        const account = AccountDomain.createAccount({
            accountId: debugInfo.userId,
            accessToken: longLivedToken.accessToken,
            scopes: debugInfo.scopes,
            status: AccountStatus.CONNECTED,
            connectedAt: new Date(),
            expiresAt: new Date(Date.now() + longLivedToken.expiresIn * 1000),
            adAccounts,
        })

        const savedAccount = await repo.save(account)
        return { success: true, account: savedAccount }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'UNKNOWN_ERROR' }
    }
}

// Refresh Token
export interface RefreshTokenRequest {
    accountId: string
}

export interface RefreshTokenResponse {
    success: boolean
    account?: Account
    error?: string
}

export async function refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
        const account = await repo.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // Check if needs refresh using functional approach
        if (!AccountDomain.doesAccountNeedRefresh(account)) {
            return { success: true, account }
        }

        try {
            const longLivedToken = await facebookOAuthClient.exchangeLongLivedToken(account.accessToken)

            // Update tokens using functional approach
            const updatedAccount = AccountDomain.updateAccountTokens(
                account,
                longLivedToken.accessToken,
                new Date(Date.now() + longLivedToken.expiresIn * 1000)
            )

            const savedAccount = await repo.save(updatedAccount)
            return { success: true, account: savedAccount }
        } catch (error) {
            // Mark as needs reconnect using functional approach
            const needsReconnectAccount = AccountDomain.markAccountAsNeedsReconnect(account, 'REFRESH_FAILED')
            await repo.save(needsReconnectAccount)
            return { success: false, error: 'REFRESH_FAILED' }
        }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

/**
 * Facebook Auth Use Case - Grouped collection of all Facebook authentication functions
 */
export const FbAuthUseCase = {
    initiateConnection,
    disconnect,
    getStatus,
    getToken,
    refreshAdAccounts,
    setAdAccountActive,
    handleCallback,
    refreshToken,
}
