/**
 * Domain Service: Account Management
 * Contains business logic for account management, OAuth flows, and token handling
 * Uses functional programming style with pure functions
 */
import { AdInsightsTimeRange } from '../value-objects/TimeRange'

/**
 * Validate export time range
 * Domain logic: business rules for valid time ranges
 */
export function validateTimeRange(timeRange: AdInsightsTimeRange): {
    valid: boolean
    errors: string[]
} {
    const errors: string[] = []

    const sinceDate = new Date(timeRange.since)
    const untilDate = new Date(timeRange.until)

    if (isNaN(sinceDate.getTime())) {
        errors.push('Invalid since date format')
    }

    if (isNaN(untilDate.getTime())) {
        errors.push('Invalid until date format')
    }

    if (sinceDate > untilDate) {
        errors.push('Since date must be before until date')
    }

    // Check maximum range (business rule: max 90 days)
    const maxRangeMs = 90 * 24 * 60 * 60 * 1000 // 90 days
    if (untilDate.getTime() - sinceDate.getTime() > maxRangeMs) {
        errors.push('Time range cannot exceed 90 days')
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Account Management Domain Service - Functional approach
 * Provides a clean, organized namespace for all account management operations
 */
export const AccountService = {
    validateTimeRange,
}
