/**
 * Use Case: Export Ad Insights
 * Exports ad insights for all active ad accounts using Facebook async reporting API
 */

import { Account, ExportResultDomain, AccountDomain, ADSET_INSIGHT_FIELDS } from '../../domain'
import { exportResultRepository } from '../../infrastructure/mongo-db/repositories/ExportResultRepository'
import { accountRepository } from '../../config/dependencies'
import { adInsightsClient } from '../../infrastructure/external/AdInsightsClient'
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
 * Get the date range based on lastSyncAt or default to 365 days
 */
export function getTimeRangeFromAccount(account: Account): AdInsightsTimeRange {
    const { since, until } = AccountDomain.getAccountSyncTimeRange(account)

    return {
        since: since.toISOString().split('T')[0], // YYYY-MM-DD
        until: until.toISOString().split('T')[0], // YYYY-MM-DD
    }
}

/**
 * Export ad insights for all connections with active ad accounts
 */
export async function exportInsights(request?: AdInsightExportRequest): Promise<AdInsightExportResponse> {
    logger.info('Starting ad insights export')

    try {
        // Find all accounts from database
        const allAccounts = await findAllAccounts()

        let exportsCreated = 0
        const adAccountIds: string[] = []
        const errors: string[] = []

        for (const account of allAccounts) {
            // Check if account is valid
            if (AccountDomain.isAccountExpired(account) || account.status !== 'connected') {
                logger.warn(`Skipping account ${account.accountId} - expired or disconnected`)
                continue
            }

            // Get active ad accounts
            const activeAdAccounts = AccountDomain.getActiveAdAccounts(account)

            if (activeAdAccounts.length === 0) {
                logger.info(`No active ad accounts for account ${account.accountId}`)
                continue
            }

            // Get time range for this account
            const timeRange = request?.timeRange || getTimeRangeFromAccount(account)
            logger.info(`Using time range for account ${account.accountId}: ${timeRange.since} to ${timeRange.until}`)

            let accountExportSuccess = true

            // Export for each active ad account
            for (const adAccount of activeAdAccounts) {
                try {
                    await exportForAccount(account, adAccount.adAccountId, timeRange, 'adset')
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
                const updatedAccount = AccountDomain.updateAccountLastSyncAt(account)
                await accountRepository.save(updatedAccount)
                logger.info(`Updated lastSyncAt for account ${account.accountId}`)
            }
        }

        logger.info(`Ad insights export completed. Created ${exportsCreated} exports`)

        return {
            success: errors.length === 0,
            exportsCreated,
            adAccountIds,
            errors: errors.length > 0 ? errors : undefined,
        }
    } catch (error) {
        const errorMsg = `Failed to export ad insights: ${(error as Error).message}`
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
 * Export ad insights for a specific ad account
 */
async function exportForAccount(
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

    // Save export result
    const exportResult = ExportResultDomain.createExportResult({
        adAccountId,
        reportRunId: reportResponse.reportRunId,
        fileUrl: csvResult.fileUrl,
        recordCount: csvProcessResult.recordsProcessed,
        timeRange,
        status: 'completed',
        completedAt: csvResult.completedAt,
    })

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
    export: exportInsights,
    getTimeRangeFromAccount,
}
