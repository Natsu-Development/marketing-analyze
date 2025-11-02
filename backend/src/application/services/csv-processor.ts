/**
 * CSV Data Processor Service
 * Downloads, parses, and stores CSV data from Facebook reports
 */

import axios from 'axios'
import { logger } from '../../infrastructure/shared/logger'
import { adsetInsightDataRepository } from '../../config/dependencies'
import { CsvService } from './CsvService'

export interface ProcessCSVRequest {
    fileUrl: string
    adAccountId: string
    level: 'adset'
    accessToken?: string // Optional access token for Facebook CSV downloads
}

export interface ProcessCSVResponse {
    success: boolean
    recordsProcessed: number
    error?: string
}

/**
 * Process CSV file for adset level data
 * Application layer handles infrastructure (downloading, saving), domain layer handles business logic
 */
async function processAdsetCSV(fileUrl: string, adAccountId: string, accessToken?: string): Promise<number> {
    try {
        // Infrastructure: Download CSV file
        const downloadUrl =
            fileUrl.includes('export_report') && accessToken ? `${fileUrl}&access_token=${accessToken}` : fileUrl

        const response = await axios.get(downloadUrl, {
            responseType: 'text',
        })
        const csvContent = response.data as string

        // Domain: Parse and transform CSV content to domain entities
        const processingResult = CsvService.parseCsvToInsights(csvContent, adAccountId)

        if (processingResult.errors.length > 0) {
            logger.warn(
                `CSV errors: ${processingResult.errors.slice(0, 3).join('; ')}${processingResult.errors.length > 3 ? '...' : ''}`
            )
        }

        // Validate processing results using domain service
        const validation = CsvService.validateCsvResult(processingResult)
        if (!validation.valid) {
            logger.warn(`CSV validation failed: ${validation.errors.join('; ')}`)
        }

        // Infrastructure: Store domain entities in database
        await adsetInsightDataRepository.saveBatch(processingResult.insights)

        return processingResult.processed
    } catch (error) {
        logger.error(`CSV processing failed: ${(error as Error).message}`)
        throw error
    }
}

/**
 * Process CSV file based on level
 */
export async function process(request: ProcessCSVRequest): Promise<ProcessCSVResponse> {
    const { fileUrl, adAccountId, level, accessToken } = request

    try {
        const recordsProcessed = await processAdsetCSV(fileUrl, adAccountId, accessToken)

        logger.info(`Processed ${recordsProcessed} ${level} records for ${adAccountId}`)

        return {
            success: true,
            recordsProcessed,
        }
    } catch (error) {
        const errorMsg = `CSV processing failed: ${(error as Error).message}`
        logger.error(errorMsg)
        return {
            success: false,
            recordsProcessed: 0,
            error: errorMsg,
        }
    }
}

/**
 * CSV Processor Service - Grouped collection of all CSV processing functions
 */
export const CsvProcessorService = {
    process,
}
