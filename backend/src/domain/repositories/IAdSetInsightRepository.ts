/**
 * Repository Interface: IAdSetInsightRepository
 * Defines contract for persistence operations on AdSetInsight entities
 */

import { AdSetInsight } from '../aggregates/ad-insights'

export interface IAdInsightRepository {
    saveBatch(insights: AdSetInsight[]): Promise<void>
    findByAdAccountId(adAccountId: string): Promise<AdSetInsight[]>
    findByAdsetId(adsetId: string): Promise<AdSetInsight[]>
}
