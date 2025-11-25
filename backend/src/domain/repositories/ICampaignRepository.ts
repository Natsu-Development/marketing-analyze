/**
 * Repository Interface: ICampaignRepository
 */

import { Campaign } from '../aggregates/campaign'

export interface PaginatedCampaigns {
    campaigns: Campaign[]
    total: number
}

export interface BatchResult {
    upsertedCount: number
    modifiedCount: number
}

export interface ICampaignRepository {
    save(campaign: Campaign): Promise<Campaign>
    saveBatch(campaigns: Campaign[]): Promise<BatchResult>
    findByCampaignId(adAccountId: string, campaignId: string): Promise<Campaign | null>
    findByAdAccountId(adAccountId: string): Promise<Campaign[]>
    findActiveCampaigns(): Promise<Campaign[]>
    findActiveWithBudget(): Promise<Campaign[]>
    findAllPaginated(limit?: number, offset?: number): Promise<PaginatedCampaigns>
}
