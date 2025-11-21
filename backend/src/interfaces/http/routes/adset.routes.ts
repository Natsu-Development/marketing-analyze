/**
 * AdSet Routes
 * RESTful routes for adset listing
 */

import { Router } from 'express'
import * as adsetController from '../controllers/AdSetController'

/**
 * AdSet routes
 *
 * Routes:
 * - GET / - Get adsets with optional pagination, sorted by lastScaledAt descending
 */
export const adsetRoutes = Router()

// Get adsets with pagination
adsetRoutes.get('/', adsetController.getAdSets)
