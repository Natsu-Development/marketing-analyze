/**
 * Domain Service: CSV processing business logic
 * Handles CSV parsing, validation, and transformation into domain entities
 */

import { parse } from 'csv-parse/sync'
import { AdSetInsight, AdSetInsightDomain } from '../../domain/aggregates/ad-insights'

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
 * Parse CSV content into domain insights
 */
export function parseCsvToInsights(csvContent: string, adAccountId: string): CsvResult {
    const errors: string[] = []

    try {
        // Parse CSV with column normalization
        const rawRecords: CsvRecord[] = parse(csvContent, {
            columns: (rawHeader: string[]) => {
                return rawHeader.map(normalizeCsvHeader)
            },
            skip_empty_lines: true,
            trim: true,
        })

        if (rawRecords.length === 0) {
            return {
                insights: [],
                processed: 0,
                errors: ['CSV contains no data records'],
            }
        }

        // Transform records to domain entities
        const insights: AdSetInsight[] = []

        for (let i = 0; i < rawRecords.length; i++) {
            try {
                const record = rawRecords[i]

                // Map CSV record to domain entity using domain mapper
                const mappedProps = AdSetInsightDomain.mapRecordToAdSetInsight(record, adAccountId)
                const insight = AdSetInsightDomain.createAdSetInsight(mappedProps)
                insights.push(insight)
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                errors.push(`Record ${i}: ${message}`)
            }
        }

        return {
            insights,
            processed: insights.length,
            errors,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            insights: [],
            processed: 0,
            errors: [`Failed to parse CSV: ${message}`],
        }
    }
}

/**
 * Validate CSV parsing results
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

        // Check date range consistency
        const dates = result.insights.map((i) => i.date.getTime()).sort()
        const dateRange = dates[dates.length - 1] - dates[0]
        const maxExpectedRange = 90 * 24 * 60 * 60 * 1000 // 90 days in ms
        if (dateRange > maxExpectedRange) {
            validationErrors.push('Date range exceeds expected maximum (90 days)')
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
    parseCsvToInsights,
    validateCsvResult,
}
