/**
 * Repository Interface: IAdAccountSettingRepository
 * Defines contract for persistence operations on AdAccountSetting entities
 * Manages ad account settings including metric thresholds and suggestion parameters
 */

import { AdAccountSetting } from '../aggregates/ad-account-setting'

export interface IAdAccountSettingRepository {
    /**
     * Upsert (create or update) an ad account setting
     * Precondition: AdAccountSetting must have valid adAccountId
     * Postcondition: Returns persisted AdAccountSetting with id, createdAt, updatedAt
     */
    upsert(config: AdAccountSetting): Promise<AdAccountSetting>

    /**
     * Find ad account setting by ad account ID
     * Precondition: adAccountId must be non-empty string
     * Postcondition: Returns null if not found; AdAccountSetting if exists
     */
    findByAdAccountId(adAccountId: string): Promise<AdAccountSetting | null>
}
