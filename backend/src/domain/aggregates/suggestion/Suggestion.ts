/**
 * Entity: Suggestion
 * Represents automated adset performance suggestion based on metric threshold analysis
 * Stores only metrics that exceeded thresholds with their calculated values
 * Implemented using functional programming style following DDD principles
 */

import { METRIC_FIELDS, MetricFieldName } from '../ad-account-setting/AdAccountSetting'

/**
 * Exceeding metric data structure
 * Stores metric name and its calculated value that exceeded threshold
 */
export interface ExceedingMetric {
    readonly metricName: MetricFieldName
    readonly value: number
}

/**
 * Suggestion status lifecycle states
 */
export type SuggestionStatus = 'pending' | 'approved' | 'rejected'

/**
 * Suggestion type to distinguish adset vs campaign suggestions
 */
export type SuggestionType = 'adset' | 'campaign'

/**
 * Suggestion aggregate entity
 */
export interface Suggestion {
    readonly id?: string
    readonly type: SuggestionType
    readonly accountId: string
    readonly adAccountId: string
    readonly adAccountName: string
    readonly campaignId?: string  // For campaign suggestions
    readonly campaignName: string
    readonly adsetId: string
    readonly adsetName: string
    readonly adsetLink: string
    readonly currency: string
    readonly budget: number
    readonly budgetAfterScale: number
    readonly scalePercent?: number
    readonly note?: string
    readonly metrics: ReadonlyArray<ExceedingMetric>
    readonly metricsExceededCount: number
    readonly status: SuggestionStatus
    readonly recentScaleAt: Date | null
    readonly createdAt: Date
    readonly updatedAt: Date
}

/**
 * Validate metric name
 */
function isValidMetricName(metricName: string): metricName is MetricFieldName {
    return METRIC_FIELDS.includes(metricName as MetricFieldName)
}

/**
 * Generate Facebook Ads Manager link for adset
 */
function generateAdsetLink(adAccountId: string, adsetId: string): string {
    return `https://business.facebook.com/adsmanager/manage/adsets?act=${adAccountId}&selected_adset_ids=${adsetId}`
}

/**
 * Create a new adset Suggestion entity with default values
 * Pure function that creates suggestion from provided data
 */
export function createSuggestion(props: {
    accountId: string
    adAccountId: string
    adAccountName: string
    campaignName: string
    adsetId: string
    adsetName: string
    currency: string
    budget: number
    scalePercent?: number
    note?: string
    metrics: ReadonlyArray<ExceedingMetric>
    recentScaleAt: Date | null
}): Suggestion {
    const now = new Date()

    // Validate all metric names
    for (const metric of props.metrics) {
        if (!isValidMetricName(metric.metricName)) {
            throw new Error(`Invalid metric name: ${metric.metricName}`)
        }
    }

    // Validate budget
    if (props.budget <= 0) {
        throw new Error('Budget must be greater than 0')
    }

    // Calculate scaled budget
    const scalePercent = props.scalePercent || 0
    const budgetAfterScale = props.budget * (1 + scalePercent / 100)

    return {
        type: 'adset',
        accountId: props.accountId,
        adAccountId: props.adAccountId,
        adAccountName: props.adAccountName,
        campaignName: props.campaignName,
        adsetId: props.adsetId,
        adsetName: props.adsetName,
        adsetLink: generateAdsetLink(props.adAccountId, props.adsetId),
        currency: props.currency,
        budget: props.budget,
        budgetAfterScale,
        scalePercent: props.scalePercent,
        note: props.note,
        metrics: props.metrics,
        metricsExceededCount: props.metrics.length,
        status: 'pending',
        recentScaleAt: props.recentScaleAt,
        createdAt: now,
        updatedAt: now,
    }
}

/**
 * Generate Facebook Ads Manager link for campaign
 */
function generateCampaignLink(adAccountId: string, campaignId: string): string {
    return `https://business.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}&selected_campaign_ids=${campaignId}`
}

/**
 * Create a new campaign Suggestion entity
 * Pure function that creates campaign-level suggestion from provided data
 */
export function createCampaignSuggestion(props: {
    accountId: string
    adAccountId: string
    adAccountName: string
    campaignId: string
    campaignName: string
    currency: string
    budget: number
    scalePercent?: number
    note?: string
    metrics: ReadonlyArray<ExceedingMetric>
    recentScaleAt: Date | null
}): Suggestion {
    const now = new Date()

    // Validate all metric names
    for (const metric of props.metrics) {
        if (!isValidMetricName(metric.metricName)) {
            throw new Error(`Invalid metric name: ${metric.metricName}`)
        }
    }

    // Validate budget
    if (props.budget <= 0) {
        throw new Error('Budget must be greater than 0')
    }

    // Calculate scaled budget
    const scalePercent = props.scalePercent || 0
    const budgetAfterScale = props.budget * (1 + scalePercent / 100)

    return {
        type: 'campaign',
        accountId: props.accountId,
        adAccountId: props.adAccountId,
        adAccountName: props.adAccountName,
        campaignId: props.campaignId,
        campaignName: props.campaignName,
        // For campaign suggestions, keep adset fields empty to avoid confusion
        adsetId: '',
        adsetName: '',
        adsetLink: generateCampaignLink(props.adAccountId, props.campaignId),
        currency: props.currency,
        budget: props.budget,
        budgetAfterScale,
        scalePercent: props.scalePercent,
        note: props.note,
        metrics: props.metrics,
        metricsExceededCount: props.metrics.length,
        status: 'pending',
        recentScaleAt: props.recentScaleAt,
        createdAt: now,
        updatedAt: now,
    }
}

/**
 * Update pending suggestion with new analysis data
 * Returns new suggestion instance with updated fields
 * Preserves id and createdAt from existing suggestion
 */
export function updatePendingSuggestion(
    existingSuggestion: Suggestion,
    newData: {
        budget: number
        scalePercent?: number
        note?: string
        metrics: ReadonlyArray<ExceedingMetric>
        recentScaleAt: Date | null
    }
): Suggestion {
    // Validate that suggestion is pending
    if (existingSuggestion.status !== 'pending') {
        throw new Error(`Cannot update suggestion with status: ${existingSuggestion.status}. Only pending suggestions can be updated.`)
    }

    // Validate budget
    if (newData.budget <= 0) {
        throw new Error('Budget must be greater than 0')
    }

    // Validate all metric names
    for (const metric of newData.metrics) {
        if (!isValidMetricName(metric.metricName)) {
            throw new Error(`Invalid metric name: ${metric.metricName}`)
        }
    }

    // Calculate scaled budget
    const scalePercent = newData.scalePercent || 0
    const budgetAfterScale = newData.budget * (1 + scalePercent / 100)

    return {
        ...existingSuggestion,
        budget: newData.budget,
        budgetAfterScale,
        scalePercent: newData.scalePercent,
        note: newData.note,
        metrics: newData.metrics,
        metricsExceededCount: newData.metrics.length,
        recentScaleAt: newData.recentScaleAt,
        updatedAt: new Date(),
    }
}

/**
 * Approve suggestion
 * Validates suggestion is pending and transitions to 'approved' status
 * KISS: Direct status update without intermediate function
 */
export function approveSuggestion(suggestion: Suggestion): Suggestion {
    if (suggestion.status !== 'pending') {
        throw new Error(`Cannot approve suggestion with status: ${suggestion.status}. Only pending suggestions can be approved.`)
    }

    return {
        ...suggestion,
        status: 'approved',
        updatedAt: new Date(),
    }
}

/**
 * Reject suggestion
 * Validates suggestion is pending and transitions to 'rejected' status
 * KISS: Direct status update without intermediate function
 */
export function rejectSuggestion(suggestion: Suggestion): Suggestion {
    if (suggestion.status !== 'pending') {
        throw new Error(`Cannot reject suggestion with status: ${suggestion.status}. Only pending suggestions can be rejected.`)
    }

    return {
        ...suggestion,
        status: 'rejected',
        updatedAt: new Date(),
    }
}

/**
 * Suggestion Domain - Grouped collection of all Suggestion-related functions
 * Following DDD principles with functional programming style
 */
export const SuggestionDomain = {
    createSuggestion,
    createCampaignSuggestion,
    updatePendingSuggestion,
    approveSuggestion,
    rejectSuggestion,
}
