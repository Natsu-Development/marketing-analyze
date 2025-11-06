/**
 * Facebook Auth Use Cases
 * Manages Facebook OAuth authentication and account operations
 */

import { AccountDomain } from '../../../domain'
import { accountRepository, facebookClient } from '../../../config/dependencies'
import {
    InitiateConnectionRequest,
    InitiateConnectionResponse,
    DisconnectRequest,
    DisconnectResponse,
    HandleCallbackRequest,
    HandleCallbackResponse,
} from './types'

const REQUIRED_SCOPES = ['ads_read', 'ads_management', 'public_profile']

/**
 * Initiate OAuth connection
 */
export async function initiateConnection(_request: InitiateConnectionRequest): Promise<InitiateConnectionResponse> {
    try {
        const authUrl = await facebookClient.generateAuthUrl()
        return {
            success: true,
            redirectUrl: authUrl.url,
            state: authUrl.state,
        }
    } catch (error) {
        return { success: false, error: (error as Error).message || 'FAILED_TO_GENERATE_AUTH_URL' }
    }
}

/**
 * Disconnect account
 */
export async function disconnect(request: DisconnectRequest): Promise<DisconnectResponse> {
    try {
        const account = await accountRepository.findByAccountId(request.accountId)
        if (!account) {
            return { success: false, error: 'NO_CONNECTION' }
        }

        const disconnectedAccount = AccountDomain.disconnectAccount(account)
        await accountRepository.save(disconnectedAccount)

        return { success: true, message: 'Facebook account disconnected successfully' }
    } catch (error) {
        return { success: false, error: (error as Error).message || 'INTERNAL_ERROR' }
    }
}

/**
 * Handle OAuth callback
 */
export async function handleCallback(request: HandleCallbackRequest): Promise<HandleCallbackResponse> {
    try {
        // Exchange code for tokens
        const tokenResponse = await facebookClient.exchangeCode(request.code)
        const longLivedToken = await facebookClient.exchangeLongLivedToken(tokenResponse.accessToken)

        // Validate token and get user info
        const debugInfo = await facebookClient.debugToken(longLivedToken.accessToken)

        // Validate scopes
        const hasAllScopes = REQUIRED_SCOPES.every((scope) => debugInfo.scopes.includes(scope))
        if (!hasAllScopes) {
            return { success: false, error: 'SCOPE_MISMATCH' }
        }

        // Fetch ad accounts
        let adAccounts: any[] = []
        try {
            const adAccountsResponse = await facebookClient.getAdAccounts(longLivedToken.accessToken)
            adAccounts = adAccountsResponse.adAccounts
        } catch (error) {
            console.warn('Failed to fetch ad accounts, continuing without them:', error)
        }

        // Create account
        const account = AccountDomain.createAccount({
            accountId: debugInfo.userId,
            accessToken: longLivedToken.accessToken,
            scopes: debugInfo.scopes,
            expiresAt: new Date(Date.now() + longLivedToken.expiresIn * 1000),
            adAccounts,
        })

        await accountRepository.save(account)
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message || 'UNKNOWN_ERROR' }
    }
}
