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
    readonly lastSyncAdSet?: Date
    readonly lastSyncInsight?: Date
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
    lastSyncAdSet?: Date
    lastSyncInsight?: Date
}): AdAccount {
    return {
        name: props.name,
        status: props.status,
        currency: props.currency,
        timezone: props.timezone,
        spendCap: props.spendCap,
        adAccountId: props.adAccountId,
        isActive: props.isActive ?? true,
        lastSyncAdSet: props.lastSyncAdSet,
        lastSyncInsight: props.lastSyncInsight,
    }
}

/**
 * Check if account is active
 */
export function isAdAccountActive(account: AdAccount): boolean {
    return account.isActive && account.status === 1
}

/**
 * Update lastSyncAdSet timestamp returning new immutable instance
 */
export function updateAdAccountLastSyncAdSet(account: AdAccount, timestamp: Date): AdAccount {
    return {
        ...account,
        lastSyncAdSet: timestamp,
    }
}

/**
 * Update lastSyncInsight timestamp returning new immutable instance
 */
export function updateAdAccountLastSyncInsight(account: AdAccount, timestamp: Date): AdAccount {
    return {
        ...account,
        lastSyncInsight: timestamp,
    }
}

