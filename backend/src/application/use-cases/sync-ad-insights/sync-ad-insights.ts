/**
 * Use Case: Sync Ad Insights
 * Synchronizes ad insights for all active ad accounts using Facebook async reporting API
 */

import { Account, AccountDomain, AccountService, ADSET_INSIGHT_FIELDS, ExportResultDomain } from '../../../domain'
import { exportResultRepository, accountRepository, adInsightsClient } from '../../../config/dependencies'
import { CsvProcessorService } from '../../services/csv-processor'
import { logger } from '../../../infrastructure/shared/logger'
import { AdInsightsTimeRange, AdInsightExportRequest, AdInsightExportResponse } from './types'

/**
 * Export ad insights for all connections with active ad accounts
 */
export async function startImportAsync(request?: AdInsightExportRequest): Promise<AdInsightExportResponse> {
    logger.info('Starting import insight')

    try {
        // Find all connected accounts from repository
        const allAccounts = await accountRepository.findAllConnected()

        let exportsCreated = 0
        const adAccountIds: string[] = []
        const errors: string[] = []

        for (const account of allAccounts) {
            // Domain: Check if account should be exported using business rules
            const schedulingDecision = AccountDomain.canAccountExport(account)

            if (!schedulingDecision.canExport) {
                logger.info(`Skipping account ${account.accountId} - ${schedulingDecision.reason}`)
                continue
            }

            // Get active ad accounts
            const activeAdAccounts = AccountDomain.getActiveAdAccounts(account)

            if (activeAdAccounts.length === 0) {
                logger.info(`No active ad accounts for account ${account.accountId}`)
                continue
            }

            // Get time range for this account (use domain service)
            const timeRange = request?.timeRange || schedulingDecision.timeRange

            // Domain: Validate time range
            const timeRangeValidation = AccountService.validateTimeRange(timeRange)
            if (!timeRangeValidation.valid) {
                logger.warn(
                    `Invalid time range for account ${account.accountId}: ${timeRangeValidation.errors.join(', ')}`
                )
                continue
            }

            logger.info(`Using time range for account ${account.accountId}: ${timeRange.since} to ${timeRange.until}`)

            let accountExportSuccess = true

            // Export for each active ad account
            for (const adAccount of activeAdAccounts) {
                try {
                    await importAsyncInsight(account, adAccount.adAccountId, timeRange, 'adset')
                    exportsCreated += 1
                    adAccountIds.push(adAccount.adAccountId)
                    logger.info(`Created exports for ad account ${adAccount.adAccountId}`)
                } catch (error) {
                    accountExportSuccess = false
                    const errorMsg = `Failed to export for ad account ${adAccount.adAccountId}: ${(error as Error).message}`
                    errors.push(errorMsg)
                    logger.error(errorMsg)
                }
            }

            // Update lastSyncAt if all exports succeeded for this account
            if (accountExportSuccess && activeAdAccounts.length > 0) {
                const updatedAccount = AccountDomain.updateAccountLastSync(account)
                await accountRepository.save(updatedAccount)
                logger.info(`Updated lastSyncAt for account ${account.accountId}`)
            }
        }

        logger.info(`Import insight completed. Created ${exportsCreated} exports`)

        return {
            success: errors.length === 0,
            exportsCreated,
            adAccountIds,
            errors: errors.length > 0 ? errors : undefined,
        }
    } catch (error) {
        const errorMsg = `Failed to import insight: ${(error as Error).message}`
        logger.error(errorMsg)
        return {
            success: false,
            exportsCreated: 0,
            adAccountIds: [],
            errors: [errorMsg],
        }
    }
}

/**
 * Import insight for a specific ad account
 */
async function importAsyncInsight(
    account: Account,
    adAccountId: string,
    timeRange: AdInsightsTimeRange,
    level: 'adset'
): Promise<void> {
    // Fields for adset level
    const fields = [...ADSET_INSIGHT_FIELDS]

    // Create async report
    const reportResponse = await adInsightsClient.createAsyncReport(account.accessToken, {
        adAccountId,
        level,
        fields,
        timeRange,
    })

    logger.info(`Created async report ${reportResponse.reportRunId} for ad account ${adAccountId}`)

    // Poll until completion
    const status = await adInsightsClient.pollReportStatus(account.accessToken, reportResponse.reportRunId)

    if (status.asyncStatus !== 'Job Completed') {
        const errorMsg = `Report ${reportResponse.reportRunId} failed with status: ${status.asyncStatus}`
        logger.error(errorMsg)
        throw new Error(errorMsg)
    }

    // Wait a bit for Facebook to make the CSV available
    await new Promise((resolve) => setTimeout(resolve, 3000)) // Wait 3 seconds

    // Get the CSV result
    const csvResult = await adInsightsClient.getReportCSV(account.accessToken, reportResponse.reportRunId)

    // Process and store CSV data
    logger.info(`Processing and storing ${level} CSV data for ad account ${adAccountId}`)
    const csvProcessResult = await CsvProcessorService.process({
        fileUrl: csvResult.fileUrl,
        adAccountId,
        level,
        accessToken: account.accessToken, // Pass access token for CSV download
    })

    if (!csvProcessResult.success) {
        logger.error(`Failed to process CSV data: ${csvProcessResult.error}`)
        throw new Error(csvProcessResult.error || 'Failed to process CSV data')
    }

    // Domain: Create export result record
    const exportResult = ExportResultDomain.createExportResult({
        adAccountId,
        reportRunId: reportResponse.reportRunId,
        fileUrl: csvResult.fileUrl,
        recordCount: csvProcessResult.recordsProcessed,
        timeRange: {
            since: timeRange.since,
            until: timeRange.until,
        },
        status: csvResult.completedAt ? 'completed' : 'pending',
        completedAt: csvResult.completedAt,
    })

    await exportResultRepository.save(exportResult)
    logger.info(
        `Saved ${level} export result for ad account ${adAccountId} with ${csvProcessResult.recordsProcessed} records`
    )
}

/**
 * Ad Insights Use Case - Grouped collection of all ad insights export functions
 */
export const AdInsightUseCase = {
    startImportAsync: startImportAsync,
}
