/**
 * Entity: AdSet
 * Represents adset metadata from Facebook Marketing API
 * Tracks adset configuration and changes over time independently from performance insights
 * Implemented using functional programming style following DDD principles
 */

export interface AdSet {
    readonly id?: string
    readonly accountId: string
    readonly adAccountId: string
    readonly adsetId: string
    readonly adsetName: string
    readonly campaignId: string
    readonly campaignName: string
    readonly status: string
    readonly currency: string
    readonly dailyBudget?: number
    readonly lifetimeBudget?: number
    readonly startTime?: Date
    readonly endTime?: Date
    readonly lastScaledAt?: Date // Last time budget was scaled (for recurring scale threshold)
    readonly updatedTime: Date
    readonly syncedAt: Date
}

// Pure functions that operate on the AdSet data

/**
 * Create AdSet from Facebook API response
 * Handles nested campaign object and data transformation
 * Currency must be provided from parent AdAccount
 * Budget values are stored as raw data from Facebook API for easy tracking and calculation
 */
export function createAdSet(data: any, accountId: string, adAccountId: string, currency: string): AdSet {
    return {
        accountId,
        adAccountId,
        adsetId: data.id,
        adsetName: data.name,
        campaignId: data.campaign?.id || '',
        campaignName: data.campaign?.name || '',
        status: data.status,
        currency,
        dailyBudget: data.daily_budget ? Number(data.daily_budget) : undefined,
        lifetimeBudget: data.lifetime_budget ? Number(data.lifetime_budget) : undefined,
        startTime: data.start_time ? new Date(data.start_time) : undefined,
        endTime: data.end_time ? new Date(data.end_time) : undefined,
        updatedTime: new Date(data.updated_time),
        syncedAt: new Date(),
    }
}

/**
 * Update AdSet with new metadata returning new instance
 */
export function updateAdSet(adset: AdSet, updates: Partial<Omit<AdSet, 'id' | 'accountId' | 'adAccountId' | 'adsetId'>>): AdSet {
    return {
        ...adset,
        ...updates,
        syncedAt: new Date(),
    }
}

/**
 * Mark adset as scaled (set lastScaledAt to current time)
 * Used when budget scale suggestion is approved
 */
export function markAsScaled(adset: AdSet): AdSet {
    return {
        ...adset,
        lastScaledAt: new Date(),
    }
}

/**
 * Check if adset is in active status
 */
export function isActive(adset: AdSet): boolean {
    return adset.status === 'ACTIVE'
}

/**
 * Determine budget type (daily, lifetime, or none)
 */
export function getBudgetType(adset: AdSet): 'daily' | 'lifetime' | 'none' {
    if (adset.dailyBudget !== undefined) {
        return 'daily'
    }
    if (adset.lifetimeBudget !== undefined) {
        return 'lifetime'
    }
    return 'none'
}

/**
 * Calculate campaign age in days
 */
export function getAgeInDays(adset: AdSet): number | null {
    if (!adset.startTime) {
        return null
    }
    const now = new Date()
    const ageMs = now.getTime() - adset.startTime.getTime()
    return ageMs / (1000 * 60 * 60 * 24)
}

/**
 * Check if adset has basic eligibility for suggestion analysis
 * Requirements:
 * - Must be ACTIVE status
 * - Must have daily budget defined
 *
 * Note: Scale timing eligibility (initScaleDay) should be checked separately
 * using AdAccountSettingDomain functions when config is available
 */
export function isEligibleForAnalysis(adset: AdSet): boolean {
    // Must be active
    if (!isActive(adset)) {
        return false
    }

    // Must have daily budget
    if (adset.dailyBudget === undefined || adset.dailyBudget === null) {
        return false
    }

    return true
}

/**
 * AdSet Domain - Grouped collection of all AdSet-related functions
 * Following DDD principles with functional programming style
 */
export const AdSetDomain = {
    createAdSet,
    updateAdSet,
    markAsScaled,
    isActive,
    getBudgetType,
    getAgeInDays,
    isEligibleForAnalysis,
}
