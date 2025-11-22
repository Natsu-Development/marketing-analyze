/**
 * Types for Analyze Suggestions Use Case
 * Application layer DTOs for service responses
 */

/**
 * Result of processing a single adset
 */
export interface AdsetProcessingResult {
    readonly processed: boolean
    readonly created: boolean
    readonly updated: boolean
    readonly suggestion?: any
    readonly error?: string
}

/**
 * Analysis execution summary
 * Reports results of suggestion analysis workflow
 */
export interface AnalysisResult {
    readonly success: boolean
    readonly adsetsProcessed: number
    readonly suggestionsCreated: number
    readonly suggestionsUpdated: number
    readonly errors: number
    readonly errorMessages?: readonly string[]
}
