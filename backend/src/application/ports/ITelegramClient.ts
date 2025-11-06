/**
 * Telegram Client Port Interface
 * Interface for sending Telegram notifications
 */

import { Suggestion } from '../../domain/aggregates/suggestion/Suggestion'

export interface SuggestionNotificationParams {
    suggestion: Suggestion
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
     * Send notification when a new suggestion is created
     */
    notifySuggestionCreated(params: SuggestionNotificationParams): Promise<SendMessageResponse>
}
