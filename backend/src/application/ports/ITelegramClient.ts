/**
 * Telegram Client Port Interface
 * Interface for sending Telegram notifications
 */

import { Suggestion } from '../../domain/aggregates/suggestion/Suggestion'

export interface NotifyParams {
    suggestions: Suggestion[]
    accountId: string
}

export interface SendMessageResponse {
    success: boolean
    messageId?: number
    error?: string
}

/**
 * Telegram Client Interface
 */
export interface ITelegramClient {
    /**
     * Send grouped notification for suggestions
     */
    notify(params: NotifyParams): Promise<SendMessageResponse>
}
