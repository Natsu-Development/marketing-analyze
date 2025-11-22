/**
 * Telegram Client - Send notifications via Telegram Bot API
 */

import axios from 'axios'
import { appConfig } from '../../../config/env'
import { logger } from '../../shared/logger'
import { ITelegramClient, NotifyParams, NotifyResult } from '../../../application/ports/ITelegramClient'
import { Suggestion } from '../../../domain/aggregates/suggestion/Suggestion'

const API_URL = 'https://api.telegram.org'

/**
 * Group suggestions by ad account name
 */
function groupByAccount(suggestions: Suggestion[]): Map<string, Suggestion[]> {
    const grouped = new Map<string, Suggestion[]>()
    for (const s of suggestions) {
        const list = grouped.get(s.adAccountName) || []
        list.push(s)
        grouped.set(s.adAccountName, list)
    }
    return grouped
}

/**
 * Build section for a suggestion type (adset or campaign)
 */
function buildSection(title: string, suggestions: Suggestion[], frontendUrl: string): string[] {
    if (suggestions.length === 0) return []

    const lines = [`<b>${title} (${suggestions.length})</b>`, '']

    for (const [accountName, items] of groupByAccount(suggestions)) {
        lines.push(`<b>${accountName}</b>`)
        for (const s of items) {
            lines.push(`  • <a href="${frontendUrl}/suggestions/${s.id}">${s.adsetName}</a>`)
        }
        lines.push('')
    }

    return lines
}

/**
 * Build notification message
 */
function buildMessage(params: NotifyParams): string {
    const { adsets, campaigns } = params
    const frontendUrl = appConfig.frontend.url
    const total = adsets.length + campaigns.length

    return [
        '🎯 <b>Budget Suggestions Created</b>',
        '',
        `📊 <b>${total} Item${total > 1 ? 's' : ''} Ready for Scaling</b>`,
        '',
        ...buildSection('AdSets Ready for Scaling', adsets, frontendUrl),
        ...buildSection('Campaigns Ready for Scaling', campaigns, frontendUrl),
        '💡 <i>Click on each name to view details and apply changes</i>',
    ].join('\n')
}

/**
 * Send notification
 */
async function notify(params: NotifyParams): Promise<NotifyResult> {
    const { botToken, chatId } = appConfig.telegram

    if (!botToken || !chatId) {
        logger.debug('Telegram not configured')
        return { success: false, error: 'Not configured' }
    }

    const total = params.adsets.length + params.campaigns.length
    if (total === 0) {
        return { success: true }
    }

    try {
        const response = await axios.post(`${API_URL}/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: buildMessage(params),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        })

        if (!response.data.ok) {
            logger.warn(`Telegram failed: ${response.data.description}`)
            return { success: false, error: response.data.description }
        }

        logger.info(`Telegram sent: ${total} suggestions (msg_id: ${response.data.result.message_id})`)
        return { success: true, messageId: response.data.result.message_id }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown'
        logger.error(`Telegram error: ${msg}`)
        return { success: false, error: msg }
    }
}

export const telegramClient: ITelegramClient = { notify }
