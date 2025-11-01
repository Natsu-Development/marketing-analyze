/**
 * Application Service Interface: IFacebookOAuthService
 * Defines contract for Facebook OAuth operations
 */

export interface OAuthTokenResponse {
    accessToken: string
    tokenType: string
    expiresIn: number
    refreshToken?: string
    refreshTokenExpiresIn?: number
}

export interface DebugTokenResponse {
    isValid: boolean
    userId: string
    scopes: string[]
    expiresAt: Date
}

export interface AuthUrlResponse {
    url: string
    state: string
}

import { AdAccount } from '../../domain/value-objects/AdAccount'

export interface AdAccountsResponse {
    adAccounts: AdAccount[]
    paging?: {
        cursors?: {
            before: string
            after: string
        }
        next?: string
    }
}

export interface IFacebookOAuthService {
    generateAuthUrl(): Promise<AuthUrlResponse>
    exchangeCode(code: string): Promise<OAuthTokenResponse>
    exchangeLongLivedToken(shortLivedToken: string): Promise<OAuthTokenResponse>
    debugToken(accessToken: string): Promise<DebugTokenResponse>
    getAdAccounts(accessToken: string): Promise<AdAccountsResponse>
}
