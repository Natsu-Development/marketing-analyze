/**
 * Domain Service: SuggestionAnalyzer
 * Encapsulates business logic for analyzing adset performance metrics
 * Pure domain logic without infrastructure dependencies
 */

import { AdAccountSetting, MetricFieldName, METRIC_FIELDS, COST_METRICS, PERFORMANCE_METRICS } from '../aggregates/ad-account-setting/AdAccountSetting'
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
    purchases: number
    costPerPurchase: number
}

/**
 * Compare aggregated metrics against thresholds using KISS principle
 *
 * Cost metrics (cpm, frequency, costPerInlineLinkClick, costPerPurchase):
 *   - Lower is better → must be LESS THAN threshold to qualify
 *
 * Performance metrics (ctr, inlineLinkCtr, purchaseRoas, purchases):
 *   - Higher is better → must be GREATER THAN threshold to qualify
 *
 * ALL configured conditions must be met to create a suggestion
 *
 * Returns:
 *   - qualifyingMetrics: array of metrics that meet their conditions (for display)
 *   - allConditionsMet: true if ALL configured thresholds are satisfied
 */
export function findQualifyingMetrics(
    aggregated: AggregatedMetrics,
    thresholds: AdAccountSetting
): { qualifyingMetrics: ExceedingMetric[]; allConditionsMet: boolean } {
    const qualifyingMetrics: ExceedingMetric[] = []
    let configuredConditions = 0
    let metConditions = 0

    for (const metricName of METRIC_FIELDS) {
        const threshold = thresholds[metricName]
        const value = aggregated[metricName]

        // Skip if threshold not configured (0, undefined, or null means not configured)
        if (threshold === undefined || threshold === null || threshold === 0) {
            continue
        }

        configuredConditions++

        // Skip if value is missing
        if (value === undefined || value === null) {
            continue
        }

        const isCostMetric = COST_METRICS.includes(metricName as any)
        const isPerformanceMetric = PERFORMANCE_METRICS.includes(metricName as any)

        let meetsCondition = false

        if (isCostMetric) {
            // Cost metrics: value must be LESS THAN threshold (lower cost is better)
            meetsCondition = value < threshold
        } else if (isPerformanceMetric) {
            // Performance metrics: value must be GREATER THAN threshold (higher performance is better)
            meetsCondition = value > threshold
        }

        if (meetsCondition) {
            metConditions++
            qualifyingMetrics.push({
                metricName: metricName as MetricFieldName,
                value,
            })
        }
    }

    // ALL configured conditions must be met
    const allConditionsMet = configuredConditions > 0 && metConditions === configuredConditions

    return { qualifyingMetrics, allConditionsMet }
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
    findQualifyingMetrics,
    hasValidThresholds,
}
