/**
 * Types for Suggestion Use Cases
 */

import { Suggestion } from '../../../domain'

export interface ApproveSuggestionInput {
    suggestionId: string
}

export interface ApproveSuggestionResult {
    success: boolean
    data?: Suggestion
    error?: string
    message?: string
}

export interface RejectSuggestionInput {
    suggestionId: string
}

export interface RejectSuggestionResult {
    success: boolean
    data?: Suggestion
    error?: string
    message?: string
}
