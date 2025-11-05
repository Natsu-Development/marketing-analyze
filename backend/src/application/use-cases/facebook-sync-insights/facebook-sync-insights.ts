/**
 * Facebook Sync Insights Use Case
 * Synchronizes ad insights using Facebook async reporting API
 */

import { Account, AccountDomain, AccountService, ADSET_INSIGHT_FIELDS, ExportResultDomain } from '../../../domain'
import { exportResultRepository, accountRepository, facebookClient } from '../../../config/dependencies'
import { CsvProcessorService } from '../../services/csv-processor'
import { logger } from '../../../infrastructure/shared/logger'
import { SyncResponse, TimeRange } from './types'

/**
 * Sync insights for all active ad accounts
 */
export async function sync(): Promise<SyncResponse> {
    logger.info('Starting insight sync')

    try {
        const accounts = await accountRepository.findAllConnected()

        let exportsCreated = 0
        const adAccountIds: string[] = []
        const errors: string[] = []

        for (let account of accounts) {
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
                    const timeRange = AccountDomain.getAdAccountInsightSyncTimeRange(account, adAccount.adAccountId)

                    const validation = AccountService.validateTimeRange(timeRange)
                    if (!validation.valid) {
                        logger.warn(`Invalid time range for ${adAccount.adAccountId}: ${validation.errors.join(', ')}`)
                        continue
                    }

                    logger.info(`Syncing insights for ${adAccount.adAccountId} from ${timeRange.since} to ${timeRange.until}`)

                    await syncForAccount(account, adAccount.adAccountId, timeRange)
                    exportsCreated += 1
                    adAccountIds.push(adAccount.adAccountId)

                    // Update sync timestamp and save to repository
                    const now = new Date()
                    account = AccountDomain.updateAdAccountSyncInsight(account, adAccount.adAccountId, now)
                    await accountRepository.save(account)
                    logger.info(`Updated lastSyncInsight for ${adAccount.adAccountId} to ${now.toISOString()}`)
                } catch (error) {
                    const msg = `Export failed for ${adAccount.adAccountId}: ${(error as Error).message}`
                    errors.push(msg)
                    logger.error(msg)
                }
            }
        }

        logger.info(`Insight sync completed: ${exportsCreated} exports`)

        return {
            success: errors.length === 0,
            exportsCreated,
            adAccountIds,
            errors: errors.length > 0 ? errors : undefined,
        }
    } catch (error) {
        const msg = `Insight sync failed: ${(error as Error).message}`
        logger.error(msg)
        return {
            success: false,
            exportsCreated: 0,
            adAccountIds: [],
            errors: [msg],
        }
    }
}

async function syncForAccount(
    account: Account,
    adAccountId: string,
    timeRange: TimeRange
): Promise<void> {
    const fields = [...ADSET_INSIGHT_FIELDS]

    // Create async report
    const reportResponse = await facebookClient.createAsyncReport(account.accessToken, {
        adAccountId,
        level: 'adset',
        fields,
        timeRange,
    })

    logger.info(`Created report ${reportResponse.reportRunId} for ${adAccountId}`)

    // Poll until completion
    const status = await facebookClient.pollReportStatus(account.accessToken, reportResponse.reportRunId)

    if (status.asyncStatus !== 'Job Completed') {
        throw new Error(`Report ${reportResponse.reportRunId} failed: ${status.asyncStatus}`)
    }

    // Wait for Facebook to make CSV available
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Get CSV URL from Facebook
    const csvResult = await facebookClient.getReportCSV(account.accessToken, reportResponse.reportRunId)

    // Process and store CSV (downloads and streams)
    const csvProcessResult = await CsvProcessorService.process({
        fileUrl: csvResult.fileUrl,
        adAccountId,
        level: 'adset',
    })

    if (!csvProcessResult.success) {
        throw new Error(csvProcessResult.error || 'Failed to process CSV data')
    }

    // Create export result record
    const exportResult = ExportResultDomain.createExportResult({
        adAccountId,
        reportRunId: reportResponse.reportRunId,
        fileUrl: csvResult.fileUrl,
        recordCount: csvProcessResult.recordsProcessed,
        timeRange: {
            since: timeRange.since,
            until: timeRange.until,
        },
        status: 'completed',
        completedAt: new Date(),
    })

    await exportResultRepository.save(exportResult)
    logger.info(`Saved ${adAccountId}: ${csvProcessResult.recordsProcessed} records`)
}
