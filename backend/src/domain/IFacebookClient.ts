/**
 * Domain Service Interface: IFacebookOAuthClient
 * Defines contract for interacting with Facebook OAuth API
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

export interface FacebookAdAccount {
    name: string
    status: number
    currency: string
    timezone: string
    spendCap?: string
    adAccountId: string
    isActive?: boolean
}

export interface AdAccountsResponse {
    adAccounts: FacebookAdAccount[]
    paging?: {
        cursors?: {
            before: string
            after: string
        }
        next?: string
    }
}

export interface AuthUrlResponse {
    url: string
    state: string
}

export interface IFacebookOAuthClient {
    /**
     * Generate OAuth authorization URL
     */
    generateAuthUrl(): Promise<AuthUrlResponse>

    /**
     * Exchange authorization code for access token
     */
    exchangeCode(code: string): Promise<OAuthTokenResponse>

    /**
     * Exchange short-lived token for long-lived token
     */
    exchangeLongLivedToken(shortLivedToken: string): Promise<OAuthTokenResponse>

    /**
     * Debug and validate a token
     */
    debugToken(accessToken: string): Promise<DebugTokenResponse>

    /**
     * Get ad accounts for the authenticated user
     */
    getAdAccounts(accessToken: string): Promise<AdAccountsResponse>
}
