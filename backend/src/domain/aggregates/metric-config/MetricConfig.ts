/**
 * Entity: MetricConfig
 * Represents user-defined metric configuration values for a Facebook ad account
 * Manages custom numeric values (targets, thresholds, budgets) per ad account
 * Implemented using functional programming style following DDD principles
 */

// Configurable metrics constant - aligns with ADSET_INSIGHT_FIELDS
export const CONFIGURABLE_METRICS = [
    'impressions',
    'clicks',
    'spend',
    'cpm',
    'cpc',
    'ctr',
    'reach',
    'frequency',
    'linkCtr',
    'costPerInlineLinkClick',
    'costPerResult',
    'roas',
] as const

export type MetricFieldName = typeof CONFIGURABLE_METRICS[number]

export interface MetricConfig {
    readonly id?: string
    readonly adAccountId: string
    // 12 optional metric fields
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
    // Timestamps (undefined for default configs)
    readonly createdAt?: Date
    readonly updatedAt?: Date
}

// Pure functions that operate on MetricConfig data

/**
 * Create a new MetricConfig from user input
 */
export function createMetricConfig(props: MetricConfig): MetricConfig {
    const now = new Date()
    return {
        adAccountId: props.adAccountId,
        impressions: props.impressions,
        clicks: props.clicks,
        spend: props.spend,
        cpm: props.cpm,
        cpc: props.cpc,
        ctr: props.ctr,
        reach: props.reach,
        frequency: props.frequency,
        linkCtr: props.linkCtr,
        costPerInlineLinkClick: props.costPerInlineLinkClick,
        costPerResult: props.costPerResult,
        roas: props.roas,
        createdAt: now,
        updatedAt: now,
    }
}

/**
 * Create default MetricConfig with all metrics set to 0 (no timestamps)
 */
export function createDefaultMetricConfig(adAccountId: string): MetricConfig {
    return {
        adAccountId,
        impressions: 0,
        clicks: 0,
        spend: 0,
        cpm: 0,
        cpc: 0,
        ctr: 0,
        reach: 0,
        frequency: 0,
        linkCtr: 0,
        costPerInlineLinkClick: 0,
        costPerResult: 0,
        roas: 0,
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
 * MetricConfig Domain - Grouped collection of all MetricConfig-related functions
 * Following DDD principles with functional programming style
 */
export const MetricConfigDomain = {
    createMetricConfig,
    createDefaultMetricConfig,
    isValidMetricField,
    getConfigurableMetrics,
}
