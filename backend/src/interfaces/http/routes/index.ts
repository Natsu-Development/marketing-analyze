/**
 * HTTP Routes Index
 * Central router configuration with versioning and grouping
 */

import { Router } from 'express'
import { facebookAuthRoutes } from './facebook-auth.routes'

/**
 * Creates v1 API router with all sub-routes
 */
export const v1Router = Router()

// Auth routes
v1Router.use('/auth/facebook', facebookAuthRoutes)

/**
 * Main API router with versioning
 */
export const apiRouter = Router()

// Version 1
apiRouter.use('/v1', v1Router)

// Default to v1 (backward compatibility)
apiRouter.use('/', v1Router)
