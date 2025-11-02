/**
 * HTTP Routes Index
 * Central router configuration with versioning and grouping
 */

import { Router } from 'express'
import { facebookAuthRoutes } from './facebook-auth.routes'
import { adInsightsRoutes } from './ad-insights.routes'
import { metricConfigRoutes } from './metric-config.routes'

/**
 * Creates v1 API router with all sub-routes
 */
export const v1Router = Router()

// Auth routes
v1Router.use('/auth/facebook', facebookAuthRoutes)

// Ad Insights routes
v1Router.use('/ad-insights', adInsightsRoutes)

// Metric Configuration routes
v1Router.use('/metric-config', metricConfigRoutes)

/**
 * Main API router with versioning
 */
export const apiRouter = Router()

// Version 1
apiRouter.use('/v1', v1Router)

// Default to v1 (backward compatibility)
apiRouter.use('/', v1Router)
