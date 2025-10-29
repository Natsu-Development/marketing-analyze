/**
 * Type: FacebookAdAccount
 * Represents a Facebook ad account
 */

export interface FacebookAdAccount {
    name: string
    status: number
    currency: string
    timezone: string
    spendCap?: string
    adAccountId: string
    isActive?: boolean
}
