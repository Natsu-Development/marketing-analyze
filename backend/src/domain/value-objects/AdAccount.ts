/**
 * Value Object: AdAccount
 * Immutable representation of an ad account
 * Value Objects are defined by their attributes, not identity
 */

export interface AdAccount {
    readonly name: string
    readonly status: number
    readonly currency: string
    readonly timezone: string
    readonly spendCap?: string
    readonly adAccountId: string
    readonly isActive: boolean
}

/**
 * Create a new AdAccount
 */
export function createAdAccount(props: {
    name: string
    status: number
    currency: string
    timezone: string
    spendCap?: string
    adAccountId: string
    isActive?: boolean
}): AdAccount {
    return {
        name: props.name,
        status: props.status,
        currency: props.currency,
        timezone: props.timezone,
        spendCap: props.spendCap,
        adAccountId: props.adAccountId,
        isActive: props.isActive ?? true,
    }
}

/**
 * Create AdAccount from raw API data
 */
export function createAdAccountFromApi(data: any): AdAccount {
    return createAdAccount({
        name: data.name || '',
        status: data.status || 0,
        currency: data.currency || 'USD',
        timezone: data.timezone_name || data.timezone || 'UTC',
        spendCap: data.spend_cap,
        adAccountId: data.account_id || data.id || '',
        isActive: data.status === 1, // ACTIVE status
    })
}

/**
 * Check if account is active
 */
export function isAdAccountActive(account: AdAccount): boolean {
    return account.isActive && account.status === 1
}

/**
 * Get formatted currency display
 */
export function getAdAccountCurrency(account: AdAccount): string {
    return account.currency.toUpperCase()
}

/**
 * Check equality with another AdAccount
 */
export function areAdAccountsEqual(account: AdAccount, other: AdAccount): boolean {
    return (
        account.adAccountId === other.adAccountId &&
        account.name === other.name &&
        account.status === other.status &&
        account.currency === other.currency &&
        account.timezone === other.timezone &&
        account.spendCap === other.spendCap &&
        account.isActive === other.isActive
    )
}

/**
 * Convert to plain object for JSON serialization
 */
export function adAccountToJSON(account: AdAccount) {
    return {
        name: account.name,
        status: account.status,
        currency: account.currency,
        timezone: account.timezone,
        spendCap: account.spendCap,
        adAccountId: account.adAccountId,
        isActive: account.isActive,
    }
}

