/**
 * Types for Facebook Auth Use Cases
 */

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

export interface HandleCallbackRequest {
    code: string
    state: string
}

export interface HandleCallbackResponse {
    success: boolean
    error?: string
}
