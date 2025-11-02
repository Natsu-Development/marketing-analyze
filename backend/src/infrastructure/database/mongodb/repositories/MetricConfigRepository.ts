/**
 * Repository Implementation: MetricConfigRepository
 * Uses plain functional approach following AccountRepository pattern
 */

import { IMetricConfigRepository, MetricConfig } from '../../../../domain'
import { MetricConfigSchema } from '../schemas/MetricConfigSchema'

// Convert Mongoose document to plain domain object
const toDomain = (doc: any): MetricConfig => {
    // Convert Mongoose document to plain object to avoid document pollution
    const plainDoc = doc.toObject ? doc.toObject() : doc

    return {
        id: plainDoc._id.toString(),
        adAccountId: plainDoc.adAccountId,
        impressions: plainDoc.impressions,
        clicks: plainDoc.clicks,
        spend: plainDoc.spend,
        cpm: plainDoc.cpm,
        cpc: plainDoc.cpc,
        ctr: plainDoc.ctr,
        reach: plainDoc.reach,
        frequency: plainDoc.frequency,
        linkCtr: plainDoc.linkCtr,
        costPerInlineLinkClick: plainDoc.costPerInlineLinkClick,
        costPerResult: plainDoc.costPerResult,
        roas: plainDoc.roas,
        createdAt: plainDoc.createdAt,
        updatedAt: plainDoc.updatedAt,
    }
}

// Convert domain object to database format
const fromDomain = (config: MetricConfig) => ({
    adAccountId: config.adAccountId,
    impressions: config.impressions,
    clicks: config.clicks,
    spend: config.spend,
    cpm: config.cpm,
    cpc: config.cpc,
    ctr: config.ctr,
    reach: config.reach,
    frequency: config.frequency,
    linkCtr: config.linkCtr,
    costPerInlineLinkClick: config.costPerInlineLinkClick,
    costPerResult: config.costPerResult,
    roas: config.roas,
})

const upsert = async (config: MetricConfig): Promise<MetricConfig> => {
    const doc = fromDomain(config)
    const result = await MetricConfigSchema.findOneAndUpdate(
        { adAccountId: config.adAccountId },
        doc,
        {
            upsert: true,
            new: true,
            runValidators: true,
        }
    )

    return toDomain(result)
}

const findByAdAccountId = async (adAccountId: string): Promise<MetricConfig | null> => {
    const doc = await MetricConfigSchema.findOne({ adAccountId })
    return doc ? toDomain(doc) : null
}

export const metricConfigRepository: IMetricConfigRepository = {
    upsert,
    findByAdAccountId,
}
