/**
 * Domain Service: SuggestionAnalyzer
 * Encapsulates business logic for analyzing adset performance metrics
 * Pure domain logic without infrastructure dependencies
 */

import { AdAccountSetting, MetricFieldName, CONFIGURABLE_METRICS } from '../aggregates/ad-account-setting/AdAccountSetting'
import { ExceedingMetric } from '../aggregates/suggestion/Suggestion'
import { AdSetInsight } from '../aggregates/adset-insights/AdSetInsight'

/**
 * Aggregated metrics structure for performance analysis
 * Represents calculated metrics from historical insight data
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
 * Aggregate performance metrics from daily insight data
 * Simple summation since Facebook provides daily breakdown
 * KISS principle: just sum all fields
 */
export function aggregateInsightMetrics(insights: readonly AdSetInsight[]): AggregatedMetrics | null {
    if (insights.length === 0) {
        return null
    }

    // Initialize aggregators
    let totalImpressions = 0
    let totalClicks = 0
    let totalAmountSpent = 0
    let totalCpm = 0
    let totalCpc = 0
    let totalCtr = 0
    let totalReach = 0
    let totalFrequency = 0
    let totalInlineLinkCtr = 0
    let totalCostPerInlineLinkClick = 0
    let totalPurchaseRoas = 0

    // Sum all metrics from daily insights
    for (const insight of insights) {
        totalImpressions += insight.impressions || 0
        totalClicks += insight.clicks || 0
        totalAmountSpent += insight.amountSpent || 0
        totalCpm += insight.cpm || 0
        totalCpc += insight.cpc || 0
        totalCtr += insight.ctr || 0
        totalReach += insight.reach || 0
        totalFrequency += insight.frequency || 0
        totalInlineLinkCtr += insight.inlineLinkCtr || 0
        totalCostPerInlineLinkClick += insight.costPerInlineLinkClick || 0
        totalPurchaseRoas += insight.purchaseRoas || 0
    }

    return {
        impressions: totalImpressions,
        clicks: totalClicks,
        amountSpent: totalAmountSpent,
        cpm: totalCpm,
        cpc: totalCpc,
        ctr: totalCtr,
        reach: totalReach,
        frequency: totalFrequency,
        inlineLinkCtr: totalInlineLinkCtr,
        costPerInlineLinkClick: totalCostPerInlineLinkClick,
        purchaseRoas: totalPurchaseRoas,
    }
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

    for (const metricName of CONFIGURABLE_METRICS) {
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
    return CONFIGURABLE_METRICS.some((metric) => {
        const value = config[metric]
        return value !== undefined && value !== null && value > 0
    })
}

/**
 * SuggestionAnalyzer Domain Service
 * Groups all suggestion analysis domain logic
 */
export const SuggestionAnalyzer = {
    aggregateInsightMetrics,
    findExceedingMetrics,
    hasValidThresholds,
}
