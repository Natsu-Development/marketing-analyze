/**
 * Entity: Campaign
 * Represents campaign metadata from Facebook Marketing API
 */

export interface Campaign {
    readonly id?: string
    readonly accountId: string
    readonly adAccountId: string
    readonly campaignId: string
    readonly campaignName: string
    readonly status: string
    readonly dailyBudget?: number
    readonly lifetimeBudget?: number
    readonly currency: string
    readonly startTime?: Date
    readonly endTime?: Date
    readonly lastScaledAt: Date | null
    readonly syncedAt: Date
}

/**
 * Create Campaign from Facebook API response
 */
export function createCampaign(data: {
    accountId: string
    adAccountId: string
    campaignId: string
    campaignName: string
    status: string
    dailyBudget?: number
    lifetimeBudget?: number
    currency: string
    startTime?: Date
    endTime?: Date
}): Campaign {
    return {
        accountId: data.accountId,
        adAccountId: data.adAccountId,
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        status: data.status,
        dailyBudget: data.dailyBudget,
        lifetimeBudget: data.lifetimeBudget,
        currency: data.currency,
        startTime: data.startTime,
        endTime: data.endTime,
        lastScaledAt: null,
        syncedAt: new Date(),
    }
}

/**
 * Update Campaign with new metadata
 */
export function updateCampaign(
    campaign: Campaign,
    updates: Partial<Omit<Campaign, 'id' | 'accountId' | 'adAccountId' | 'campaignId'>>
): Campaign {
    return {
        ...campaign,
        ...updates,
        syncedAt: new Date(),
    }
}

/**
 * Mark campaign as scaled
 */
export function markAsScaled(campaign: Campaign): Campaign {
    return {
        ...campaign,
        lastScaledAt: new Date(),
    }
}

/**
 * Check if campaign is active
 */
export function isActive(campaign: Campaign): boolean {
    return campaign.status === 'ACTIVE'
}

/**
 * Check if campaign has budget at campaign level (for analysis eligibility)
 */
export function hasBudget(campaign: Campaign): boolean {
    return (campaign.dailyBudget != null && campaign.dailyBudget > 0) ||
           (campaign.lifetimeBudget != null && campaign.lifetimeBudget > 0)
}

/**
 * Check if campaign is eligible for suggestion analysis
 * Must be ACTIVE, have campaign-level budget, and have daily budget
 */
export function isEligibleForAnalysis(campaign: Campaign): boolean {
    return isActive(campaign) && hasBudget(campaign) && campaign.dailyBudget != null
}

/**
 * Generate Facebook Ads Manager link
 */
export function generateLink(adAccountId: string, campaignId: string): string {
    return `https://business.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}&selected_campaign_ids=${campaignId}`
}

export const CampaignDomain = {
    createCampaign,
    updateCampaign,
    markAsScaled,
    isActive,
    hasBudget,
    isEligibleForAnalysis,
    generateLink,
}
