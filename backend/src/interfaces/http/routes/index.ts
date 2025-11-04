/**
 * HTTP Routes Index
 * Central router configuration with versioning and grouping
 */

import { Router } from 'express'
import { facebookAuthRoutes } from './facebook-auth.routes'
import { adInsightsRoutes } from './ad-insights.routes'
import { adAccountSettingRoutes } from './ad-account-setting.routes'
import { suggestionRoutes } from './suggestion.routes'

/**
 * Creates v1 API router with all sub-routes
 */
export const v1Router = Router()

// Auth routes
v1Router.use('/auth/facebook', facebookAuthRoutes)

// Ad Insights routes
v1Router.use('/ad-insights', adInsightsRoutes)

// Ad Account Setting routes
v1Router.use('/ad-account-settings', adAccountSettingRoutes)

// Suggestion routes
v1Router.use('/suggestions', suggestionRoutes)

/**
 * Main API router with versioning
 */
export const apiRouter = Router()

// Version 1
apiRouter.use('/v1', v1Router)

// Default to v1 (backward compatibility)
apiRouter.use('/', v1Router)
