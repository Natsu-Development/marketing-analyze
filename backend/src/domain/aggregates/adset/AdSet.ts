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
    readonly syncedAt: Date
}

// Pure functions that operate on the AdSet data

/**
 * Create AdSet from Facebook API response
 * Handles nested campaign object and data transformation
 */
export function createAdSet(data: any, adAccountId: string): AdSet {
    return {
        adAccountId,
        adsetId: data.id,
        adsetName: data.name,
        campaignId: data.campaign?.id || '',
        campaignName: data.campaign?.name || '',
        status: data.status,
        dailyBudget: data.daily_budget ? parseFloat(data.daily_budget) / 100 : undefined,
        lifetimeBudget: data.lifetime_budget ? parseFloat(data.lifetime_budget) / 100 : undefined,
        startTime: data.start_time ? new Date(data.start_time) : undefined,
        endTime: data.end_time ? new Date(data.end_time) : undefined,
        updatedTime: new Date(data.updated_time),
        syncedAt: new Date(),
    }
}

/**
 * Update AdSet with new metadata returning new instance
 */
export function updateAdSet(adset: AdSet, updates: Partial<Omit<AdSet, 'id' | 'adAccountId' | 'adsetId'>>): AdSet {
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
 * AdSet Domain - Grouped collection of all AdSet-related functions
 * Following DDD principles with functional programming style
 */
export const AdSetDomain = {
    createAdSet,
    updateAdSet,
    isAdSetActive,
    getAdSetBudgetType,
}
