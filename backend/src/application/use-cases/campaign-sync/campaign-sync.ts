/**
 * Campaign Sync Use Case
 * Synchronizes campaign metadata for active ad accounts
 */

import { Account, AccountDomain, CampaignDomain } from '../../../domain'
import { accountRepository, campaignRepository, facebookClient } from '../../../config/dependencies'
import { logger } from '../../../infrastructure/shared/logger'
import { CampaignSyncResult } from './types'

/**
 * Sync campaigns for all active ad accounts
 */
export async function sync(): Promise<CampaignSyncResult> {
    logger.info('Starting campaign sync')

    try {
        const accounts = await accountRepository.findAllConnected()
        let campaignsFetched = 0
        const errors: string[] = []

        for (const account of accounts) {
            const schedulingDecision = AccountDomain.canAccountExport(account)
            if (!schedulingDecision.canExport) {
                logger.info(`Skipping campaign sync for ${account.accountId}: ${schedulingDecision.reason}`)
                continue
            }

            const activeAdAccounts = AccountDomain.getActiveAdAccounts(account)
            if (activeAdAccounts.length === 0) continue

            for (const adAccount of activeAdAccounts) {
                try {
                    const count = await syncForAccount(account, adAccount.adAccountId)
                    campaignsFetched += count
                } catch (error) {
                    const msg = `Campaign sync failed for ${adAccount.adAccountId}: ${(error as Error).message}`
                    errors.push(msg)
                    logger.error(msg)
                }
            }
        }

        logger.info(`Campaign sync completed: ${campaignsFetched} campaigns fetched`)

        return {
            success: errors.length === 0,
            campaignsFetched,
            errors: errors.length > 0 ? errors : undefined,
        }
    } catch (error) {
        const msg = `Campaign sync failed: ${(error as Error).message}`
        logger.error(msg)
        return {
            success: false,
            campaignsFetched: 0,
            errors: [msg],
        }
    }
}

async function syncForAccount(account: Account, adAccountId: string): Promise<number> {
    const currency = AccountDomain.getAdAccountCurrency(account, adAccountId)

    const campaignsData = await facebookClient.fetchCampaigns({
        accessToken: account.accessToken,
        adAccountId,
    })

    if (campaignsData.length === 0) {
        logger.info(`No campaigns found for ${adAccountId}`)
        return 0
    }

    const campaigns = campaignsData.map((data) =>
        CampaignDomain.createCampaign({
            accountId: account.accountId,
            adAccountId,
            campaignId: data.id,
            campaignName: data.name,
            status: data.status,
            dailyBudget: data.daily_budget ? parseInt(data.daily_budget, 10) : undefined,
            lifetimeBudget: data.lifetime_budget ? parseInt(data.lifetime_budget, 10) : undefined,
            currency,
            startTime: data.start_time ? new Date(data.start_time) : undefined,
            endTime: data.stop_time ? new Date(data.stop_time) : undefined,
        })
    )

    const result = await campaignRepository.saveBatch(campaigns)
    logger.info(`Saved ${result.upsertedCount + result.modifiedCount} campaigns for ${adAccountId}`)

    return campaigns.length
}
