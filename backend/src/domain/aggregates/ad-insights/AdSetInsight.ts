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

// Facebook Marketing API fields for adset insights
export const ADSET_INSIGHT_FIELDS = [
    'account_id',
    'account_name',
    'campaign_id',
    'campaign_name',
    'adset_id',
    'adset_name',
    'date_start',
    'date_stop',
    'impressions',
    'clicks',
    'spend',
    'cpm',
    'cpc',
    'ctr',
    'reach',
    'frequency',
    'inline_link_clicks',
    'inline_link_click_ctr',
    'cost_per_inline_link_click',
    'cost_per_action_type',
    'purchase_roas',
] as const

/**
 * Normalize insight date from Facebook API format to Date object
 * Facebook provides date_start and date_stop, we use date_start as the primary date
 */
export function normalizeInsightDate(dateStr: string): Date {
    const date = new Date(dateStr)
    // Set to middle of the day for consistency
    date.setHours(12, 0, 0, 0)
    return date
}

/**
 * Map CSV record from Facebook async report to AdSetInsight properties
 * Transforms Facebook API field names to our domain entity properties
 */
export function mapRecordToAdSetInsight(
    record: Record<string, any>,
    adAccountId: string
): Partial<AdSetInsight> & Pick<AdSetInsight, 'adAccountId' | 'accountId' | 'campaignId' | 'adsetId' | 'date'> {
    const accountId = record.account_id || ''
    const campaignId = record.campaign_id || ''
    const adsetId = record.adset_id || ''
    const dateStr = record.date_start || record.date_stop || ''

    if (!accountId || !campaignId || !adsetId || !dateStr) {
        throw new Error(
            `Missing required fields in CSV record: account_id=${accountId}, campaign_id=${campaignId}, adset_id=${adsetId}, date=${dateStr}`
        )
    }

    return {
        adAccountId,
        accountId,
        accountName: record.account_name,
        campaignId,
        campaignName: record.campaign_name,
        adsetId,
        adsetName: record.adset_name,
        date: normalizeInsightDate(dateStr),
        impressions: parseNumeric(record.impressions),
        clicks: parseNumeric(record.clicks),
        spend: parseNumeric(record.spend),
        cpm: parseNumeric(record.cpm),
        cpc: parseNumeric(record.cpc),
        ctr: parseNumeric(record.ctr),
        reach: parseNumeric(record.reach),
        frequency: parseNumeric(record.frequency),
        linkCtr: parseNumeric(record.inline_link_click_ctr),
        costPerInlineLinkClick: parseNumeric(record.cost_per_inline_link_click),
        costPerResult: parseNumeric(extractCostPerResult(record)),
        roas: parseNumeric(record.purchase_roas),
    }
}

/**
 * Parse numeric values from CSV strings, handling various formats
 */
function parseNumeric(value: any): number | undefined {
    if (value === null || value === undefined || value === '') {
        return undefined
    }

    const num = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : Number(value)
    return isNaN(num) ? undefined : num
}

/**
 * Extract cost per result from cost_per_action_type array
 * Facebook returns cost_per_action_type as an array of objects with action_type and value
 */
function extractCostPerResult(record: Record<string, any>): number | undefined {
    const costPerActionType = record.cost_per_action_type
    if (!Array.isArray(costPerActionType)) {
        return undefined
    }

    // Look for purchase action type
    const purchaseAction = costPerActionType.find(
        (action: any) => action.action_type === 'purchase' || action.action_type === 'offsite_conversion.custom'
    )

    return purchaseAction ? parseNumeric(purchaseAction.value) : undefined
}

/**
 * AdSetInsight Domain - Grouped collection of all AdSetInsight-related functions
 */
export const AdSetInsightDomain = {
    createAdSetInsight,
    normalizeInsightDate,
    mapRecordToAdSetInsight,
    ADSET_INSIGHT_FIELDS,
}
