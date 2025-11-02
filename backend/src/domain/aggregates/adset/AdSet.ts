/**
 * Entity: AdSet
 * Represents adset metadata from Facebook Marketing API
 * Tracks adset configuration and changes over time independently from performance insights
 * Implemented using functional programming style following DDD principles
 */

export interface AdSet {
    readonly id?: string
    readonly adAccountId: string
    readonly adsetId: string
    readonly adsetName: string
    readonly campaignId: string
    readonly campaignName: string
    readonly status: string
    readonly dailyBudget?: number
    readonly lifetimeBudget?: number
    readonly startTime?: Date
    readonly endTime?: Date
    readonly updatedTime: Date
    readonly createdAt: Date
    readonly syncedAt: Date
}

// Pure functions that operate on the AdSet data

/**
 * Create a new AdSet
 */
export function createAdSet(props: AdSet): AdSet {
    const now = new Date()
    return {
        adAccountId: props.adAccountId,
        adsetId: props.adsetId,
        adsetName: props.adsetName,
        campaignId: props.campaignId,
        campaignName: props.campaignName,
        status: props.status,
        dailyBudget: props.dailyBudget,
        lifetimeBudget: props.lifetimeBudget,
        startTime: props.startTime,
        endTime: props.endTime,
        updatedTime: props.updatedTime,
        createdAt: now,
        syncedAt: now,
    }
}

/**
 * Create AdSet from persistence data
 */
export function createAdSetFromPersistence(props: {
    id?: string
    adAccountId: string
    adsetId: string
    adsetName: string
    campaignId: string
    campaignName: string
    status: string
    dailyBudget?: number
    lifetimeBudget?: number
    startTime?: Date
    endTime?: Date
    updatedTime: Date
    createdAt: Date
    syncedAt: Date
}): AdSet {
    return { ...props }
}

/**
 * Update AdSet with new metadata returning new instance
 */
export function updateAdSet(adset: AdSet, updates: Partial<Omit<AdSet, 'id' | 'adAccountId' | 'adsetId' | 'createdAt'>>): AdSet {
    return {
        ...adset,
        ...updates,
        syncedAt: new Date(),
    }
}

/**
 * Check if adset is in active status
 */
export function isAdSetActive(adset: AdSet): boolean {
    return adset.status === 'ACTIVE'
}

/**
 * Determine budget type (daily, lifetime, or none)
 */
export function getAdSetBudgetType(adset: AdSet): 'daily' | 'lifetime' | 'none' {
    if (adset.dailyBudget !== undefined) {
        return 'daily'
    }
    if (adset.lifetimeBudget !== undefined) {
        return 'lifetime'
    }
    return 'none'
}

/**
 * Convert to plain object for JSON serialization
 */
export function adSetToJSON(adset: AdSet) {
    return {
        id: adset.id,
        adAccountId: adset.adAccountId,
        adsetId: adset.adsetId,
        adsetName: adset.adsetName,
        campaignId: adset.campaignId,
        campaignName: adset.campaignName,
        status: adset.status,
        dailyBudget: adset.dailyBudget,
        lifetimeBudget: adset.lifetimeBudget,
        startTime: adset.startTime,
        endTime: adset.endTime,
        updatedTime: adset.updatedTime,
        createdAt: adset.createdAt,
        syncedAt: adset.syncedAt,
    }
}

/**
 * AdSet Domain - Grouped collection of all AdSet-related functions
 * Following DDD principles with functional programming style
 */
export const AdSetDomain = {
    createAdSet,
    createAdSetFromPersistence,
    updateAdSet,
    isAdSetActive,
    getAdSetBudgetType,
    adSetToJSON,
}
