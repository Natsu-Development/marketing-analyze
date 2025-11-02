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
                logger.info(`Skipping ${account.accountId}: ${schedulingDecision.reason}`)
                continue
            }

            // Get active ad accounts
            const activeAdAccounts = AccountDomain.getActiveAdAccounts(account)

            if (activeAdAccounts.length === 0) {
                continue
            }

            let accountExportSuccess = true

            // Export for each active ad account
            for (const adAccount of activeAdAccounts) {
                try {
                    // Calculate per-account time range using lastSyncInsight or fallback
                    const timeRange = AccountDomain.getAdAccountInsightSyncTimeRange(account, adAccount.adAccountId)

                    // Domain: Validate time range
                    const timeRangeValidation = AccountService.validateTimeRange(timeRange)
                    if (!timeRangeValidation.valid) {
                        logger.warn(`Invalid time range for ${adAccount.adAccountId}: ${timeRangeValidation.errors.join(', ')}`)
                        continue
                    }

                    logger.info(`Syncing insights for ${adAccount.adAccountId} from ${timeRange.since} to ${timeRange.until}`)

                    await importAsyncInsight(account, adAccount.adAccountId, timeRange, 'adset')
                    exportsCreated += 1
                    adAccountIds.push(adAccount.adAccountId)

                    // Update lastSyncInsight for this ad account
                    const now = new Date()
                    AccountDomain.updateAdAccountSyncInsight(account, adAccount.adAccountId, now)
                    logger.info(`Updated lastSyncInsight for ${adAccount.adAccountId} to ${now.toISOString()}`)
                } catch (error) {
                    accountExportSuccess = false
                    const errorMsg = `Export failed ${adAccount.adAccountId}: ${(error as Error).message}`
                    errors.push(errorMsg)
                    logger.error(errorMsg)
                }
            }

            // Update global lastSyncAt for backward compatibility if all exports succeeded
            if (accountExportSuccess && activeAdAccounts.length > 0) {
                AccountDomain.updateAccountLastSync(account)
            }
        }

        logger.info(`Import completed: ${exportsCreated} exports`)

        return {
            success: errors.length === 0,
            exportsCreated,
            adAccountIds,
            errors: errors.length > 0 ? errors : undefined,
        }
    } catch (error) {
        const errorMsg = `Import failed: ${(error as Error).message}`
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

    logger.info(`Created report ${reportResponse.reportRunId} for ${adAccountId}`)

    // Poll until completion
    const status = await adInsightsClient.pollReportStatus(account.accessToken, reportResponse.reportRunId)

    if (status.asyncStatus !== 'Job Completed') {
        const errorMsg = `Report ${reportResponse.reportRunId} failed: ${status.asyncStatus}`
        logger.error(errorMsg)
        throw new Error(errorMsg)
    }

    // Wait a bit for Facebook to make the CSV available
    await new Promise((resolve) => setTimeout(resolve, 3000)) // Wait 3 seconds

    // Get the CSV result
    const csvResult = await adInsightsClient.getReportCSV(account.accessToken, reportResponse.reportRunId)

    // Process and store CSV data
    const csvProcessResult = await CsvProcessorService.process({
        fileUrl: csvResult.fileUrl,
        adAccountId,
        level,
        accessToken: account.accessToken, // Pass access token for CSV download
    })

    if (!csvProcessResult.success) {
        logger.error(`CSV process failed: ${csvProcessResult.error}`)
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
    logger.info(`Saved ${adAccountId}: ${csvProcessResult.recordsProcessed} records`)
}

/**
 * Ad Insights Use Case - Grouped collection of all ad insights export functions
 */
export const AdInsightUseCase = {
    startImportAsync: startImportAsync,
}
