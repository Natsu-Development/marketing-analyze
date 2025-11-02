/**
 * Types for Facebook Sync AdSet Use Case
 */

export interface SyncResponse {
    success: boolean
    adAccountsSynced: number
    adsetsSynced: number
    errors?: string[]
}
