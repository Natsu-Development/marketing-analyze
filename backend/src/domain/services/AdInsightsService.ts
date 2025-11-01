/**
 * Domain Service: Ad Insights Validation and Business Rules
 * Contains business logic for ad insights data validation and calculations
 * Uses functional programming style with pure functions
 */

import { AdSetInsight } from '../aggregates/ad-insights'

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

// Domain constant: Business rule for maximum date range
export const MAX_DATE_RANGE_DAYS = 90

/**
 * Validate ad insights data integrity (Business Rules)
 * Domain rules:
 * - Must have at least one insight
 * - All insights must belong to the same ad account
 * - Date range must not exceed 90 days
 * - At least some performance data must be present
 */
export function validateAdInsightsData(insights: AdSetInsight[]): AdInsightsValidationResult {
    const errors: string[] = []

    if (insights.length === 0) {
        errors.push('No ad insights data to process')
        return { isValid: false, errors }
    }

    // Business rule: All insights must belong to the same ad account
    const adAccountIds = new Set(insights.map((i) => i.adAccountId))
    if (adAccountIds.size > 1) {
        errors.push('All insights must belong to the same ad account')
    }

    // Business rule: Date range must be reasonable (max 90 days)
    const dates = insights.map((i) => i.date.getTime()).sort()
    const dateRange = dates[dates.length - 1] - dates[0]
    const maxExpectedRange = MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000
    if (dateRange > maxExpectedRange) {
        errors.push(`Date range exceeds expected maximum (${MAX_DATE_RANGE_DAYS} days)`)
    }

    // Business rule: Must have some performance data
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
 * Calculate aggregate metrics for ad insights (Business Logic)
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
