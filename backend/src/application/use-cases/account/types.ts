/**
 * Types for Account Use Cases
 */

import { Account } from '../../../domain'

export interface GetAccountInfoRequest {
    accountId: string
}

export interface GetAccountInfoResponse {
    success: boolean
    account?: Account
    error?: string
}

export interface RefreshAdAccountsRequest {
    accountId: string
}

export interface RefreshAdAccountsResponse {
    success: boolean
    message?: string
    adAccountsCount?: number
    account?: Account
    error?: string
}

export interface SetAdAccountActiveRequest {
    accountId: string
    adAccountId: string
    isActive: boolean
}

export interface SetAdAccountActiveResponse {
    success: boolean
    account?: Account
    error?: string
}
