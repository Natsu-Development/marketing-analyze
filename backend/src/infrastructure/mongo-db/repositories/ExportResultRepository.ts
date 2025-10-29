/**
 * Repository Implementation: ExportResult
 */

import { IExportResultRepository, ExportResult } from '../../../domain'
import { ExportResultModel } from '../schemas/ExportResultSchema'

const toDomain = (doc: any): ExportResult => {
    const plainDoc = doc.toObject ? doc.toObject() : doc

    return {
        id: plainDoc._id.toString(),
        adAccountId: plainDoc.adAccountId,
        reportRunId: plainDoc.reportRunId,
        fileUrl: plainDoc.fileUrl,
        recordCount: plainDoc.recordCount,
        timeRange: {
            since: plainDoc.timeRange.since,
            until: plainDoc.timeRange.until,
        },
        status: plainDoc.status,
        error: plainDoc.error,
        completedAt: plainDoc.completedAt,
        createdAt: plainDoc.createdAt,
    }
}

const save = async (exportResult: ExportResult): Promise<ExportResult> => {
    const doc = {
        adAccountId: exportResult.adAccountId,
        reportRunId: exportResult.reportRunId,
        fileUrl: exportResult.fileUrl,
        recordCount: exportResult.recordCount,
        timeRange: exportResult.timeRange,
        status: exportResult.status,
        error: exportResult.error,
        completedAt: exportResult.completedAt,
    }

    const result = await ExportResultModel.findOneAndUpdate({ reportRunId: exportResult.reportRunId }, doc, {
        upsert: true,
        new: true,
        runValidators: true,
    })

    return toDomain(result)
}

const findByAdAccountId = async (adAccountId: string): Promise<ExportResult[]> => {
    const docs = await ExportResultModel.find({ adAccountId }).sort({ createdAt: -1 })
    return docs.map(toDomain)
}

const findLatestByAdAccountId = async (adAccountId: string): Promise<ExportResult | null> => {
    const doc = await ExportResultModel.findOne({ adAccountId }).sort({ createdAt: -1 })
    return doc ? toDomain(doc) : null
}

export const exportResultRepository: IExportResultRepository = {
    save,
    findByAdAccountId,
    findLatestByAdAccountId,
}
