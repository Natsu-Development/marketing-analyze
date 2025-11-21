/**
 * Repository Interface: IAdSetRepository
 * Defines contract for persistence operations on AdSet entities
 */

import { AdSet } from '../aggregates/adset'

export interface PaginatedAdSets {
    adsets: AdSet[]
    total: number
}

export interface IAdSetRepository {
    save(adset: AdSet): Promise<AdSet>
    saveBatch(adsets: AdSet[]): Promise<{ upsertedCount: number; modifiedCount: number }>
    findAllActive(): Promise<AdSet[]>
    findByAdSetId(adAccountId: string, adsetId: string): Promise<AdSet | null>
    findAllWithPagination(limit?: number, offset?: number): Promise<PaginatedAdSets>
}
