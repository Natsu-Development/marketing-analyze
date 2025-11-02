/**
 * Facebook Client Implementation
 * Unified client for all Facebook Graph API operations
 */

import axios, { AxiosInstance } from 'axios'
import {
    IFacebookClient,
    OAuthTokenResponse,
    DebugTokenResponse,
    AuthUrlResponse,
    AdAccountsResponse,
    AsyncReportRequest,
    AsyncReportResponse,
    AsyncReportStatus,
    CSVExportResult,
    FetchAdSetsParams,
} from '../../../application/ports/IFacebookClient'
import { AdAccount } from '../../../domain'
import { appConfig } from '../../../config/env'

const config = {
    appId: appConfig.facebook.appId,
    appSecret: appConfig.facebook.appSecret,
    redirectUri: appConfig.facebook.redirectUri,
    apiVersion: appConfig.facebook.apiVersion,
}

const baseUrl = `https://graph.facebook.com/${config.apiVersion}`
const httpClient: AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
})

const handleError = (operation: string, error: any): never => {
    const message = error.response?.data?.error?.message || error.message
    throw new Error(`${operation}: ${message}`)
}

const generateState = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// ============================================================================
// OAuth Operations
// ============================================================================

const generateAuthUrl = async (): Promise<AuthUrlResponse> => {
    const state = generateState()
    const scopes = ['ads_read', 'ads_management', 'public_profile']

    const params = new URLSearchParams({
        client_id: config.appId,
        redirect_uri: config.redirectUri,
        scope: scopes.join(','),
        state,
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
        return {
            accessToken: response.data.access_token,
            tokenType: response.data.token_type || 'bearer',
            expiresIn: response.data.expires_in || 5184000,
        }
    } catch (error: any) {
        return handleError('exchangeCode', error)
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
        return {
            accessToken: response.data.access_token,
            tokenType: response.data.token_type || 'bearer',
            expiresIn: response.data.expires_in || 5184000,
        }
    } catch (error: any) {
        return handleError('exchangeLongLivedToken', error)
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
        return {
            isValid: data.is_valid,
            userId: data.user_id,
            scopes: data.scopes || [],
            expiresAt: new Date(data.expires_at * 1000),
        }
    } catch (error: any) {
        return handleError('debugToken', error)
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

        const adAccounts: AdAccount[] = response.data.data.map((account: any) => ({
            name: account.name,
            status: account.account_status,
            currency: account.currency,
            timezone: account.timezone_name,
            spendCap: account.spend_cap,
            adAccountId: account.account_id || account.id,
            isActive: false,
        }))

        return { adAccounts }
    } catch (error: any) {
        return handleError('getAdAccounts', error)
    }
}

// ============================================================================
// Insights Operations
// ============================================================================

const createAsyncReport = async (accessToken: string, request: AsyncReportRequest): Promise<AsyncReportResponse> => {
    try {
        const adAccountId = request.adAccountId.startsWith('act_') ? request.adAccountId : `act_${request.adAccountId}`

        const params = new URLSearchParams()
        params.append('access_token', accessToken)
        params.append('fields', request.fields.join(','))
        params.append('level', request.level)
        params.append('time_range', JSON.stringify({ since: request.timeRange.since, until: request.timeRange.until }))
        params.append('format', 'csv')
        params.append('locale', 'en_US')
        params.append('time_increment', '1')
        params.append('filtering', JSON.stringify([{ field: 'adset.effective_status', operator: 'IN', value: ['ACTIVE'] }]))

        const response = await httpClient.post(`/${adAccountId}/insights`, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })

        if (response.data.error || !response.data.report_run_id) {
            throw new Error(`Invalid response: ${JSON.stringify(response.data)}`)
        }

        return {
            reportRunId: response.data.report_run_id,
            accountId: request.adAccountId,
        }
    } catch (error: any) {
        return handleError('createAsyncReport', error)
    }
}

const pollReportStatus = async (accessToken: string, reportRunId: string): Promise<AsyncReportStatus> => {
    const maxAttempts = 60
    const pollIntervalMs = 20000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await httpClient.get(`/${reportRunId}`, {
                params: { access_token: accessToken, fields: 'async_status,async_percent_completion,id' },
            })

            if (response.data.error) {
                return { reportRunId, asyncStatus: 'Job Failed', asyncPercentCompletion: 0 }
            }

            const status: AsyncReportStatus = {
                reportRunId,
                asyncStatus: response.data.async_status,
                asyncPercentCompletion: response.data.async_percent_completion,
            }

            if (status.asyncStatus === 'Job Completed' || status.asyncStatus === 'Job Failed') {
                return status
            }

            if (attempt < maxAttempts - 1) {
                await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
            }
        } catch (error: any) {
            if (attempt === maxAttempts - 1) {
                return handleError('pollReportStatus', error)
            }
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
        }
    }

    return { reportRunId, asyncStatus: 'Job Failed' }
}

const getReportCSV = async (accessToken: string, reportRunId: string): Promise<CSVExportResult> => {
    try {
        const exportUrl = 'https://www.facebook.com/ads/ads_insights/export_report'
        const csvUrl = `${exportUrl}?report_run_id=${reportRunId}&format=csv&locale=en_US&access_token=${accessToken}`

        const csvResponse = await axios.get(csvUrl, {
            responseType: 'text',
            timeout: 300000,
        })

        const recordCount = (csvResponse.data as string).split('\n').length - 1

        return {
            reportRunId,
            fileUrl: `${exportUrl}?report_run_id=${reportRunId}&format=csv&locale=en_US`,
            completedAt: new Date(),
            recordCount,
        }
    } catch (error: any) {
        return handleError('getReportCSV', error)
    }
}

// ============================================================================
// AdSet operations
// ============================================================================

const fetchAdSets = async (params: FetchAdSetsParams): Promise<any[]> => {
    try {
        const adAccountIdWithPrefix = params.adAccountId.startsWith('act_')
            ? params.adAccountId
            : `act_${params.adAccountId}`

        const queryParams = new URLSearchParams({
            access_token: params.accessToken,
            fields: 'id,name,campaign{id,name},status,daily_budget,lifetime_budget,start_time,end_time,updated_time',
            filtering: JSON.stringify([{ field: 'updated_time', operator: 'GREATER_THAN', value: params.updatedSince }]),
            limit: '500',
        })

        const url = `${baseUrl}/${adAccountIdWithPrefix}/adsets?${queryParams.toString()}`
        const response = await axios.get(url)

        return response.data.data || []
    } catch (error: any) {
        return handleError('fetchAdSets', error)
    }
}

// ============================================================================
// Export
// ============================================================================

export const facebookClient: IFacebookClient = {
    generateAuthUrl,
    exchangeCode,
    exchangeLongLivedToken,
    debugToken,
    getAdAccounts,
    createAsyncReport,
    pollReportStatus,
    getReportCSV,
    fetchAdSets,
}
