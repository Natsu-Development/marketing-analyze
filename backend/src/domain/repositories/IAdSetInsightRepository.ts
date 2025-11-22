/**
 * Repository Interface: IAdSetInsightRepository
 * Defines contract for persistence operations on AdSetInsight entities
 */

import { AdSetInsight } from '../aggregates/adset-insights'

/**
 * Aggregated campaign metrics calculated from AdSetInsight records
 */
export interface AggregatedCampaignMetrics {
    campaignId: string
    // Volume metrics (sum)
    impressions: number
    clicks: number
    amountSpent: number
    reach: number
    purchases: number
    purchasesConversionValue: number
    // Weighted averages
    cpm: number
    ctr: number
    // Calculated ratios
    frequency: number
    inlineLinkCtr: number
    costPerInlineLinkClick: number
    purchaseRoas: number
}

export interface IAdSetInsightRepository {
    saveBatch(insights: AdSetInsight[]): Promise<void>
    findByAdAccountId(adAccountId: string): Promise<AdSetInsight[]>
    findByAdsetId(adsetId: string): Promise<AdSetInsight[]>
    /**
     * Aggregate adset insights by campaignId for campaign-level metrics
     * Returns null if no adset insights exist for the campaign
     */
    aggregateByCampaignId(campaignId: string): Promise<AggregatedCampaignMetrics | null>
}
