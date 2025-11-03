/**
 * Repository Interface: ISuggestionRepository
 * Defines contract for persistence operations on Suggestion entities
 */

import { Suggestion } from '../aggregates/suggestion'

export interface ISuggestionRepository {
    /**
     * Save a suggestion with upsert logic for duplicate handling
     * Precondition: Suggestion must have valid adAccountId and adsetId
     * Postcondition: Returns persisted Suggestion with id and timestamps
     */
    save(suggestion: Suggestion): Promise<Suggestion>

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
     * Find all suggestions with pending status
     * Postcondition: Returns array of pending suggestions (empty if none found)
     */
    findPending(): Promise<Suggestion[]>

    /**
     * Update suggestion status
     * Precondition: id must be valid MongoDB ObjectId
     * Postcondition: Returns updated Suggestion with new status and updatedAt timestamp
     */
    updateStatus(id: string, status: 'pending' | 'rejected' | 'applied'): Promise<Suggestion | null>
}
