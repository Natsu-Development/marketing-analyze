/**
 * Campaign Aggregate - Barrel Export
 * Note: Only export Campaign interface and CampaignDomain to avoid name collisions
 * with AdSet domain functions (isActive, markAsScaled, isEligibleForAnalysis)
 */
export { Campaign, CampaignDomain } from './Campaign'
