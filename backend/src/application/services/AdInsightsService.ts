/**
 * Application Service: Ad Insights
 * Contains business logic for processing ad insights data
 * Uses functional programming style with pure functions
 */

import { Account } from '../../domain'
import { AdSetInsight } from '../entities/AdSetInsight'
import { AdInsightsTimeRange } from '../../domain/value-objects/TimeRange'

export interface ExportAdInsightsCommand {
    account: Account
    adAccountId: string
    timeRange: AdInsightsTimeRange
}

export interface AdInsightsValidationResult {
    isValid: boolean
    errors: string[]
}

export interface AggregateMetrics {
    total: {
        impressions: number
        clicks: number
        spend: number
        reach: number
    }
    average: {
        ctr: number
        cpm: number
        cpc: number
    }
    count: number
    dateRange: {
        start: Date
        end: Date
    }
}

/**
 * Validate ad insights data integrity
 */
export function validateAdInsightsData(insights: AdSetInsight[]): AdInsightsValidationResult {
    const errors: string[] = []

    if (insights.length === 0) {
        errors.push('No ad insights data to process')
        return { isValid: false, errors }
    }

    // Check for data consistency
    const adAccountIds = new Set(insights.map((i) => i.adAccountId))
    if (adAccountIds.size > 1) {
        errors.push('All insights must belong to the same ad account')
    }

    // Check date ranges are reasonable
    const dates = insights.map((i) => i.date.getTime()).sort()
    const dateRange = dates[dates.length - 1] - dates[0]
    const maxExpectedRange = 90 * 24 * 60 * 60 * 1000 // 90 days in ms
    if (dateRange > maxExpectedRange) {
        errors.push('Date range exceeds expected maximum (90 days)')
    }

    // Check for required fields
    const missingData = insights.filter((i) => !i.impressions && !i.clicks && !i.spend && !i.reach)
    if (missingData.length > 0) {
        errors.push(`${missingData.length} insights have no performance data`)
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Calculate aggregate metrics for ad insights
 */
export function calculateAggregateMetrics(insights: AdSetInsight[]): AggregateMetrics {
    const total = insights.reduce(
        (acc, insight) => ({
            impressions: acc.impressions + (insight.impressions || 0),
            clicks: acc.clicks + (insight.clicks || 0),
            spend: acc.spend + (insight.spend || 0),
            reach: acc.reach + (insight.reach || 0),
        }),
        { impressions: 0, clicks: 0, spend: 0, reach: 0 }
    )

    const avg = {
        ctr: total.clicks / total.impressions,
        cpm: (total.spend / total.impressions) * 1000,
        cpc: total.spend / total.clicks,
    }

    return {
        total,
        average: {
            ctr: isNaN(avg.ctr) ? 0 : avg.ctr,
            cpm: isNaN(avg.cpm) ? 0 : avg.cpm,
            cpc: isNaN(avg.cpc) ? 0 : avg.cpc,
        },
        count: insights.length,
        dateRange: {
            start: new Date(Math.min(...insights.map((i) => i.date.getTime()))),
            end: new Date(Math.max(...insights.map((i) => i.date.getTime()))),
        },
    }
}

/**
 * Ad Insights Domain Service - Functional approach
 * Provides a clean, organized namespace for all ad insights operations
 */
export const AdInsightsService = {
    validateAdInsightsData,
    calculateAggregateMetrics,
}
