/**
 * Account Routes
 * RESTful routes for account information
 */

import { Router } from 'express'
import * as accountController from '../controllers/AccountController'

/**
 * Account routes
 *
 * Routes:
 * - GET    /:accountId                                     - Retrieve account information by account ID
 * - POST   /:accountId/refresh-ad-accounts                 - Refresh ad accounts
 * - PUT    /:accountId/ad-accounts/:adAccountId/active     - Update ad account active status
 */
export const accountRoutes = Router()

// Get account info by account ID
accountRoutes.get('/:accountId', accountController.getAccountInfo)

// Refresh ad accounts
accountRoutes.post('/:accountId/refresh-ad-accounts', accountController.refreshAdAccounts)

// Update ad account active status
accountRoutes.put('/:accountId/ad-accounts/:adAccountId/active', accountController.updateAdAccountActive)
