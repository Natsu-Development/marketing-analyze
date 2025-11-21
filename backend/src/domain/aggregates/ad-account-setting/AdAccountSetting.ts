/**
 * Entity: AdAccountSetting
 * Represents ad account settings including metric thresholds and suggestion parameters
 * Manages custom numeric values (targets, thresholds, budgets) per ad account
 * Implemented using functional programming style following DDD principles
 */

// Configurable metrics constant - aligns with ADSET_INSIGHT_FIELDS
export const METRIC_FIELDS = [
    'cpm',
    'ctr',
    'frequency',
    'inlineLinkCtr',
    'costPerInlineLinkClick',
    'purchaseRoas',
    'purchases',
    'costPerPurchase',
] as const

// Cost metrics: lower is better (must be LESS THAN threshold)
export const COST_METRICS = [
    'cpm',
    'frequency',
    'costPerInlineLinkClick',
    'costPerPurchase',
] as const

// Performance metrics: higher is better (must be GREATER THAN threshold)
export const PERFORMANCE_METRICS = [
    'ctr',
    'inlineLinkCtr',
    'purchaseRoas',
    'purchases',
] as const

export const SUGGESTION_FIELDS = [
    'scalePercent',
    'initScaleDay',
    'note',
] as const

export type MetricFieldName = typeof METRIC_FIELDS[number]
export type SuggestionFieldName = typeof SUGGESTION_FIELDS[number]

export interface AdAccountSetting {
    readonly id?: string
    readonly adAccountId: string
    // Metric threshold fields
    readonly cpm?: number
    readonly ctr?: number
    readonly frequency?: number
    readonly inlineLinkCtr?: number
    readonly costPerInlineLinkClick?: number
    readonly purchaseRoas?: number
    readonly purchases?: number
    readonly costPerPurchase?: number
    // Suggestion parameters
    readonly scalePercent?: number
    readonly initScaleDay?: number // Minimum adset age (from startTime) before first budget scale
    readonly note?: string
    // Timestamps (undefined for default configs)
    readonly createdAt?: Date
    readonly updatedAt?: Date
}

// Pure functions that operate on AdAccountSetting data

/**
 * Create a new AdAccountSetting from user input
 */
export function createAdAccountSetting(props: AdAccountSetting): AdAccountSetting {
    const now = new Date()
    return {
        adAccountId: props.adAccountId,
        cpm: props.cpm,
        ctr: props.ctr,
        frequency: props.frequency,
        inlineLinkCtr: props.inlineLinkCtr,
        costPerInlineLinkClick: props.costPerInlineLinkClick,
        purchaseRoas: props.purchaseRoas,
        purchases: props.purchases,
        costPerPurchase: props.costPerPurchase,
        scalePercent: props.scalePercent,
        initScaleDay: props.initScaleDay,
        note: props.note,
        createdAt: now,
        updatedAt: now,
    }
}

/**
 * Create default AdAccountSetting with all metrics set to 0 (no timestamps)
 */
export function createDefaultAdAccountSetting(adAccountId: string): AdAccountSetting {
    return {
        adAccountId,
        cpm: 0,
        ctr: 0,
        frequency: 0,
        inlineLinkCtr: 0,
        costPerInlineLinkClick: 0,
        purchaseRoas: 0,
        purchases: 0,
        costPerPurchase: 0,
        scalePercent: 0,
        initScaleDay: 0, // Default: 0 days minimum age before first budget scale
        note: '',
        // No createdAt/updatedAt for default configs
    }
}

/**
 * Check if a metric field name is valid
 */
export function isValidSetting(fieldName: string): boolean {
    return METRIC_FIELDS.includes(fieldName as MetricFieldName) || SUGGESTION_FIELDS.includes(fieldName as SuggestionFieldName)
}

/**
 * Check if an adset meets initial scale threshold (first time scale)
 * Returns true if adset age (from startTime to now) >= initScaleDay AND never scaled before
 *
 * @param adsetAgeInDays - Age of the adset in days (can be null if no startTime)
 * @param lastScaledAt - Last time the adset was scaled (undefined if never scaled)
 * @param setting - Ad account setting containing the threshold
 * @returns boolean indicating if adset meets initial scale threshold
 */
export function meetsInitialScaleThreshold(
    adsetAgeInDays: number | null,
    lastScaledAt: Date | undefined,
    setting: AdAccountSetting
): boolean {
    // If already scaled before, not eligible for initial scale
    if (lastScaledAt !== undefined) {
        return false
    }

    // If adset has no age (no startTime), cannot meet threshold
    if (adsetAgeInDays === null) {
        return false
    }

    // If no threshold is set, cannot meet threshold
    if (setting.initScaleDay === undefined || setting.initScaleDay === null) {
        return false
    }

    return adsetAgeInDays >= setting.initScaleDay
}

/**
 * AdAccountSetting Domain - Grouped collection of all AdAccountSetting-related functions
 * Following DDD principles with functional programming style
 */
export const AdAccountSettingDomain = {
    createAdAccountSetting,
    createDefaultAdAccountSetting,
    isValidSetting,
    meetsInitialScaleThreshold,
}
