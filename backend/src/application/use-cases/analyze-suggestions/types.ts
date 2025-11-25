/**
 * Types for Analyze Suggestions Use Case
 */

import { Suggestion, ExceedingMetric } from '../../../domain'
import { AdAccountSetting } from '../../../domain/aggregates/ad-account-setting'

/**
 * Internal analysis result (used by adset/campaign analyzers)
 */
export interface AnalysisResultInternal {
    readonly success: boolean
    readonly suggestionsCreated: number
    readonly createdSuggestions: Suggestion[]
    readonly errorMessages?: readonly string[]
}

/**
 * Public analysis result (returned by execute)
 */
export interface AnalysisResult {
    readonly success: boolean
    readonly suggestionsCreated: number
    readonly errorMessages?: readonly string[]
}

/**
 * Processing result for single entity
 */
export interface ProcessingResult {
    processed: boolean
    created: boolean
    updated: boolean
    suggestion?: Suggestion
    error?: string
}

/**
 * Suggestion input params
 */
export interface SuggestionParams {
    type: 'adset' | 'campaign'
    entityId: string
    entityName: string
    campaignName?: string
    accountId: string
    adAccountId: string
    adAccountName: string
    currency: string
    budget: number
    lastScaledAt?: Date | null
    exceedingMetrics: ExceedingMetric[]
    config: AdAccountSetting
}
