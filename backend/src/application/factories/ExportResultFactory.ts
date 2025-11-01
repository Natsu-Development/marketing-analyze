/**
 * Factory: ExportResultFactory
 * Responsible for creating ExportResult entities from various sources
 * Factories encapsulate complex creation logic and ensure invariants
 */

import { ExportResult, ExportResultDomain } from '../entities/ExportResult'
import { AdInsightsTimeRange } from '../../domain/value-objects/TimeRange'

/**
 * Create export result for ad insights export
 * Factory method that handles the business logic of creating export results
 * from ad insights processing results
 */
export function createExportResultForAdInsights(
    adAccountId: string,
    reportRunId: string,
    fileUrl: string,
    recordCount: number,
    timeRange: AdInsightsTimeRange,
    completedAt?: Date
): ExportResult {
    try {
        return ExportResultDomain.createExportResult({
            adAccountId,
            reportRunId,
            fileUrl,
            recordCount,
            timeRange: {
                since: timeRange.since,
                until: timeRange.until,
            },
            status: completedAt ? 'completed' : 'pending',
            completedAt,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to create export result for ad insights: ${message}`)
    }
}

/**
 * ExportResult Factory - Grouped collection of all ExportResult factory methods
 */
export const ExportResultFactory = {
    createExportResultForAdInsights,
}
