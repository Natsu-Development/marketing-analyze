/**
 * Repository Interface: IAdSetRepository
 * Defines contract for persistence operations on AdSet entities
 */

import { AdSet } from '../aggregates/adset'

export interface IAdSetRepository {
    save(adset: AdSet): Promise<AdSet>
    saveBatch(adsets: AdSet[]): Promise<{ upsertedCount: number; modifiedCount: number }>
    findAll(): Promise<AdSet[]>
    findAllActive(): Promise<AdSet[]>
    findByAdAccountId(adAccountId: string): Promise<AdSet[]>
    findActiveByAdAccountId(adAccountId: string): Promise<AdSet[]>
    findByAdSetId(adAccountId: string, adsetId: string): Promise<AdSet | null>
    findByCampaignId(campaignId: string): Promise<AdSet[]>
}
