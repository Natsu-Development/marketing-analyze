/**
 * Types for Facebook Auth Use Cases
 */

import { Account } from '../../../domain'

export interface InitiateConnectionRequest {
    userId?: string
}

export interface InitiateConnectionResponse {
    success: boolean
    redirectUrl?: string
    state?: string
    error?: string
}

export interface DisconnectRequest {
    accountId: string
}

export interface DisconnectResponse {
    success: boolean
    message?: string
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

export interface HandleCallbackRequest {
    code: string
    state: string
}

export interface HandleCallbackResponse {
    success: boolean
    error?: string
}
