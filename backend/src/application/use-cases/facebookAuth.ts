/**
 * Facebook Authentication Use Cases
 * Simplified functional approach - plain objects + pure functions
 */

import { FacebookConnection, fbConnection, ConnectionStatus } from '../../domain/Connection'
import { facebookConnectionRepository as repo } from '../../infrastructure/mongo-db/ConnectionRepository'
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

// Disconnect Connection
export interface DisconnectRequest {
    fbUserId: string
}

export interface DisconnectResponse {
    success: boolean
    message?: string
    error?: string
}

export async function disconnect(request: DisconnectRequest): Promise<DisconnectResponse> {
    try {
        const connection = await repo.findByFbUserId(request.fbUserId)
        if (!connection) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // Use functional approach to mark as disconnected
        const disconnectedConnection = fbConnection.disconnect(connection)
        await repo.save(disconnectedConnection)

        return { success: true, message: 'Facebook account disconnected successfully' }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

// Get Connection Status
export interface GetStatusRequest {
    fbUserId: string
}

export interface GetStatusResponse {
    success: boolean
    status?: string
    fbUserId?: string
    expiresAt?: Date
    needsRefresh?: boolean
    adAccountsCount?: number
    error?: string
}

export async function getStatus(request: GetStatusRequest): Promise<GetStatusResponse> {
    try {
        const connection = await repo.findByFbUserId(request.fbUserId)
        if (!connection) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        return {
            success: true,
            status: connection.status.toUpperCase(),
            fbUserId: connection.fbUserId,
            expiresAt: connection.expiresAt,
            needsRefresh: fbConnection.needsRefresh(connection),
            adAccountsCount: connection.adAccounts?.length || 0,
        }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

// Get Valid Token
export interface GetTokenRequest {
    fbUserId: string
}

export interface GetTokenResponse {
    success: boolean
    accessToken?: string
    expiresAt?: Date
    error?: string
}

export async function getToken(request: GetTokenRequest): Promise<GetTokenResponse> {
    try {
        let connection = await repo.findByFbUserId(request.fbUserId)
        if (!connection) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // If expired, fail
        if (fbConnection.isExpired(connection)) {
            const needsReconnectConnection = fbConnection.markAsNeedsReconnect(connection, 'TOKEN_EXPIRED')
            await repo.save(needsReconnectConnection)
            return { success: false, error: 'NEEDS_RECONNECT' }
        }

        // If needs refresh, try to refresh
        if (fbConnection.needsRefresh(connection)) {
            const refreshResult = await refreshToken({ fbUserId: request.fbUserId })
            if (!refreshResult.success) {
                return { success: false, error: 'NEEDS_RECONNECT' }
            }
            connection = refreshResult.connection!
        }

        return {
            success: true,
            accessToken: connection.accessToken,
            expiresAt: connection.expiresAt,
        }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

// Refresh Ad Accounts
export interface RefreshAdAccountsRequest {
    fbUserId: string
}

export interface RefreshAdAccountsResponse {
    success: boolean
    message?: string
    adAccountsCount?: number
    connection?: FacebookConnection
    error?: string
}

export async function refreshAdAccounts(request: RefreshAdAccountsRequest): Promise<RefreshAdAccountsResponse> {
    try {
        const connection = await repo.findByFbUserId(request.fbUserId)
        if (!connection) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // Get fresh token
        const tokenResult = await getToken({ fbUserId: request.fbUserId })
        if (!tokenResult.success) {
            return { success: false, error: tokenResult.error }
        }

        // Fetch ad accounts from Facebook
        const adAccountsResponse = await facebookOAuthClient.getAdAccounts(tokenResult.accessToken!)
        const adAccounts = adAccountsResponse.adAccounts

        // Update connection with new ad accounts
        const updatedConnection = fbConnection.updateAdAccounts(connection, adAccounts)
        const savedConnection = await repo.save(updatedConnection)

        return {
            success: true,
            message: 'Ad accounts refreshed successfully',
            adAccountsCount: adAccounts.length,
            connection: savedConnection,
        }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

// Set Ad Account Active Status
export interface SetAdAccountActiveRequest {
    fbUserId: string
    adAccountId: string
    isActive: boolean
}

export interface SetAdAccountActiveResponse {
    success: boolean
    connection?: FacebookConnection
    error?: string
}

export async function setAdAccountActive(request: SetAdAccountActiveRequest): Promise<SetAdAccountActiveResponse> {
    try {
        const connection = await repo.findByFbUserId(request.fbUserId)
        if (!connection) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // Use functional approach - no methods on objects, just functions
        const updatedConnection = fbConnection.setAdAccountActive(connection, request.adAccountId, request.isActive)

        const savedConnection = await repo.save(updatedConnection)
        return { success: true, connection: savedConnection }
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
    connection?: FacebookConnection
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

        // Create connection using functional approach - no factory pattern!
        const connection = fbConnection.create({
            fbUserId: debugInfo.userId,
            accessToken: longLivedToken.accessToken,
            scopes: debugInfo.scopes,
            status: ConnectionStatus.CONNECTED,
            connectedAt: new Date(),
            expiresAt: new Date(Date.now() + longLivedToken.expiresIn * 1000),
            adAccounts,
        })

        const savedConnection = await repo.save(connection)
        return { success: true, connection: savedConnection }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'UNKNOWN_ERROR' }
    }
}

// Refresh Token
export interface RefreshTokenRequest {
    fbUserId: string
}

export interface RefreshTokenResponse {
    success: boolean
    connection?: FacebookConnection
    error?: string
}

export async function refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
        const connection = await repo.findByFbUserId(request.fbUserId)
        if (!connection) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        // Check if needs refresh using functional approach
        if (!fbConnection.needsRefresh(connection)) {
            return { success: true, connection }
        }

        try {
            const longLivedToken = await facebookOAuthClient.exchangeLongLivedToken(connection.accessToken)

            // Update tokens using functional approach
            const updatedConnection = fbConnection.updateTokens(
                connection,
                longLivedToken.accessToken,
                new Date(Date.now() + longLivedToken.expiresIn * 1000)
            )

            const savedConnection = await repo.save(updatedConnection)
            return { success: true, connection: savedConnection }
        } catch (error) {
            // Mark as needs reconnect using functional approach
            const needsReconnectConnection = fbConnection.markAsNeedsReconnect(connection, 'REFRESH_FAILED')
            await repo.save(needsReconnectConnection)
            return { success: false, error: 'REFRESH_FAILED' }
        }
    } catch (error) {
        const err = error as Error
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}
