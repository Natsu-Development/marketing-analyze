/**
 * Dependency Initialization
 * Re-exports singleton instances from infrastructure components
 */

import { appConfig } from './env'

export { accountRepository } from '../infrastructure/mongo-db/repositories/AccountRepository'
export { facebookOAuthClient } from '../infrastructure/facebook-sdk/AuthClient'
export { adInsightsClient } from '../infrastructure/facebook-sdk/InsightClient'
export { exportResultRepository } from '../infrastructure/mongo-db/repositories/ExportResultRepository'
export { adsetInsightDataRepository } from '../infrastructure/mongo-db/repositories/AdInsightRepository'

export const facebookConfig = {
    appId: appConfig.facebook.appId,
    redirectUri: appConfig.facebook.redirectUri,
    apiVersion: appConfig.facebook.apiVersion,
}
