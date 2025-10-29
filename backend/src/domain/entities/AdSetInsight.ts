/**
 * Entity: AdSetInsight
 * Represents adset-level insight data from Facebook
 */

export interface AdSetInsight {
    readonly id?: string
    readonly adAccountId: string
    readonly accountId: string
    readonly accountName?: string
    readonly campaignId: string
    readonly campaignName?: string
    readonly adsetId: string
    readonly adsetName?: string
    readonly date: Date // Date from Facebook report for daily aggregation
    readonly impressions?: number
    readonly clicks?: number
    readonly spend?: number
    readonly cpm?: number
    readonly cpc?: number
    readonly ctr?: number
    readonly reach?: number
    readonly frequency?: number
    readonly linkCtr?: number
    readonly costPerInlineLinkClick?: number
    readonly costPerResult?: number
    readonly roas?: number
}

// Pure functions that operate on the data

// Create a new adset insight
export function createAdSetInsight(
    props: Partial<AdSetInsight> & Pick<AdSetInsight, 'adAccountId' | 'accountId' | 'campaignId' | 'adsetId' | 'date'>
): AdSetInsight {
    return {
        ...props,
    }
}

// Convert to JSON (for API responses)
export function adSetInsightToJSON(insight: AdSetInsight) {
    return {
        id: insight.id,
        adAccountId: insight.adAccountId,
        accountId: insight.accountId,
        accountName: insight.accountName,
        campaignId: insight.campaignId,
        campaignName: insight.campaignName,
        adsetId: insight.adsetId,
        adsetName: insight.adsetName,
        date: insight.date,
        impressions: insight.impressions,
        clicks: insight.clicks,
        spend: insight.spend,
        cpm: insight.cpm,
        cpc: insight.cpc,
        ctr: insight.ctr,
        reach: insight.reach,
        frequency: insight.frequency,
        linkCtr: insight.linkCtr,
        costPerInlineLinkClick: insight.costPerInlineLinkClick,
        costPerResult: insight.costPerResult,
        roas: insight.roas,
    }
}

/**
 * AdSetInsight Domain - Grouped collection of all AdSetInsight-related functions
 */
export const AdSetInsightDomain = {
    createAdSetInsight,
    adSetInsightToJSON,
}
