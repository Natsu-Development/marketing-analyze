/**
 * Entity: AdAccountSetting
 * Represents ad account settings including metric thresholds and suggestion parameters
 * Manages custom numeric values (targets, thresholds, budgets) per ad account
 * Implemented using functional programming style following DDD principles
 */

// Configurable metrics constant - aligns with ADSET_INSIGHT_FIELDS
export const CONFIGURABLE_METRICS = [
    'cpm',
    'ctr',
    'frequency',
    'inlineLinkCtr',
    'costPerInlineLinkClick',
    'purchaseRoas',
] as const

export type MetricFieldName = typeof CONFIGURABLE_METRICS[number]

export interface AdAccountSetting {
    readonly id?: string
    readonly adAccountId: string
    // 6 optional metric threshold fields
    readonly cpm?: number
    readonly ctr?: number
    readonly frequency?: number
    readonly inlineLinkCtr?: number
    readonly costPerInlineLinkClick?: number
    readonly purchaseRoas?: number
    // Suggestion parameters
    readonly scalePercent?: number
    readonly initScaleDay?: number // Minimum adset age (from startTime) before first budget scale
    readonly recurScaleDay?: number // Days since last scale (from lastScaledAt) before recurring scale
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
        scalePercent: props.scalePercent,
        initScaleDay: props.initScaleDay,
        recurScaleDay: props.recurScaleDay,
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
        scalePercent: 0,
        initScaleDay: 0, // Default: 0 days minimum age before first budget scale
        recurScaleDay: 0, // Default: 0 days between recurring budget scales
        note: '',
        // No createdAt/updatedAt for default configs
    }
}

/**
 * Check if a metric field name is valid
 */
export function isValidMetricField(fieldName: string): boolean {
    return CONFIGURABLE_METRICS.includes(fieldName as MetricFieldName)
}

/**
 * Get all configurable metric names
 */
export function getConfigurableMetrics(): readonly string[] {
    return CONFIGURABLE_METRICS
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
 * Check if an adset meets recurring scale threshold (subsequent scales)
 * Returns true if days since last scale (from lastScaledAt to now) >= recurScaleDay
 *
 * @param lastScaledAt - Last time the adset was scaled (undefined if never scaled)
 * @param setting - Ad account setting containing the threshold
 * @returns boolean indicating if adset meets recurring scale threshold
 */
export function meetsRecurringScaleThreshold(
    lastScaledAt: Date | undefined,
    setting: AdAccountSetting
): boolean {
    // If never scaled before, not eligible for recurring scale
    if (lastScaledAt === undefined) {
        return false
    }

    // If no threshold is set, cannot meet threshold
    if (setting.recurScaleDay === undefined || setting.recurScaleDay === null) {
        return false
    }

    // Calculate days since last scale
    const now = new Date()
    const daysSinceLastScale = (now.getTime() - lastScaledAt.getTime()) / (1000 * 60 * 60 * 24)

    return daysSinceLastScale >= setting.recurScaleDay
}

/**
 * AdAccountSetting Domain - Grouped collection of all AdAccountSetting-related functions
 * Following DDD principles with functional programming style
 */
export const AdAccountSettingDomain = {
    createAdAccountSetting,
    createDefaultAdAccountSetting,
    isValidMetricField,
    getConfigurableMetrics,
    meetsInitialScaleThreshold,
    meetsRecurringScaleThreshold,
}
