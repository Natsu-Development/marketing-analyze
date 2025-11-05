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
 * - POST   /:accountId/refresh-ad-accounts - Refresh ad accounts
 * - PUT    /:accountId/ad-accounts/:adAccountId/active - Update ad account active status
 */
export const facebookAuthRoutes = Router()

// Session management
facebookAuthRoutes.post('/session', facebookAuthController.handleSession)

// OAuth flow
facebookAuthRoutes.get('/callback', facebookAuthController.handleCallback)

// Ad Account Management
facebookAuthRoutes.post('/:accountId/refresh-ad-accounts', facebookAuthController.refreshAdAccounts)
facebookAuthRoutes.put('/:accountId/ad-accounts/:adAccountId/active', facebookAuthController.updateAdAccountActive)
