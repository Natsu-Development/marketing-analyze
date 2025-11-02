/**
 * Use Cases: Metric Configuration
 * Manages metric configuration for ad accounts
 */

import { MetricConfig, MetricConfigDomain, IMetricConfigRepository } from '../../../domain'
import { metricConfigRepository } from '../../../infrastructure/database/mongodb/repositories/MetricConfigRepository'
import { logger } from '../../../infrastructure/shared/logger'
import { UpsertInput, UpsertResult, RetrieveInput, RetrieveResult } from './types'

/**
 * Upsert metric configuration for an ad account
 */
export async function upsert(
    input: UpsertInput,
    repository: IMetricConfigRepository = metricConfigRepository
): Promise<UpsertResult> {
    try {
        // Validate metric field names
        const invalidFields = Object.keys(input.metrics).filter(
            (field) => !MetricConfigDomain.isValidMetricField(field)
        )

        if (invalidFields.length > 0) {
            logger.warn(`Invalid metric fields: ${invalidFields.join(', ')}`, {
                adAccountId: input.adAccountId,
                invalidFields,
            })
            return {
                success: false,
                error: 'VALIDATION_ERROR',
                message: `Invalid metric fields: ${invalidFields.join(', ')}`,
            }
        }

        // Create and upsert
        const config = MetricConfigDomain.createMetricConfig({
            adAccountId: input.adAccountId,
            ...input.metrics,
        })

        const result = await repository.upsert(config)

        const metricsCount = MetricConfigDomain.getConfigurableMetrics().filter(
            (metric) => result[metric as keyof MetricConfig] !== undefined
        ).length

        logger.info(`Metric config upserted for ${input.adAccountId}`, {
            adAccountId: input.adAccountId,
            metricsCount,
        })

        return { success: true, data: result }
    } catch (error: any) {
        logger.error(`Failed to upsert metric config for ${input.adAccountId}`, {
            adAccountId: input.adAccountId,
            error: error.message,
        })

        return {
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Failed to upsert metric configuration',
        }
    }
}

/**
 * Retrieve metric configuration for an ad account (returns default if not found)
 */
export async function retrieve(
    input: RetrieveInput,
    repository: IMetricConfigRepository = metricConfigRepository
): Promise<RetrieveResult> {
    try {
        const config = await repository.findByAdAccountId(input.adAccountId)

        if (config) {
            logger.debug(`Retrieved metric config for ${input.adAccountId}`)
            return { success: true, data: config, isDefault: false }
        }

        // Return default if not found
        const defaultConfig = MetricConfigDomain.createDefaultMetricConfig(input.adAccountId)
        logger.debug(`Generated default metric config for ${input.adAccountId}`)

        return { success: true, data: defaultConfig, isDefault: true }
    } catch (error: any) {
        logger.error(`Failed to retrieve metric config for ${input.adAccountId}`, {
            adAccountId: input.adAccountId,
            error: error.message,
        })

        return {
            success: false,
            isDefault: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Failed to retrieve metric configuration',
        }
    }
}
