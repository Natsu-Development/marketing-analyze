/**
 * Value Object: TimeRange
 * Represents a time period for data synchronization
 * Immutable value object - intentionally minimal, use domain-specific time range logic where needed
 */

export interface TimeRange {
    readonly since: Date
    readonly until: Date
}

/**
 * Ad Insights Time Range (String format for API calls)
 * Used for Facebook API requests that expect YYYY-MM-DD string format
 * Single source of truth for time range definitions across all layers
 */
export interface AdInsightsTimeRange {
    since: string // YYYY-MM-DD format
    until: string // YYYY-MM-DD format
}
