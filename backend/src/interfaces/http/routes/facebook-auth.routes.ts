/**
 * Facebook Authentication Routes
 * RESTful routes for Facebook OAuth integration
 */

import { Router } from 'express'
import * as facebookAuthController from '../controllers/FacebookAuthController'

/**
 * Facebook authentication routes
 *
 * Routes:
 * - POST   /session   - Connect or disconnect Facebook
 * - GET    /callback  - OAuth callback handler
 */
export const facebookAuthRoutes = Router()

// Session management
facebookAuthRoutes.post('/session', facebookAuthController.handleSession)

// OAuth flow
facebookAuthRoutes.get('/callback', facebookAuthController.handleCallback)
