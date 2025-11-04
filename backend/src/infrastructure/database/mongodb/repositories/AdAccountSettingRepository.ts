/**
 * Repository Implementation: AdAccountSettingRepository
 * Uses plain functional approach following AccountRepository pattern
 */

import { IAdAccountSettingRepository, AdAccountSetting } from '../../../../domain'
import { AdAccountSettingSchema } from '../schemas/AdAccountSettingSchema'

// Convert Mongoose document to plain domain object
const toDomain = (doc: any): AdAccountSetting => {
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
        scalePercent: plainDoc.scalePercent,
        note: plainDoc.note,
        createdAt: plainDoc.createdAt,
        updatedAt: plainDoc.updatedAt,
    }
}

// Convert domain object to database format
const fromDomain = (config: AdAccountSetting) => ({
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
    scalePercent: config.scalePercent,
    note: config.note,
})

const upsert = async (config: AdAccountSetting): Promise<AdAccountSetting> => {
    const doc = fromDomain(config)
    const result = await AdAccountSettingSchema.findOneAndUpdate(
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

const findByAdAccountId = async (adAccountId: string): Promise<AdAccountSetting | null> => {
    const doc = await AdAccountSettingSchema.findOne({ adAccountId })
    return doc ? toDomain(doc) : null
}

export const adAccountSettingRepository: IAdAccountSettingRepository = {
    upsert,
    findByAdAccountId,
}
