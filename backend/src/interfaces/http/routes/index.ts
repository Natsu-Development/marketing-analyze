/**
 * HTTP Routes Index
 * Central router configuration with versioning and grouping
 */

import { Router } from 'express'
import { facebookAuthRoutes } from './facebook-auth.routes'
import { adsetInsightsRoutes } from './adset-insights.routes'
import { adsetSyncRoutes } from './adset-sync.routes'
import { adAccountSettingRoutes } from './ad-account-setting.routes'
import { suggestionRoutes } from './suggestion.routes'
import { accountRoutes } from './account.routes'
import { adsetRoutes } from './adset.routes'
import { campaignRoutes } from './campaign.routes'

/**
 * Creates v1 API router with all sub-routes
 */
export const v1Router = Router()

// Auth routes
v1Router.use('/auth/facebook', facebookAuthRoutes)

// AdSet Insights routes
v1Router.use('/adset-insights', adsetInsightsRoutes)

// AdSet Sync routes
v1Router.use('/adset-sync', adsetSyncRoutes)

// Ad Account Setting routes
v1Router.use('/ad-account-settings', adAccountSettingRoutes)

// Suggestion routes
v1Router.use('/suggestions', suggestionRoutes)

// Account routes
v1Router.use('/accounts', accountRoutes)

// AdSet routes
v1Router.use('/adsets', adsetRoutes)

// Campaign routes
v1Router.use('/campaigns', campaignRoutes)

/**
 * Main API router with versioning
 */
export const apiRouter = Router()

// Version 1
apiRouter.use('/v1', v1Router)

// Default to v1 (backward compatibility)
apiRouter.use('/', v1Router)
