/**
 * Types for Ad Account Setting Use Cases
 */

import { AdAccountSetting } from '../../../domain'

export interface UpsertInput {
    adAccountId: string
    settings: Partial<{
        cpm: number
        ctr: number
        frequency: number
        inlineLinkCtr: number
        costPerInlineLinkClick: number
        purchaseRoas: number
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
