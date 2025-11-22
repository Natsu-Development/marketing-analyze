/**
 * Telegram Client Adapter
 * Simple implementation for sending notifications via Telegram Bot API
 * KISS: Direct, minimal abstractions
 */

import axios from 'axios'
import { appConfig } from '../../../config/env'
import { logger } from '../../shared/logger'
import {
    ITelegramClient,
    NotifyParams,
    SendMessageResponse,
} from '../../../application/ports/ITelegramClient'
import { Suggestion } from '../../../domain/aggregates/suggestion/Suggestion'

const TELEGRAM_API_BASE = 'https://api.telegram.org'


/**
 * Build grouped message for suggestions (KISS: simple list with links)
 */
function buildMessage(params: NotifyParams): string {
    const { suggestions } = params
    const frontendUrl = appConfig.frontend.url

    const lines = [
        '🎯 <b>Budget Suggestions Created</b>',
        '',
        `📊 <b>${suggestions.length} AdSet${suggestions.length > 1 ? 's' : ''} Ready for Scaling</b>`,
        '',
    ]

    // Group by ad account
    const byAccount = new Map<string, Suggestion[]>()
    suggestions.forEach(s => {
        const existing = byAccount.get(s.adAccountName) || []
        existing.push(s)
        byAccount.set(s.adAccountName, existing)
    })

    // List each suggestion with link
    byAccount.forEach((accountSuggestions, accountName) => {
        lines.push(`<b>${accountName}</b> (${accountSuggestions.length})`)

        accountSuggestions.forEach(suggestion => {
            const suggestionUrl = `${frontendUrl}/suggestions/${suggestion.id}`
            lines.push(`  • <a href="${suggestionUrl}">${suggestion.adsetName}</a>`)
        })

        lines.push('')
    })

    lines.push('💡 <i>Click on each AdSet name to view details and apply changes</i>')

    return lines.join('\n')
}

/**
 * Send notification (KISS: simple error handling, never throw)
 */
async function notify(params: NotifyParams): Promise<SendMessageResponse> {
    try {
        const { botToken, chatId } = appConfig.telegram

        // Skip if not configured
        if (!botToken || !chatId) {
            logger.debug('Telegram not configured, skipping notification')
            return { success: false, error: 'Not configured' }
        }

        // Skip if no suggestions
        if (params.suggestions.length === 0) {
            logger.debug('No suggestions to notify')
            return { success: true }
        }

        // Build and send
        const message = buildMessage(params)
        logger.info(`Sending Telegram notification for ${params.suggestions.length} suggestions`)

        const response = await axios.post(
            `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
            {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
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
    notify,
}
