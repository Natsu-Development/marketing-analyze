/**
 * Repository Interface: ISuggestionRepository
 * Defines contract for persistence operations on Suggestion entities
 */

import { Suggestion, SuggestionType } from '../aggregates/suggestion'

export interface PaginatedSuggestions {
    suggestions: Suggestion[]
    total: number
}

export interface ISuggestionRepository {
    save(suggestion: Suggestion): Promise<Suggestion>
    findById(id: string): Promise<Suggestion | null>
    deleteBulk(ids: string[]): Promise<number>

    // Pending suggestions lookup (for analysis use case)
    findPendingByAdsetId(adsetId: string): Promise<Suggestion[]>
    findPendingByCampaignId(campaignId: string): Promise<Suggestion[]>

    // Paginated queries (for API endpoints)
    findByTypeAndStatus(type: SuggestionType, status: 'pending' | 'approved' | 'rejected', limit?: number, offset?: number): Promise<PaginatedSuggestions>
    findByAdsetIdAndStatus(adsetId: string, status: 'pending' | 'approved' | 'rejected', limit?: number, offset?: number): Promise<PaginatedSuggestions>
    findByCampaignIdAndStatus(campaignId: string, status: 'pending' | 'approved' | 'rejected', limit?: number, offset?: number): Promise<PaginatedSuggestions>
}
