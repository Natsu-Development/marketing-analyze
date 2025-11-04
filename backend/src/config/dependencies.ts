/**
 * Dependency Initialization
 * Re-exports singleton instances from infrastructure components
 */

import { appConfig } from './env'

export { accountRepository } from '../infrastructure/database/mongodb/repositories/AccountRepository'
export { facebookClient } from '../infrastructure/external-services/facebook/FacebookClient'
export { telegramClient } from '../infrastructure/external-services/telegram/TelegramClient'
export { exportResultRepository } from '../infrastructure/database/mongodb/repositories/ExportResultRepository'
export { adsetInsightDataRepository } from '../infrastructure/database/mongodb/repositories/AdInsightRepository'
export { adSetRepository } from '../infrastructure/database/mongodb/repositories/AdSetRepository'
export { adAccountSettingRepository } from '../infrastructure/database/mongodb/repositories/AdAccountSettingRepository'
export { suggestionRepository } from '../infrastructure/database/mongodb/repositories/SuggestionRepository'

export const facebookConfig = {
    appId: appConfig.facebook.appId,
    redirectUri: appConfig.facebook.redirectUri,
    apiVersion: appConfig.facebook.apiVersion,
}
