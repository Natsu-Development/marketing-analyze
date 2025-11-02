/**
 * Use Case: Sync AdSets
 * Synchronizes adset metadata for all active ad accounts using Facebook Graph API
 */

import axios from 'axios'
import { Account, AccountDomain, AdSetDomain } from '../../../domain'
import { accountRepository, adSetRepository } from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { appConfig } from '../../../config/env'
import { AdSetSyncResponse } from './types'

const baseUrl = `https://graph.facebook.com/${appConfig.facebook.apiVersion}`

/**
 * Sync adset metadata for all connections with active ad accounts
 */
export async function syncAdSets(): Promise<AdSetSyncResponse> {
    logger.info('Starting adset metadata sync')

    try {
        // Find all connected accounts from repository
        const allAccounts = await accountRepository.findAllConnected()

        let adAccountsSynced = 0
        let adsetsSynced = 0
        const errors: string[] = []

        for (const account of allAccounts) {
            // Domain: Check if account should be exported using business rules
            const schedulingDecision = AccountDomain.canAccountExport(account)

            if (!schedulingDecision.canExport) {
                logger.info(`Skipping account ${account.accountId}: ${schedulingDecision.reason}`)
                continue
            }

            // Get active ad accounts
            const activeAdAccounts = AccountDomain.getActiveAdAccounts(account)

            if (activeAdAccounts.length === 0) {
                continue
            }

            // Sync adsets for each active ad account
            for (const adAccount of activeAdAccounts) {
                try {
                    const adsetsCount = await syncAdSetsForAccount(account, adAccount.adAccountId)
                    adAccountsSynced += 1
                    adsetsSynced += adsetsCount
                } catch (error) {
                    const errorMsg = `AdSet sync failed for ${adAccount.adAccountId}: ${(error as Error).message}`
                    errors.push(errorMsg)
                    logger.error(errorMsg)
                }
            }
        }

        logger.info(`AdSet sync completed: ${adAccountsSynced} ad accounts, ${adsetsSynced} adsets synced`)

        return {
            success: errors.length === 0,
            adAccountsSynced,
            adsetsSynced,
            errors: errors.length > 0 ? errors : undefined,
        }
    } catch (error) {
        const errorMsg = `AdSet sync failed: ${(error as Error).message}`
        logger.error(errorMsg)
        return {
            success: false,
            adAccountsSynced: 0,
            adsetsSynced: 0,
            errors: [errorMsg],
        }
    }
}

/**
 * Sync adsets for a specific ad account
 */
async function syncAdSetsForAccount(
    account: Account,
    adAccountId: string,
): Promise<number> {
    // Calculate time range using per-account lastSyncAdSet or fallback
    const timeRange = AccountDomain.getAdAccountAdSetSyncTimeRange(account, adAccountId)

    logger.info(`Syncing adsets for ${adAccountId} from ${timeRange.since} to ${timeRange.until}`)

    // Build Facebook Graph API request
    const adAccountIdWithPrefix = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`

    const params = new URLSearchParams({
        access_token: account.accessToken,
        fields: 'id,name,campaign{id,name},status,daily_budget,lifetime_budget,start_time,end_time,updated_time',
        filtering: JSON.stringify([
            {
                field: 'updated_time',
                operator: 'GREATER_THAN',
                value: timeRange.since,
            },
        ]),
        limit: '500', // Max limit per page
    })

    const url = `${baseUrl}/${adAccountIdWithPrefix}/adsets?${params.toString()}`

    // Fetch adsets from Facebook API
    const response = await axios.get(url)
    const adsetsData = response.data.data || []

    if (adsetsData.length === 0) {
        logger.info(`No adsets found for ${adAccountId}`)
        return 0
    }

    // Map Facebook API response to AdSet domain entities
    const adsets = adsetsData.map((data: any) => AdSetDomain.createAdSet(data))

    // Batch save adsets to database using repository upsert operations
    const result = await adSetRepository.saveBatch(adsets)

    logger.info(`Saved ${result.upsertedCount + result.modifiedCount} adsets for ${adAccountId}`)

    // Update lastSyncAdSet timestamp for ad account on successful sync
    const now = new Date()
    const updatedAccount = AccountDomain.updateAdAccountSyncAdSet(account, adAccountId, now)
    await accountRepository.save(updatedAccount)

    logger.info(`Updated lastSyncAdSet for ${adAccountId} to ${now.toISOString()}`)

    return adsets.length
}
