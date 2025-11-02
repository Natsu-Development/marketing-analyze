/**
 * Repository Interface: IMetricConfigRepository
 * Defines contract for persistence operations on MetricConfig entities
 */

import { MetricConfig } from '../aggregates/metric-config'

export interface IMetricConfigRepository {
    /**
     * Upsert (create or update) a metric configuration
     * Precondition: MetricConfig must have valid adAccountId
     * Postcondition: Returns persisted MetricConfig with id, createdAt, updatedAt
     */
    upsert(config: MetricConfig): Promise<MetricConfig>

    /**
     * Find configuration by ad account ID
     * Precondition: adAccountId must be non-empty string
     * Postcondition: Returns null if not found; MetricConfig if exists
     */
    findByAdAccountId(adAccountId: string): Promise<MetricConfig | null>
}
