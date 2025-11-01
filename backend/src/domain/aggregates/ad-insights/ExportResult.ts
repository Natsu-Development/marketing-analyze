/**
 * Entity: ExportResult
 * Represents a completed ad insights export
 */

export interface ExportResult {
    readonly id?: string
    readonly adAccountId: string
    readonly reportRunId: string
    readonly fileUrl: string
    readonly recordCount: number
    readonly timeRange: {
        since: string
        until: string
    }
    readonly status: 'pending' | 'completed' | 'failed'
    readonly error?: string
    readonly createdAt: Date
    readonly completedAt?: Date
}

// Pure functions that operate on the data

// Create a new export result
export function createExportResult(
    props: Partial<ExportResult> &
        Pick<ExportResult, 'adAccountId' | 'reportRunId' | 'fileUrl' | 'recordCount' | 'timeRange' | 'status'>
): ExportResult {
    const now = new Date()
    return {
        ...props,
        createdAt: props.createdAt || now,
        completedAt: props.completedAt,
    }
}

// Mark export as completed
export function markExportAsCompleted(exportResult: ExportResult): ExportResult {
    return {
        ...exportResult,
        status: 'completed',
        completedAt: new Date(),
    }
}

// Mark export as failed
export function markExportAsFailed(exportResult: ExportResult, error: string): ExportResult {
    return {
        ...exportResult,
        status: 'failed',
        error,
        completedAt: new Date(),
    }
}

// Convert to JSON (for API responses)
export function exportResultToJSON(exportResult: ExportResult) {
    return {
        id: exportResult.id,
        adAccountId: exportResult.adAccountId,
        reportRunId: exportResult.reportRunId,
        fileUrl: exportResult.fileUrl,
        recordCount: exportResult.recordCount,
        timeRange: exportResult.timeRange,
        status: exportResult.status,
        error: exportResult.error,
        createdAt: exportResult.createdAt,
        completedAt: exportResult.completedAt,
    }
}

/**
 * ExportResult Domain - Grouped collection of all ExportResult-related functions
 */
export const ExportResultDomain = {
    createExportResult,
    markExportAsCompleted,
    markExportAsFailed,
    exportResultToJSON,
}
