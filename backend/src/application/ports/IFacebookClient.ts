/**
 * Facebook Client Port Interface
 * Unified interface for all Facebook Graph API operations
 */

import { AdAccount } from '../../domain/value-objects/AdAccount'
import { AdInsightsTimeRange } from '../../domain/value-objects/TimeRange'

// OAuth Types
export interface OAuthTokenResponse {
    accessToken: string
    tokenType: string
    expiresIn: number
}

export interface DebugTokenResponse {
    isValid: boolean
    userId: string
    scopes: string[]
    expiresAt: Date
}

export interface AuthUrlResponse {
    url: string
    state: string
}

export interface AdAccountsResponse {
    adAccounts: AdAccount[]
}

// Insights Types
export interface AsyncReportRequest {
    adAccountId: string
    level: 'adset' | 'campaign' | 'account'
    fields: string[]
    timeRange: AdInsightsTimeRange
}

export interface AsyncReportResponse {
    reportRunId: string
    accountId: string
}

export interface AsyncReportStatus {
    reportRunId: string
    asyncStatus: 'Job Not Started' | 'Job Started' | 'Job Running' | 'Job Completed' | 'Job Failed' | 'Job Skipped'
    asyncPercentCompletion?: number
}

export interface CSVExportResult {
    reportRunId: string
    fileUrl: string
}

// Graph API Types
export interface FetchAdSetsParams {
    accessToken: string
    adAccountId: string
}

export interface UpdateAdsetBudgetParams {
    accessToken: string
    adsetId: string
    dailyBudget: number
}

export interface UpdateAdsetBudgetResponse {
    success: boolean
}

// Campaign Types
export interface FetchCampaignsParams {
    accessToken: string
    adAccountId: string
}

export interface FacebookCampaign {
    id: string
    name: string
    status: string
    daily_budget?: string
    lifetime_budget?: string
    start_time?: string
    stop_time?: string
    updated_time?: string
}

export interface UpdateCampaignBudgetParams {
    accessToken: string
    campaignId: string
    dailyBudget: number
}

export interface UpdateCampaignBudgetResponse {
    success: boolean
}

/**
 * Unified Facebook Client Interface
 */
export interface IFacebookClient {
    // OAuth operations
    generateAuthUrl(): Promise<AuthUrlResponse>
    exchangeCode(code: string): Promise<OAuthTokenResponse>
    exchangeLongLivedToken(shortLivedToken: string): Promise<OAuthTokenResponse>
    debugToken(accessToken: string): Promise<DebugTokenResponse>
    getAdAccounts(accessToken: string): Promise<AdAccountsResponse>

    // Insights operations
    createAsyncReport(accessToken: string, request: AsyncReportRequest): Promise<AsyncReportResponse>
    pollReportStatus(accessToken: string, reportRunId: string): Promise<AsyncReportStatus>
    getReportCSV(accessToken: string, reportRunId: string): Promise<CSVExportResult>

    // AdSet operations
    fetchAdSets(params: FetchAdSetsParams): Promise<any[]>
    updateAdsetBudget(params: UpdateAdsetBudgetParams): Promise<UpdateAdsetBudgetResponse>

    // Campaign operations
    fetchCampaigns(params: FetchCampaignsParams): Promise<FacebookCampaign[]>
    updateCampaignBudget(params: UpdateCampaignBudgetParams): Promise<UpdateCampaignBudgetResponse>
}
