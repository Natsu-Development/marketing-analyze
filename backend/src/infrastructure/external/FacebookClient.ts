/**
 * Infrastructure Service: FacebookOAuthClient
 * Implements Facebook OAuth 2.0 API interactions
 * Uses direct import for configuration
 */

import axios, { AxiosInstance } from 'axios'
import {
    IFacebookOAuthService,
    OAuthTokenResponse,
    DebugTokenResponse,
    AdAccountsResponse,
    AuthUrlResponse,
    FacebookAdAccount,
} from '../../domain'
import { appConfig } from '../../config/env'

const config = {
    appId: appConfig.facebook.appId,
    appSecret: appConfig.facebook.appSecret,
    redirectUri: appConfig.facebook.redirectUri,
    apiVersion: appConfig.facebook.apiVersion,
}

const baseUrl = `https://graph.facebook.com/${config.apiVersion}`
const httpClient: AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

const mapTokenResponse = (data: any): OAuthTokenResponse => {
    return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in || 5184000, // Default 60 days for long-lived tokens
    }
}

const generateState = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const handleError = (operation: string, error: any): never => {
    const message = error.response?.data?.error?.message || error.message
    throw new Error(`${operation}: ${message}`)
}

const generateAuthUrl = async (): Promise<AuthUrlResponse> => {
    const state = generateState()
    const scopes = ['ads_read', 'ads_management', 'public_profile']

    const params = new URLSearchParams({
        client_id: config.appId,
        redirect_uri: config.redirectUri,
        scope: scopes.join(','),
        state: state,
        response_type: 'code',
    })

    const url = `https://www.facebook.com/${config.apiVersion}/dialog/oauth?${params.toString()}`

    return { url, state }
}

const exchangeCode = async (code: string): Promise<OAuthTokenResponse> => {
    try {
        const response = await httpClient.get('/oauth/access_token', {
            params: {
                client_id: config.appId,
                client_secret: config.appSecret,
                redirect_uri: config.redirectUri,
                code,
            },
        })
        return mapTokenResponse(response.data)
    } catch (error: any) {
        return handleError('Failed to exchange authorization code', error)
    }
}

const exchangeLongLivedToken = async (shortLivedToken: string): Promise<OAuthTokenResponse> => {
    try {
        const response = await httpClient.get('/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: config.appId,
                client_secret: config.appSecret,
                fb_exchange_token: shortLivedToken,
            },
        })
        return mapTokenResponse(response.data)
    } catch (error: any) {
        return handleError('Failed to exchange long-lived token', error)
    }
}

const debugToken = async (accessToken: string): Promise<DebugTokenResponse> => {
    try {
        const response = await httpClient.get('/debug_token', {
            params: {
                input_token: accessToken,
                access_token: `${config.appId}|${config.appSecret}`,
            },
        })

        const data = response.data.data
        console.log('debugToken data', data)
        return {
            isValid: data.is_valid,
            userId: data.user_id,
            scopes: data.scopes || [],
            expiresAt: new Date(data.expires_at * 1000),
        }
    } catch (error: any) {
        return handleError('Failed to debug token', error)
    }
}

const getAdAccounts = async (accessToken: string): Promise<AdAccountsResponse> => {
    try {
        const response = await httpClient.get('/me/adaccounts', {
            params: {
                access_token: accessToken,
                fields: 'id,name,account_status,business_name,currency,timezone_name,spend_cap,account_id',
                limit: 100,
            },
        })

        const data = response.data
        const adAccounts: FacebookAdAccount[] = data.data.map((account: any) => ({
            name: account.name,
            status: account.account_status,
            currency: account.currency,
            timezone: account.timezone_name,
            spendCap: account.spend_cap,
            adAccountId: account.account_id || account.id,
            isActive: false, // Default to inactive, user can activate later
        }))

        return {
            adAccounts,
            paging: data.paging,
        }
    } catch (error: any) {
        return handleError('Failed to fetch ad accounts', error)
    }
}

export const facebookOAuthClient: IFacebookOAuthService = {
    generateAuthUrl,
    exchangeCode,
    exchangeLongLivedToken,
    debugToken,
    getAdAccounts,
}
