/**
 * Domain Service: CSV processing business logic
 * Handles CSV header normalization and validation
 */

import { AdSetInsight } from '../../domain/aggregates/adset-insights'

export interface CsvResult {
    insights: AdSetInsight[]
    processed: number
    errors: string[]
}

export interface CsvRecord {
    [key: string]: string | number | undefined
}

/**
 * Normalize CSV header names to internal format
 */
export function normalizeCsvHeader(header: string): string {
    if (!header) return ''
    return header
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/\(.*?\)/g, '')
        .replace(/_{2,}/g, '_')
        .replace(/_all$/i, '')
        .replace(/_vnd$/i, '')
        .replace(/^amount_spent_.*$/i, 'amount_spent')
        .replace(/^(3-second|3_second)_video_plays$/i, 'three_second_video_plays')
        .replace(/_$/, '')
        .trim()
}

/**
 * Validate CSV parsing results
 * Note: For streaming, validation is simplified since we process in batches
 */
export function validateCsvResult(result: CsvResult): {
    valid: boolean
    errors: string[]
} {
    const validationErrors: string[] = []

    if (result.insights.length === 0 && result.errors.length === 0) {
        validationErrors.push('No insights were processed and no errors reported')
    }

    if (result.errors.length > result.insights.length) {
        validationErrors.push('More errors than successful records - data quality issue suspected')
    }

    // Check for data consistency across insights
    if (result.insights.length > 0) {
        const adAccountIds = new Set(result.insights.map((i) => i.adAccountId))
        if (adAccountIds.size > 1) {
            validationErrors.push('Processed insights belong to multiple ad accounts')
        }
    }

    return {
        valid: validationErrors.length === 0,
        errors: validationErrors,
    }
}

/**
 * CSV Service - Domain logic for CSV processing
 */
export const CsvService = {
    normalizeCsvHeader,
    validateCsvResult,
}
