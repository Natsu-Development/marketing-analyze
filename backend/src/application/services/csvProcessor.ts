/**
 * CSV Data Processor Service
 * Downloads, parses, and stores CSV data from Facebook reports
 */

import axios from 'axios'
import { parse } from 'csv-parse/sync'
import { logger } from '../../infrastructure/shared/logger'
import { adsetInsightDataRepository } from '../../infrastructure/mongo-db/repositories/AdsetInsightRepository'
import { AdSetInsight, AdSetInsightDomain, mapRecordToAdSetInsight } from '../../domain'

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

// parseNumeric moved into domain AdSetInsightSpec; local version removed

/**
 * Canonicalize a raw CSV header to our internal key in one pass
 * - lowercases, replaces spaces with underscores
 * - removes parentheses content and common suffixes (e.g., _all, _vnd)
 * - normalizes known aliases to canonical field names
 */
function canonicalizeHeader(fieldName: string): string {
    if (!fieldName) return ''
    // Normalize base form
    let cleaned = fieldName.toLowerCase().replace(/\s+/g, '_').trim()
    // Remove parentheses content and redundant underscores/suffixes
    cleaned = cleaned
        .replace(/\(.*?\)/g, '')
        .replace(/_{2,}/g, '_')
        .replace(/_all$/i, '')
        .replace(/_vnd$/i, '')
        .replace(/^amount_spent_.*$/i, 'amount_spent')
        .replace(/^(3-second|3_second)_video_plays$/i, 'three_second_video_plays')
        .replace(/_$/, '')

    return cleaned
}

/**
 * Process CSV file for adset level data
 */
async function processAdsetCSV(fileUrl: string, adAccountId: string, accessToken?: string): Promise<number> {
    try {
        // Append access token to URL if it's a Facebook export URL
        const downloadUrl =
            fileUrl.includes('export_report') && accessToken ? `${fileUrl}&access_token=${accessToken}` : fileUrl

        logger.info(`Downloading adset CSV from: ${downloadUrl}`)
        const response = await axios.get(downloadUrl, {
            responseType: 'text',
        })
        const csvContent = response.data as string

        logger.info(`Parsing adset CSV data (${csvContent.split('\n').length} lines)`)

        // First, parse with column normalization
        const rawRecords = parse(csvContent, {
            columns: (rawHeader: string[]) => {
                console.log(`Raw header: ${rawHeader.join(', ')}`)
                // One-pass canonicalization
                return rawHeader.map((h) => canonicalizeHeader(h))
            },
            skip_empty_lines: true,
            trim: true,
        })

        // Log first record for debugging
        if (rawRecords.length > 0) {
            logger.info(`Sample record fields: ${Object.keys(rawRecords[0] as Record<string, any>).join(', ')}`)
        }

        const insights: AdSetInsight[] = rawRecords.map((record: any) => {
            // Parse date from reporting_starts or reporting_ends (use starts as primary)
            const dateStr = record.reporting_starts || record.reporting_ends || ''
            let parsedDate = new Date()
            if (dateStr) {
                // Handle both YYYY-MM-DD and other date formats
                const d = new Date(dateStr)
                if (!isNaN(d.getTime())) {
                    parsedDate = d
                    // Set to middle of the day: 12:00:00.000
                    parsedDate.setHours(12, 0, 0, 0)
                }
            }

            const mapped = mapRecordToAdSetInsight(record, adAccountId)
            return AdSetInsightDomain.createAdSetInsight(mapped)
        })

        logger.info(`Storing ${insights.length} adset insights in database`)
        await adsetInsightDataRepository.saveBatch(insights)

        return insights.length
    } catch (error) {
        logger.error(`Error processing adset CSV: ${(error as Error).message}`)
        throw error
    }
}

/**
 * Process CSV file based on level
 */
export async function process(request: ProcessCSVRequest): Promise<ProcessCSVResponse> {
    const { fileUrl, adAccountId, level, accessToken } = request

    try {
        logger.info(`Processing ${level} CSV data for ad account ${adAccountId}`)

        const recordsProcessed = await processAdsetCSV(fileUrl, adAccountId, accessToken)

        logger.info(`Successfully processed ${recordsProcessed} ${level} records`)

        return {
            success: true,
            recordsProcessed,
        }
    } catch (error) {
        const errorMsg = `Failed to process CSV data: ${(error as Error).message}`
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
