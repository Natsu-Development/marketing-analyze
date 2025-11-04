/**
 * Types for Ad Account Setting Use Cases
 */

import { AdAccountSetting } from '../../../domain'

export interface UpsertInput {
    adAccountId: string
    settings: Partial<{
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
        scalePercent: number
        note: string
    }>
}

export interface UpsertResult {
    success: boolean
    data?: AdAccountSetting
    error?: string
    message?: string
}

export interface RetrieveInput {
    adAccountId: string
}

export interface RetrieveResult {
    success: boolean
    data?: AdAccountSetting
    isDefault: boolean
    error?: string
    message?: string
}
