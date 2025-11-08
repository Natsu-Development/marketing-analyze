/**
 * Repository Interface: ISuggestionRepository
 * Defines contract for persistence operations on Suggestion entities
 */

import { Suggestion } from '../aggregates/suggestion'

export interface PaginatedSuggestions {
    suggestions: Suggestion[]
    total: number
}

export interface ISuggestionRepository {
    /**
     * Save a suggestion with upsert logic for duplicate handling
     * Precondition: Suggestion must have valid adAccountId and adsetId
     * Postcondition: Returns persisted Suggestion with id and timestamps
     */
    save(suggestion: Suggestion): Promise<Suggestion>

    /**
     * Find suggestion by ID
     * Precondition: id must be valid MongoDB ObjectId
     * Postcondition: Returns Suggestion if found, null otherwise
     */
    findById(id: string): Promise<Suggestion | null>

    /**
     * Find all suggestions for a specific ad account
     * Precondition: adAccountId must be non-empty string
     * Postcondition: Returns array of suggestions (empty if none found)
     */
    findByAdAccountId(adAccountId: string): Promise<Suggestion[]>

    /**
     * Find all suggestions for a specific adset
     * Precondition: adsetId must be non-empty string
     * Postcondition: Returns array of suggestions (empty if none found)
     */
    findByAdsetId(adsetId: string): Promise<Suggestion[]>

    /**
     * Update suggestion status
     * Precondition: id must be valid MongoDB ObjectId
     * Postcondition: Returns updated Suggestion with new status and updatedAt timestamp
     */
    updateStatus(id: string, status: 'pending' | 'rejected' | 'applied'): Promise<Suggestion | null>

    /**
     * Find all suggestions by status, sorted by exceeding count (descending)
     * Precondition: status must be one of 'pending', 'rejected', or 'applied'
     * Postcondition: Returns paginated suggestions sorted by metricsExceededCount descending
     * @param limit - Maximum number of suggestions to return (optional)
     * @param offset - Number of suggestions to skip (optional)
     */
    findByStatus(status: 'pending' | 'rejected' | 'applied', limit?: number, offset?: number): Promise<PaginatedSuggestions>
}
