/**
 * CSV Data Processor Service
 * Streams CSV from URL → Parses → Saves in batches (low memory usage)
 */

import axios from 'axios'
import { parse } from 'csv-parse'
import { Readable } from 'stream'
import { logger } from '../../infrastructure/shared/logger'
import { adsetInsightDataRepository } from '../../config/dependencies'
import { CsvService } from './CsvService'
import { AdSetInsight, AdSetInsightDomain } from '../../domain/aggregates/adset-insights'

export interface ProcessCSVRequest {
    fileUrl: string
    adAccountId: string
    level: 'adset'
}

export interface ProcessCSVResponse {
    success: boolean
    recordsProcessed: number
    error?: string
}

const BATCH_SIZE = 1000 // MongoDB optimal batch size

/**
 * Stream CSV from URL and process in batches
 */
async function processAdsetCSV(fileUrl: string, adAccountId: string): Promise<number> {
    // Stream CSV from URL
    const response = await axios.get(fileUrl, { responseType: 'stream' })
    const stream = response.data as Readable

    // Setup CSV parser
    const parser = parse({
        columns: (headers) => headers.map(CsvService.normalizeCsvHeader),
        skip_empty_lines: true,
        trim: true,
    })

    let batch: AdSetInsight[] = []
    let totalSaved = 0
    let errorCount = 0

    return new Promise<number>((resolve, reject) => {
        parser.on('readable', async () => {
            let record
            while ((record = parser.read()) !== null) {
                try {
                    const props = AdSetInsightDomain.mapRecordToAdSetInsight(record, adAccountId)
                    const insight = AdSetInsightDomain.createAdSetInsight(props)
                    batch.push(insight)

                    // Save when batch is full
                    if (batch.length >= BATCH_SIZE) {
                        parser.pause()
                        await adsetInsightDataRepository.saveBatch(batch)
                        
                        totalSaved += batch.length
                        batch = []
                        parser.resume()
                    }
                } catch (error) {
                    errorCount++
                    if (errorCount <= 3) logger.warn(`Parse error: ${(error as Error).message}`)
                }
            }
        })

        parser.on('error', reject)

        parser.on('end', async () => {
            // Save remaining records
            if (batch.length > 0) {
                await adsetInsightDataRepository.saveBatch(batch)
                totalSaved += batch.length
            }
            if (errorCount > 0) logger.warn(`Completed with ${errorCount} errors`)
            resolve(totalSaved)
        })

        stream.pipe(parser)
    })
}

/**
 * Process CSV file based on level
 */
export async function process(request: ProcessCSVRequest): Promise<ProcessCSVResponse> {
    const { fileUrl, adAccountId, level } = request

    try {
        const recordsProcessed = await processAdsetCSV(fileUrl, adAccountId)

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
