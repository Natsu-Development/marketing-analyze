/**
 * Types for Analyze Suggestions Use Case
 * Application layer DTOs for service responses
 */

/**
 * Analysis execution summary
 * Reports results of suggestion analysis workflow
 */
export interface AnalysisResult {
    readonly success: boolean
    readonly adsetsProcessed: number
    readonly suggestionsCreated: number
    readonly errors: number
    readonly errorMessages?: readonly string[]
}
