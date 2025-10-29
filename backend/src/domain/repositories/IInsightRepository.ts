/**
 * Repository Interfaces: Insight Repositories
 * Defines contracts for persistence operations on insight entities
 */

import { AdSetInsight } from '../entities/AdSetInsight'

export interface IAdSetInsightRepository {
    saveBatch(insights: AdSetInsight[]): Promise<void>
    findByAdAccountId(adAccountId: string): Promise<AdSetInsight[]>
}
