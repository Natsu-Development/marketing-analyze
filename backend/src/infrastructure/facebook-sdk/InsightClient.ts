/**
 * Infrastructure Service: AdInsightsClient
 * Implements Facebook Ad Insights async reporting API
 */

import axios, { AxiosInstance } from 'axios'
import {
    IAdInsightsService,
    AsyncReportRequest,
    AsyncReportResponse,
    AsyncReportStatus,
    CSVExportResult,
} from '../../application/ports/IAdInsightsService'
import { appConfig } from '../../config/env'

const config = {
    apiVersion: appConfig.facebook.apiVersion,
}

const baseUrl = `https://graph.facebook.com/${config.apiVersion}`
const httpClient: AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 60000, // Increased timeout for large exports
    headers: {
        'Content-Type': 'application/json',
    },
})

const handleError = (operation: string, error: any): never => {
    const message = error.response?.data?.error?.message || error.message
    throw new Error(`${operation}: ${message}`)
}

const createAsyncReport = async (accessToken: string, request: AsyncReportRequest): Promise<AsyncReportResponse> => {
    try {
        // Ensure the adAccountId has the 'act_' prefix for Facebook Insights API
        const adAccountId = request.adAccountId.startsWith('act_') ? request.adAccountId : `act_${request.adAccountId}`

        // Build URL-encoded parameters for Facebook Insights API
        const params = new URLSearchParams()
        params.append('access_token', accessToken)
        params.append('fields', request.fields.join(','))
        params.append('level', request.level)
        params.append(
            'time_range',
            JSON.stringify({
                since: request.timeRange.since,
                until: request.timeRange.until,
            })
        )
        params.append('format', 'csv')
        params.append('locale', 'en_US')
        params.append('time_increment', '1')
        params.append(
            'filtering',
            JSON.stringify([
                {
                    field: 'adset.effective_status',
                    operator: 'IN',
                    value: ['ACTIVE'],
                },
            ])
        )

        console.log(`[DEBUG] Creating async report for ad account: ${adAccountId}`)
        console.log(`[DEBUG] Time range: ${request.timeRange.since} to ${request.timeRange.until}`)
        console.log(`[DEBUG] Level: ${request.level}`)
        console.log(`[DEBUG] Fields: ${request.fields.join(', ')}`)
        console.log(`[DEBUG] Request params: ${params.toString()}`)

        const response = await httpClient.post(`/${adAccountId}/insights`, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })

        console.log(`[DEBUG] Facebook createAsyncReport response headers: ${JSON.stringify(response.headers)}`)

        // Log the full response for debugging
        console.log('[DEBUG] Facebook createAsyncReport response:', JSON.stringify(response.data, null, 2))

        // Check for errors in the response
        if (response.data.error) {
            throw new Error(`Facebook API error: ${JSON.stringify(response.data.error)}`)
        }

        // Check if report_run_id exists
        if (!response.data.report_run_id) {
            throw new Error(`Facebook API returned invalid response: ${JSON.stringify(response.data)}`)
        }

        return {
            reportRunId: response.data.report_run_id,
            accountId: request.adAccountId,
        }
    } catch (error: any) {
        // handleError throws, so this will propagate the error
        return handleError('Failed to create async report', error)
    }
}

const pollReportStatus = async (accessToken: string, reportRunId: string): Promise<AsyncReportStatus> => {
    const maxAttempts = 60 // 10 minutes with 20 second intervals
    const pollIntervalMs = 20000 // 20 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await httpClient.get(`/${reportRunId}`, {
                params: {
                    access_token: accessToken,
                    fields: 'async_status,async_percent_completion,id',
                },
            })

            // Check for errors in the response
            if (response.data.error) {
                console.error(
                    `[ERROR] Facebook API error polling report ${reportRunId}:`,
                    JSON.stringify(response.data.error, null, 2)
                )
                return {
                    reportRunId,
                    asyncStatus: 'Job Failed',
                    asyncPercentCompletion: 0,
                }
            }

            const status: AsyncReportStatus = {
                reportRunId,
                asyncStatus: response.data.async_status,
                asyncPercentCompletion: response.data.async_percent_completion,
            }

            // Log progress every 10 attempts or on failure/completion
            if (attempt % 10 === 0 || status.asyncStatus === 'Job Completed' || status.asyncStatus === 'Job Failed') {
                console.log(
                    `[DEBUG] Report ${reportRunId} status (attempt ${attempt + 1}/${maxAttempts}):`,
                    JSON.stringify(response.data, null, 2)
                )
            }

            // If completed or failed, return immediately
            if (status.asyncStatus === 'Job Completed' || status.asyncStatus === 'Job Failed') {
                return status
            }

            // Wait before next poll
            if (attempt < maxAttempts - 1) {
                await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
            }
        } catch (error: any) {
            console.error(`[ERROR] Error polling report status (attempt ${attempt + 1}):`, error.message)
            if (attempt === maxAttempts - 1) {
                return handleError('Failed to poll report status', error)
            }
            // Continue polling on error
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
        }
    }

    // Timeout
    console.error(`[ERROR] Report ${reportRunId} timed out after ${maxAttempts} attempts`)
    return {
        reportRunId,
        asyncStatus: 'Job Failed',
    }
}

const getReportCSV = async (accessToken: string, reportRunId: string): Promise<CSVExportResult> => {
    try {
        console.log(`[DEBUG] Fetching CSV for report ${reportRunId}`)

        // Facebook async reports use a special export endpoint for CSV downloads
        const exportUrl = `https://www.facebook.com/ads/ads_insights/export_report`

        const csvUrl = `${exportUrl}?report_run_id=${reportRunId}&format=csv&locale=en_US&access_token=${accessToken}`

        console.log(`[DEBUG] CSV download URL (truncated for security)`)
        console.log(`[DEBUG] Report Run ID: ${reportRunId}`)

        // Download the CSV file to get the content and count records
        const csvResponse = await axios.get(csvUrl, {
            responseType: 'text',
            timeout: 300000, // 5 minute timeout for large CSV files
        })

        const csvContent = csvResponse.data as string
        const recordCount = csvContent.split('\n').length - 1 // Subtract header

        console.log(`[DEBUG] Downloaded CSV with ${recordCount} records`)

        // Store the URL without the access token for security
        // The access token will be added when the CSV processor downloads it
        const fileUrlWithoutToken = `${exportUrl}?report_run_id=${reportRunId}&format=csv&locale=en_US`

        return {
            reportRunId,
            fileUrl: fileUrlWithoutToken,
            completedAt: new Date(),
            recordCount,
        }
    } catch (error: any) {
        return handleError('Failed to get report CSV', error)
    }
}

export const adInsightsClient: IAdInsightsService = {
    createAsyncReport,
    pollReportStatus,
    getReportCSV,
}
