/**
 * Application Service Interface: IAdInsightsService
 * Defines contract for Facebook Ad Insights async reporting operations
 */

import { AdInsightsTimeRange } from '../../domain/value-objects/TimeRange'


export interface AsyncReportStatus {
    reportRunId: string
    asyncStatus: 'Job Not Started' | 'Job Started' | 'Job Running' | 'Job Completed' | 'Job Failed' | 'Job Skipped'
    asyncPercentCompletion?: number
}

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

export interface CSVExportResult {
    reportRunId: string
    fileUrl: string
    completedAt: Date
    recordCount?: number
}

export interface IAdInsightsService {
    createAsyncReport(accessToken: string, request: AsyncReportRequest): Promise<AsyncReportResponse>
    pollReportStatus(accessToken: string, reportRunId: string): Promise<AsyncReportStatus>
    getReportCSV(accessToken: string, reportRunId: string): Promise<CSVExportResult>
}
