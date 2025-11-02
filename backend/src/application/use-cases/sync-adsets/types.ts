/**
 * Types for Sync AdSets Use Case
 */

export interface AdSetSyncResponse {
    success: boolean
    adAccountsSynced: number
    adsetsSynced: number
    errors?: string[]
}
