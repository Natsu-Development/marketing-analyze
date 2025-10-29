/**
 * Repository Interface: IExportResultRepository
 * Defines contract for persistence operations on ExportResult entities
 */

import { ExportResult } from '../entities/ExportResult'

export interface IExportResultRepository {
    save(exportResult: ExportResult): Promise<ExportResult>
    findByAdAccountId(adAccountId: string): Promise<ExportResult[]>
    findLatestByAdAccountId(adAccountId: string): Promise<ExportResult | null>
}
