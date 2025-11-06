/**
 * Repository Interface: IExportResultRepository
 * Defines contract for persistence operations on ExportResult entities
 */

import { ExportResult } from '../aggregates/adset-insights'

export interface IExportResultRepository {
    save(exportResult: ExportResult): Promise<ExportResult>
    findByAdAccountId(adAccountId: string): Promise<ExportResult[]>
    findLatestByAdAccountId(adAccountId: string): Promise<ExportResult | null>
}
