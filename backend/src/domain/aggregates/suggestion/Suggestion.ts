/**
 * Entity: Suggestion
 * Represents automated adset performance suggestion based on metric threshold analysis
 * Stores only metrics that exceeded thresholds with their calculated values
 * Implemented using functional programming style following DDD principles
 */

import { CONFIGURABLE_METRICS, MetricFieldName } from '../metric-config/MetricConfig'

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
    readonly adsetId: string
    readonly adsetName: string
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
 * Create a new Suggestion entity with default values
 * Pure function that creates suggestion from provided data
 */
export function createSuggestion(props: {
    adAccountId: string
    adsetId: string
    adsetName: string
    metrics: ReadonlyArray<ExceedingMetric>
}): Suggestion {
    const now = new Date()

    // Validate all metric names
    for (const metric of props.metrics) {
        if (!isValidMetricName(metric.metricName)) {
            throw new Error(`Invalid metric name: ${metric.metricName}`)
        }
    }

    return {
        adAccountId: props.adAccountId,
        adsetId: props.adsetId,
        adsetName: props.adsetName,
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
