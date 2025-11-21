/**
 * Domain Service: SuggestionAnalyzer
 * Encapsulates business logic for analyzing adset performance metrics
 * Pure domain logic without infrastructure dependencies
 */

import { AdAccountSetting, MetricFieldName, METRIC_FIELDS } from '../aggregates/ad-account-setting/AdAccountSetting'
import { ExceedingMetric } from '../aggregates/suggestion/Suggestion'

/**
 * Aggregated metrics structure for performance analysis
 * Represents calculated metrics from aggregated insight data
 */
export interface AggregatedMetrics {
    impressions: number
    clicks: number
    amountSpent: number
    cpm: number
    cpc: number
    ctr: number
    reach: number
    frequency: number
    inlineLinkCtr: number
    costPerInlineLinkClick: number
    purchaseRoas: number
}

/**
 * Compare aggregated metrics against thresholds
 * Returns list of metrics that exceed their configured thresholds
 */
export function findExceedingMetrics(
    aggregated: AggregatedMetrics,
    thresholds: AdAccountSetting
): ExceedingMetric[] {
    const exceedingMetrics: ExceedingMetric[] = []

    for (const metricName of METRIC_FIELDS) {
        const threshold = thresholds[metricName]
        const value = aggregated[metricName]

        // Skip if threshold not set or value is zero/undefined
        if (threshold === undefined || threshold === null || threshold === 0) {
            continue
        }

        if (value === undefined || value === null) {
            continue
        }

        // Check if metric exceeds threshold
        if (value > threshold) {
            exceedingMetrics.push({
                metricName: metricName as MetricFieldName,
                value,
            })
        }
    }

    return exceedingMetrics
}

/**
 * Validate if ad account setting has meaningful thresholds
 * Returns true if at least one threshold is set to a non-zero value
 */
export function hasValidThresholds(config: AdAccountSetting): boolean {
    return METRIC_FIELDS.some((metric) => {
        const value = config[metric]
        return value !== undefined && value !== null && value > 0
    })
}

/**
 * SuggestionAnalyzer Domain Service
 * Groups all suggestion analysis domain logic
 */
export const SuggestionAnalyzer = {
    findExceedingMetrics,
    hasValidThresholds,
}
