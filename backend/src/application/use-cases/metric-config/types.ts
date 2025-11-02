/**
 * Types for Metric Configuration Use Cases
 */

import { MetricConfig } from '../../../domain'

export interface UpsertInput {
    adAccountId: string
    metrics: Partial<{
        impressions: number
        clicks: number
        spend: number
        cpm: number
        cpc: number
        ctr: number
        reach: number
        frequency: number
        linkCtr: number
        costPerInlineLinkClick: number
        costPerResult: number
        roas: number
    }>
}

export interface UpsertResult {
    success: boolean
    data?: MetricConfig
    error?: string
    message?: string
}

export interface RetrieveInput {
    adAccountId: string
}

export interface RetrieveResult {
    success: boolean
    data?: MetricConfig
    isDefault: boolean
    error?: string
    message?: string
}
