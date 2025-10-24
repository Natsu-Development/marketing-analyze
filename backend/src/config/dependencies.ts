/**
 * Dependency Initialization
 * Re-exports singleton instances from infrastructure components
 */

import { appConfig } from './env'

export { facebookConnectionRepository } from '../infrastructure/mongo-db/ConnectionRepository'
export { facebookOAuthClient } from '../infrastructure/FacebookClient'

export const facebookConfig = {
    appId: appConfig.facebook.appId,
    redirectUri: appConfig.facebook.redirectUri,
    apiVersion: appConfig.facebook.apiVersion,
}
