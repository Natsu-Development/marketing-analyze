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
     * Find all suggestions for a specific adset (excluding pending)
     * Precondition: adsetId must be non-empty string
     * Postcondition: Returns array of approved + rejected suggestions (empty if none found)
     */
    findByAdsetId(adsetId: string): Promise<Suggestion[]>

    /**
     * Find only pending suggestions for specific adset
     * Precondition: adsetId must be non-empty string
     * Postcondition: Returns array of pending suggestions sorted by createdAt descending
     */
    findPendingByAdsetId(adsetId: string): Promise<Suggestion[]>

    /**
     * Bulk delete suggestions by IDs
     * Precondition: ids array must contain valid MongoDB ObjectIds
     * Postcondition: Returns count of deleted documents
     */
    deleteBulk(ids: string[]): Promise<number>

    /**
     * Find suggestions by adset ID and status with pagination
     * Precondition: adsetId must be non-empty string, status must be 'approved' or 'rejected'
     * Postcondition: Returns paginated suggestions sorted by createdAt descending
     */
    findByAdsetIdAndStatus(
        adsetId: string,
        status: 'approved' | 'rejected',
        limit?: number,
        offset?: number
    ): Promise<PaginatedSuggestions>

    /**
     * Find all suggestions by status, sorted by exceeding count (descending)
     * Precondition: status must be one of 'pending', 'approved', or 'rejected'
     * Postcondition: Returns paginated suggestions sorted by metricsExceededCount descending
     * @param limit - Maximum number of suggestions to return (optional)
     * @param offset - Number of suggestions to skip (optional)
     */
    findByStatus(status: 'pending' | 'approved' | 'rejected', limit?: number, offset?: number): Promise<PaginatedSuggestions>
}
