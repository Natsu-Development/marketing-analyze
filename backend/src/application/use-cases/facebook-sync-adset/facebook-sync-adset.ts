/**
 * Facebook Sync AdSet Use Case
 * Synchronizes adset metadata for active ad accounts
 */

import { Account, AccountDomain, AdSetDomain } from '../../../domain'
import { accountRepository, adSetRepository, facebookClient } from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { SyncResponse } from './types'

/**
 * Sync adsets for all active ad accounts
 */
export async function sync(): Promise<SyncResponse> {
    logger.info('Starting adset sync')

    try {
        const accounts = await accountRepository.findAllConnected()

        let adAccountsSynced = 0
        let adsetsSynced = 0
        const errors: string[] = []

        for (const account of accounts) {
            const schedulingDecision = AccountDomain.canAccountExport(account)

            if (!schedulingDecision.canExport) {
                logger.info(`Skipping ${account.accountId}: ${schedulingDecision.reason}`)
                continue
            }

            const activeAdAccounts = AccountDomain.getActiveAdAccounts(account)

            if (activeAdAccounts.length === 0) {
                continue
            }

            for (const adAccount of activeAdAccounts) {
                try {
                    const count = await syncForAccount(account, adAccount.adAccountId)
                    adAccountsSynced += 1
                    adsetsSynced += count
                } catch (error) {
                    const msg = `Sync failed for ${adAccount.adAccountId}: ${(error as Error).message}`
                    errors.push(msg)
                    logger.error(msg)
                }
            }
        }

        logger.info(`Adset sync completed: ${adAccountsSynced} accounts, ${adsetsSynced} adsets`)

        return {
            success: errors.length === 0,
            adAccountsSynced,
            adsetsSynced,
            errors: errors.length > 0 ? errors : undefined,
        }
    } catch (error) {
        const msg = `Adset sync failed: ${(error as Error).message}`
        logger.error(msg)
        return {
            success: false,
            adAccountsSynced: 0,
            adsetsSynced: 0,
            errors: [msg],
        }
    }
}

async function syncForAccount(account: Account, adAccountId: string): Promise<number> {
    // Fetch adsets from Facebook via infrastructure client
    const adsetsData = await facebookClient.fetchAdSets({
        accessToken: account.accessToken,
        adAccountId,
    })

    if (adsetsData.length === 0) {
        logger.info(`No adsets found for ${adAccountId}`)
        return 0
    }

    const adsets = adsetsData.map((data: any) => AdSetDomain.createAdSet(data, account.accountId, adAccountId))
    const result = await adSetRepository.saveBatch(adsets)

    logger.info(`Saved ${result.upsertedCount + result.modifiedCount} adsets for ${adAccountId}`)

    // Update sync timestamp
    const now = new Date()
    const updatedAccount = AccountDomain.updateAdAccountSyncAdSet(account, adAccountId, now)
    await accountRepository.save(updatedAccount)

    logger.info(`Updated lastSyncAdSet for ${adAccountId} to ${now.toISOString()}`)

    return adsets.length
}
