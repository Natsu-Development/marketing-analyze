/**
 * Dependency Initialization
 * Re-exports singleton instances from infrastructure components
 */

import { appConfig } from './env'

export { accountRepository } from '../infrastructure/database/mongodb/repositories/AccountRepository'
export { facebookOAuthClient } from '../infrastructure/external-services/facebook/AuthClient'
export { adInsightsClient } from '../infrastructure/external-services/facebook/InsightClient'
export { exportResultRepository } from '../infrastructure/database/mongodb/repositories/ExportResultRepository'
export { adsetInsightDataRepository } from '../infrastructure/database/mongodb/repositories/AdInsightRepository'

export const facebookConfig = {
    appId: appConfig.facebook.appId,
    redirectUri: appConfig.facebook.redirectUri,
    apiVersion: appConfig.facebook.apiVersion,
}
