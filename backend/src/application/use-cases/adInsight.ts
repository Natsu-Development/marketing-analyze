/**
 * Use Case: Export Ad Insights
 * Exports ad insights for all active ad accounts using Facebook async reporting API
 */

import { Account, AccountDomain, AccountService } from '../../domain'
import { ADSET_INSIGHT_FIELDS } from '../entities/AdSetInsight'
import { ExportResultFactory } from '../factories/ExportResultFactory'
import { exportResultRepository } from '../../infrastructure/mongo-db/repositories/ExportResultRepository'
import { accountRepository } from '../../config/dependencies'
import { adInsightsClient } from '../../infrastructure/facebook-sdk/InsightClient'
import { CsvProcessorService } from '../services/csvProcessor'
import { logger } from '../../infrastructure/shared/logger'

export interface AdInsightsTimeRange {
    since: string // YYYY-MM-DD format
    until: string // YYYY-MM-DD format
}

export interface AdInsightExportRequest {
    timeRange: AdInsightsTimeRange
}

export interface AdInsightExportResponse {
    success: boolean
    exportsCreated: number
    adAccountIds: string[]
    errors?: string[]
}

/**
 * Export ad insights for all connections with active ad accounts
 */
export async function startImportAsync(request?: AdInsightExportRequest): Promise<AdInsightExportResponse> {
    logger.info('Starting import insight')

    try {
        // Find all accounts from database
        const allAccounts = await findAllAccounts()

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
    const exportResult = ExportResultFactory.createExportResultForAdInsights(
        adAccountId,
        reportResponse.reportRunId,
        csvResult.fileUrl,
        csvProcessResult.recordsProcessed,
        timeRange,
        csvResult.completedAt
    )

    await exportResultRepository.save(exportResult)
    logger.info(
        `Saved ${level} export result for ad account ${adAccountId} with ${csvProcessResult.recordsProcessed} records`
    )
}

/**
 * Helper function to find all accounts
 * Note: This needs to be added to the repository interface
 */
async function findAllAccounts(): Promise<Account[]> {
    // For now, we'll need to access the model directly
    // This should be added to the repository interface in a proper implementation
    const { AccountSchema } = await import('../../infrastructure/mongo-db/schemas/AccountSchema')
    const accounts = await AccountSchema.find({ status: 'connected' })
    return accounts.map((doc: any) => {
        const plainDoc = doc.toObject()
        return {
            id: plainDoc._id.toString(),
            accountId: plainDoc.accountId,
            accessToken: plainDoc.accessToken,
            scopes: [...plainDoc.scopes],
            status: plainDoc.status,
            connectedAt: plainDoc.connectedAt,
            expiresAt: plainDoc.expiresAt,
            lastErrorCode: plainDoc.lastErrorCode,
            lastSyncAt: plainDoc.lastSyncAt,
            adAccounts: (plainDoc.adAccounts || []).map((account: any) => ({
                name: account.name,
                status: account.status,
                currency: account.currency,
                timezone: account.timezone,
                spendCap: account.spendCap,
                adAccountId: account.adAccountId,
                isActive: account.isActive || false,
            })),
            createdAt: plainDoc.createdAt,
            updatedAt: plainDoc.updatedAt,
        }
    })
}

/**
 * Ad Insights Use Case - Grouped collection of all ad insights export functions
 */
export const AdInsightUseCase = {
    startImportAsync: startImportAsync,
}
