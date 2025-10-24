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
 * - GET    /status    - Get connection status
 * - GET    /token     - Get valid access token
 */
export const facebookAuthRoutes = Router()

// Session management
facebookAuthRoutes.post('/session', facebookAuthController.handleSession)

// OAuth flow
facebookAuthRoutes.get('/callback', facebookAuthController.handleCallback)

// Status and token
facebookAuthRoutes.get('/status', facebookAuthController.getStatus)
facebookAuthRoutes.get('/token', facebookAuthController.getToken)

// Ad Account Management
facebookAuthRoutes.post('/:userId/refresh-ad-accounts', facebookAuthController.refreshAdAccounts)
facebookAuthRoutes.put('/:userId/ad-accounts/:adAccountId/active', facebookAuthController.updateAdAccountActive)
