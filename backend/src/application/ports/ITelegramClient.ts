/**
 * Telegram Client Port Interface
 */

import { Suggestion } from '../../domain/aggregates/suggestion/Suggestion'

export interface NotifyParams {
    adsets: Suggestion[]
    campaigns: Suggestion[]
}

export interface NotifyResult {
    success: boolean
    messageId?: number
    error?: string
}

export interface ITelegramClient {
    notify(params: NotifyParams): Promise<NotifyResult>
}
