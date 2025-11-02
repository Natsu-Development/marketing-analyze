/**
 * Types for Facebook Sync Insights Use Case
 */

import { AdInsightsTimeRange } from '../../../domain/value-objects/TimeRange'

export type TimeRange = AdInsightsTimeRange

export interface SyncResponse {
    success: boolean
    exportsCreated: number
    adAccountIds: string[]
    errors?: string[]
}
