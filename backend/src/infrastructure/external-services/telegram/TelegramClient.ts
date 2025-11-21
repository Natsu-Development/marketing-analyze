/**
 * Telegram Client Adapter
 * Simple implementation for sending notifications via Telegram Bot API
 * KISS: Direct, minimal abstractions
 */

import axios from 'axios'
import { appConfig } from '../../../config/env'
import { logger } from '../../shared/logger'
import { MetricFieldName } from '../../../domain/aggregates/ad-account-setting/AdAccountSetting'
import {
    ITelegramClient,
    SuggestionNotificationParams,
    SendMessageResponse,
} from '../../../application/ports/ITelegramClient'

const TELEGRAM_API_BASE = 'https://api.telegram.org'

// Simple metric display names
const METRIC_NAMES: Record<MetricFieldName, string> = {
    cpm: 'CPM',
    ctr: 'CTR',
    frequency: 'Frequency',
    inlineLinkCtr: 'Inline Link CTR',
    costPerInlineLinkClick: 'Cost per Link Click',
    purchaseRoas: 'Purchase ROAS',
    purchases: 'Purchases',
    costPerPurchase: 'Cost per Purchase',
}

/**
 * Format number with thousand separators (KISS: use built-in toLocaleString)
 */
function formatNumber(value: number, decimals: number = 0): string {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })
}

/**
 * Format metric value with appropriate unit (KISS: simple if-else)
 */
function formatMetric(metric: MetricFieldName, value: number): string {
    // Currency
    if (metric === 'costPerInlineLinkClick' || metric === 'cpm' || metric === 'costPerPurchase') {
        return `$${formatNumber(value, 2)}`
    }

    // Percentage
    if (metric === 'ctr' || metric === 'inlineLinkCtr') {
        return `${formatNumber(value, 2)}%`
    }

    // ROAS
    if (metric === 'purchaseRoas') {
        return `${formatNumber(value, 2)}x`
    }

    // Count (purchases)
    if (metric === 'purchases') {
        return formatNumber(value, 0)
    }

    // Default: 2 decimals (frequency)
    return formatNumber(value, 2)
}

/**
 * Build notification message (KISS: direct string building)
 */
function buildMessage(params: SuggestionNotificationParams): string {
    const { suggestion } = params

    const lines = [
        '🎯 <b>New Budget Suggestion</b>',
        '',
        `<b>Ad Account:</b> ${suggestion.adAccountName}`,
        `<b>Campaign:</b> ${suggestion.campaignName}`,
        `<b>AdSet:</b> ${suggestion.adsetName}`,
        '',
        '💰 <b>Budget Recommendation:</b>',
        `   Current:    $${formatNumber(suggestion.budget)}`,
        `   Suggested:  $${formatNumber(suggestion.budgetAfterScale)}`,
        `   Increase:   <b>+${suggestion.scalePercent || 0}%</b>`,
        '',
        `📊 <b>Metrics Exceeded (${suggestion.metricsExceededCount}):</b>`,
    ]

    // Add metrics
    suggestion.metrics.forEach((m) => {
        const name = METRIC_NAMES[m.metricName] || m.metricName
        const value = formatMetric(m.metricName, m.value)
        lines.push(`   • ${name}: ${value}`)
    })

    // Add note if exists
    if (suggestion.note) {
        lines.push('', `💡 <i>${suggestion.note}</i>`)
    }

    // Add link
    lines.push('', `<a href="${suggestion.adsetLink}">→ View in Ads Manager</a>`)

    return lines.join('\n')
}

/**
 * Send notification (KISS: simple error handling, never throw)
 */
async function notifySuggestionCreated(
    params: SuggestionNotificationParams,
): Promise<SendMessageResponse> {
    try {
        const { botToken, chatId } = appConfig.telegram

        // Skip if not configured
        if (!botToken || !chatId) {
            logger.debug('Telegram not configured, skipping notification')
            return { success: false, error: 'Not configured' }
        }

        // Build and send
        const message = buildMessage(params)
        logger.info(`Sending Telegram notification for AdSet: ${params.suggestion.adsetId}`)

        const response = await axios.post(
            `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
            {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: false,
            },
        )

        // API error
        if (!response.data.ok) {
            logger.warn(`Telegram failed: ${response.data.description}`)
            return { success: false, error: response.data.description }
        }

        // Success
        logger.info(`Telegram sent (msg_id: ${response.data.result.message_id})`)
        return { success: true, messageId: response.data.result.message_id }

    } catch (error) {
        // Any error - just log and return
        const msg = error instanceof Error ? error.message : 'Unknown'
        logger.error(`Telegram error: ${msg}`)
        return { success: false, error: msg }
    }
}

/**
 * Telegram Client implementation
 */
export const telegramClient: ITelegramClient = {
    notifySuggestionCreated,
}
