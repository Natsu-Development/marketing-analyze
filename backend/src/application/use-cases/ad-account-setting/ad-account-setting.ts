/**
 * Use Cases: Ad Account Setting
 * Manages ad account settings including metric thresholds and suggestion parameters
 */

import { AdAccountSetting, AdAccountSettingDomain, IAdAccountSettingRepository } from '../../../domain'
import { adAccountSettingRepository } from '../../../infrastructure/database/mongodb/repositories/AdAccountSettingRepository'
import { logger } from '../../../infrastructure/shared/logger'
import { UpsertInput, UpsertResult, RetrieveInput, RetrieveResult } from './types'

/**
 * Upsert ad account setting
 */
export async function upsert(
    input: UpsertInput,
    repository: IAdAccountSettingRepository = adAccountSettingRepository
): Promise<UpsertResult> {
    try {
        // Validate metric field names
        const invalidFields = Object.keys(input.settings).filter(
            (field) => field !== 'scalePercent' && field !== 'note' && !AdAccountSettingDomain.isValidMetricField(field)
        )

        if (invalidFields.length > 0) {
            logger.warn(`Invalid setting fields: ${invalidFields.join(', ')}`, {
                adAccountId: input.adAccountId,
                invalidFields,
            })
            return {
                success: false,
                error: 'VALIDATION_ERROR',
                message: `Invalid setting fields: ${invalidFields.join(', ')}`,
            }
        }

        // Create and upsert
        const config = AdAccountSettingDomain.createAdAccountSetting({
            adAccountId: input.adAccountId,
            ...input.settings,
        })

        const result = await repository.upsert(config)

        const metricsCount = AdAccountSettingDomain.getConfigurableMetrics().filter(
            (metric) => result[metric as keyof AdAccountSetting] !== undefined
        ).length

        logger.info(`Ad account setting upserted for ${input.adAccountId}`, {
            adAccountId: input.adAccountId,
            metricsCount,
        })

        return { success: true, data: result }
    } catch (error: any) {
        logger.error(`Failed to upsert ad account setting for ${input.adAccountId}`, {
            adAccountId: input.adAccountId,
            error: error.message,
        })

        return {
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Failed to upsert ad account setting',
        }
    }
}

/**
 * Retrieve ad account setting (returns default if not found)
 */
export async function retrieve(
    input: RetrieveInput,
    repository: IAdAccountSettingRepository = adAccountSettingRepository
): Promise<RetrieveResult> {
    try {
        const config = await repository.findByAdAccountId(input.adAccountId)

        if (config) {
            logger.debug(`Retrieved ad account setting for ${input.adAccountId}`)
            return { success: true, data: config, isDefault: false }
        }

        // Return default if not found
        const defaultConfig = AdAccountSettingDomain.createDefaultAdAccountSetting(input.adAccountId)
        logger.debug(`Generated default ad account setting for ${input.adAccountId}`)

        return { success: true, data: defaultConfig, isDefault: true }
    } catch (error: any) {
        logger.error(`Failed to retrieve ad account setting for ${input.adAccountId}`, {
            adAccountId: input.adAccountId,
            error: error.message,
        })

        return {
            success: false,
            isDefault: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Failed to retrieve ad account setting',
        }
    }
}
