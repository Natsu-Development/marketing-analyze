/**
 * Repository Interface: IAdSetInsightRepository
 * Defines contract for persistence operations on AdSetInsight entities
 */

import { AdSetInsight } from '../aggregates/adset-insights'

export interface IAdSetInsightRepository {
    saveBatch(insights: AdSetInsight[]): Promise<void>
    findByAdAccountId(adAccountId: string): Promise<AdSetInsight[]>
    findByAdsetId(adsetId: string): Promise<AdSetInsight[]>
}
