/**
 * Factory: AdSetInsightFactory
 * Responsible for creating AdSetInsight entities from various sources
 * Factories encapsulate complex creation logic and ensure invariants
 */

import { AdSetInsight, AdSetInsightDomain, mapRecordToAdSetInsight } from '../entities/AdSetInsight'

export interface FacebookAdsInsightRecord {
    account_id?: string
    account_name?: string
    campaign_id?: string
    campaign_name?: string
    adset_id?: string
    adset_name?: string
    date_start?: string
    date_stop?: string
    impressions?: string | number
    clicks?: string | number
    spend?: string | number
    cpm?: string | number
    cpc?: string | number
    ctr?: string | number
    reach?: string | number
    frequency?: string | number
    inline_link_clicks?: string | number
    inline_link_click_ctr?: string | number
    cost_per_inline_link_click?: string | number
    cost_per_action_type?: any[]
    purchase_roas?: string | number
    [key: string]: any
}

/**
 * Create AdSetInsight from Facebook API CSV record
 */
export function createAdSetInsightFromFacebookCsvRecord(
    record: FacebookAdsInsightRecord,
    adAccountId: string
): AdSetInsight {
    try {
        const mappedData = mapRecordToAdSetInsight(record, adAccountId)
        return AdSetInsightDomain.createAdSetInsight(mappedData)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to create AdSetInsight from CSV record: ${message}`)
    }
}

/**
 * Create multiple AdSetInsights from Facebook API CSV records
 */
export function createAdSetInsightsFromFacebookCsvRecords(
    records: FacebookAdsInsightRecord[],
    adAccountId: string
): AdSetInsight[] {
    const insights: AdSetInsight[] = []
    const errors: string[] = []

    for (let i = 0; i < records.length; i++) {
        try {
            const insight = createAdSetInsightFromFacebookCsvRecord(records[i], adAccountId)
            insights.push(insight)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            errors.push(`Record ${i}: ${message}`)
        }
    }

    if (errors.length > 0) {
        throw new Error(
            `Failed to create ${errors.length} AdSetInsights: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`
        )
    }

    return insights
}

/**
 * Create AdSetInsight from raw data (for testing or manual creation)
 */
export function createAdSetInsightFromRawData(data: {
    adAccountId: string
    accountId: string
    campaignId: string
    adsetId: string
    date: Date
    accountName?: string
    campaignName?: string
    adsetName?: string
    impressions?: number
    clicks?: number
    spend?: number
    cpm?: number
    cpc?: number
    ctr?: number
    reach?: number
    frequency?: number
    linkCtr?: number
    costPerInlineLinkClick?: number
    costPerResult?: number
    roas?: number
}): AdSetInsight {
    return AdSetInsightDomain.createAdSetInsight(data)
}


/**
 * AdSetInsightFactory Domain - Grouped collection of all AdSetInsight factory functions
 */
export const AdSetInsightFactory = {
    createAdSetInsightFromFacebookCsvRecord,
    createAdSetInsightsFromFacebookCsvRecords,
    createAdSetInsightFromRawData,
}
