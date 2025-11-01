/**
 * Shared types for Ad Insights operations
 * Used across domain services and application services
 */

export interface AdInsightsTimeRange {
    since: string // YYYY-MM-DD format
    until: string // YYYY-MM-DD format
}
