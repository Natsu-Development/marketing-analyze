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
    readonly impressions?: number
    readonly clicks?: number
    readonly amountSpent?: number
    readonly cpm?: number
    readonly cpc?: number
    readonly ctr?: number
    readonly reach?: number
    readonly frequency?: number
    readonly inlineLinkCtr?: number
    readonly costPerInlineLinkClick?: number
    readonly purchaseRoas?: number
    readonly postComments?: number
    readonly costPerResult?: number
    readonly purchases?: number
    readonly totalMessagingContacts?: number
    readonly purchasesConversionValue?: number
    // Calculated fields
    readonly costPerPurchase?: number
    readonly costPerInteract?: number
    readonly costDivideRevenue?: number
}

// Pure functions that operate on the data

// Create a new adset insight
export function createAdSetInsight(
    props: Partial<AdSetInsight> & Pick<AdSetInsight, 'adAccountId' | 'accountId' | 'campaignId' | 'adsetId'>
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
    'impressions',
    'clicks',
    'spend',
    'cpm',
    'cpc',
    'ctr',
    'reach',
    'frequency',
    'inline_link_click_ctr',
    'cost_per_inline_link_click',
    'purchase_roas',    
    'actions',
    'action_values',
    'cost_per_result'
] as const

/**
 * Map CSV record from Facebook async report to AdSetInsight properties
 * Transforms Facebook API field names to our domain entity properties
 */
export function mapRecordToAdSetInsight(
    record: Record<string, any>,
    adAccountId: string
): Partial<AdSetInsight> & Pick<AdSetInsight, 'adAccountId' | 'accountId' | 'campaignId' | 'adsetId'> {
    const accountId = record.account_id || ''
    const campaignId = record.campaign_id || ''
    const adsetId = record.ad_set_id || ''

    if (!accountId || !campaignId || !adsetId) {
        throw new Error(
            `Missing required fields in CSV record: account_id=${accountId}, campaign_id=${campaignId}, adset_id=${adsetId}`
        )
    }

    // Parse base metric fields
    const amountSpent = parseNumeric(record.amount_spent)
    const purchases = parseNumeric(record.purchases)
    const postComments = parseNumeric(record.post_comments)
    const totalMessagingContacts = parseNumeric(record.total_messaging_contacts)
    const purchasesConversionValue = parseNumeric(record.purchases_conversion_value)

    // Calculate derived fields
    const costPerPurchase = amountSpent && purchases && purchases > 0 ? amountSpent / purchases : undefined
    const costPerInteract =
        amountSpent && (postComments && postComments > 0 || totalMessagingContacts && totalMessagingContacts > 0)
            ? amountSpent / ((postComments || 0) + (totalMessagingContacts || 0))
            : undefined
    const costDivideRevenue =
        amountSpent && purchasesConversionValue && purchasesConversionValue > 0
            ? amountSpent / purchasesConversionValue
            : undefined

    return {
        adAccountId,
        accountId,
        accountName: record.account_name,
        campaignId,
        campaignName: record.campaign_name,
        adsetId,
        adsetName: record.ad_set_name,
        impressions: parseNumeric(record.impressions),
        clicks: parseNumeric(record.clicks),
        amountSpent,
        cpm: parseNumeric(record.cpm),
        cpc: parseNumeric(record.cpc),
        ctr: parseNumeric(record.ctr),
        reach: parseNumeric(record.reach),
        frequency: parseNumeric(record.frequency),
        inlineLinkCtr: parseNumeric(record.inline_link_ctr),
        costPerInlineLinkClick: parseNumeric(record.cost_per_inline_link_click),
        purchaseRoas: parseNumeric(record.purchase_roas),
        postComments,
        costPerResult: parseNumeric(record.cost_per_results),
        purchases,
        totalMessagingContacts,
        purchasesConversionValue,
        // Calculated fields
        costPerPurchase,
        costPerInteract,
        costDivideRevenue,
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
 * AdSetInsight Domain - Grouped collection of all AdSetInsight-related functions
 */
export const AdSetInsightDomain = {
    createAdSetInsight,
    mapRecordToAdSetInsight,
    ADSET_INSIGHT_FIELDS,
}
