/**
 * Entity: Suggestion
 * Represents automated adset performance suggestion based on metric threshold analysis
 * Stores only metrics that exceeded thresholds with their calculated values
 * Implemented using functional programming style following DDD principles
 */

import { CONFIGURABLE_METRICS, MetricFieldName } from '../ad-account-setting/AdAccountSetting'

/**
 * Exceeding metric data structure
 * Stores metric name and its calculated value that exceeded threshold
 */
export interface ExceedingMetric {
    readonly metricName: MetricFieldName
    readonly value: number
}

/**
 * Suggestion status lifecycle states
 */
export type SuggestionStatus = 'pending' | 'rejected' | 'applied'

/**
 * Suggestion aggregate entity
 */
export interface Suggestion {
    readonly id?: string
    readonly adAccountId: string
    readonly adAccountName: string
    readonly campaignName: string
    readonly adsetId: string
    readonly adsetName: string
    readonly adsetLink: string
    readonly dailyBudget: number
    readonly scalePercent?: number
    readonly note?: string
    readonly metrics: ReadonlyArray<ExceedingMetric>
    readonly metricsExceededCount: number
    readonly status: SuggestionStatus
    readonly createdAt: Date
    readonly updatedAt: Date
}

/**
 * Validate suggestion status value
 */
function isValidStatus(status: string): status is SuggestionStatus {
    return status === 'pending' || status === 'rejected' || status === 'applied'
}

/**
 * Validate metric name
 */
function isValidMetricName(metricName: string): metricName is MetricFieldName {
    return CONFIGURABLE_METRICS.includes(metricName as MetricFieldName)
}

/**
 * Generate Facebook Ads Manager link for adset
 */
function generateAdsetLink(adAccountId: string, adsetId: string): string {
    return `https://business.facebook.com/adsmanager/manage/adsets?act=${adAccountId}&selected_adset_ids=${adsetId}`
}

/**
 * Create a new Suggestion entity with default values
 * Pure function that creates suggestion from provided data
 */
export function createSuggestion(props: {
    adAccountId: string
    adAccountName: string
    campaignName: string
    adsetId: string
    adsetName: string
    dailyBudget: number
    scalePercent?: number
    note?: string
    metrics: ReadonlyArray<ExceedingMetric>
}): Suggestion {
    const now = new Date()

    // Validate all metric names
    for (const metric of props.metrics) {
        if (!isValidMetricName(metric.metricName)) {
            throw new Error(`Invalid metric name: ${metric.metricName}`)
        }
    }

    // Validate daily budget
    if (props.dailyBudget <= 0) {
        throw new Error('Daily budget must be greater than 0')
    }

    return {
        adAccountId: props.adAccountId,
        adAccountName: props.adAccountName,
        campaignName: props.campaignName,
        adsetId: props.adsetId,
        adsetName: props.adsetName,
        adsetLink: generateAdsetLink(props.adAccountId, props.adsetId),
        dailyBudget: props.dailyBudget,
        scalePercent: props.scalePercent,
        note: props.note,
        metrics: props.metrics,
        metricsExceededCount: props.metrics.length,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    }
}

/**
 * Update suggestion status with valid transition
 * Returns new suggestion instance with updated status and timestamp
 * Ensures immutability by creating new instance
 */
export function updateSuggestionStatus(suggestion: Suggestion, newStatus: SuggestionStatus): Suggestion {
    if (!isValidStatus(newStatus)) {
        throw new Error(`Invalid suggestion status: ${newStatus}`)
    }

    return {
        ...suggestion,
        status: newStatus,
        updatedAt: new Date(),
    }
}

/**
 * Suggestion Domain - Grouped collection of all Suggestion-related functions
 * Following DDD principles with functional programming style
 */
export const SuggestionDomain = {
    createSuggestion,
    updateSuggestionStatus,
}
