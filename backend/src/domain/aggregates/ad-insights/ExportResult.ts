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

/**
 * ExportResult Domain - Grouped collection of all ExportResult-related functions
 */
export const ExportResultDomain = {
    createExportResult,
    markExportAsCompleted,
    markExportAsFailed,
}
