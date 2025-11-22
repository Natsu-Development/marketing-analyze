/**
 * Types for Campaign Sync Use Case
 */

export interface CampaignSyncResult {
    success: boolean
    campaignsFetched: number
    errors?: string[]
}
