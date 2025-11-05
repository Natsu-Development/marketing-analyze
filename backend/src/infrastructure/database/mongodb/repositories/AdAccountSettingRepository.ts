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
        cpm: plainDoc.cpm,
        ctr: plainDoc.ctr,
        frequency: plainDoc.frequency,
        inlineLinkCtr: plainDoc.inlineLinkCtr,
        costPerInlineLinkClick: plainDoc.costPerInlineLinkClick,
        purchaseRoas: plainDoc.purchaseRoas,
        scalePercent: plainDoc.scalePercent,
        initScaleDay: plainDoc.initScaleDay,
        recurScaleDay: plainDoc.recurScaleDay,
        note: plainDoc.note,
        createdAt: plainDoc.createdAt,
        updatedAt: plainDoc.updatedAt,
    }
}

// Convert domain object to database format
const fromDomain = (config: AdAccountSetting) => ({
    adAccountId: config.adAccountId,
    cpm: config.cpm,
    ctr: config.ctr,
    frequency: config.frequency,
    inlineLinkCtr: config.inlineLinkCtr,
    costPerInlineLinkClick: config.costPerInlineLinkClick,
    purchaseRoas: config.purchaseRoas,
    scalePercent: config.scalePercent,
    initScaleDay: config.initScaleDay,
    recurScaleDay: config.recurScaleDay,
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
