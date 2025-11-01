/**
 * Types for Sync Ad Insights Use Case
 */

import { AdInsightsTimeRange } from '../../../domain/value-objects/TimeRange'

export type { AdInsightsTimeRange }

export interface AdInsightExportRequest {
    timeRange: AdInsightsTimeRange
}

export interface AdInsightExportResponse {
    success: boolean
    exportsCreated: number
    adAccountIds: string[]
    errors?: string[]
}
