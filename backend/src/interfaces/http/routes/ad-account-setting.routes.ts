/**
 * Ad Account Setting Routes
 * RESTful routes for ad account settings including metric thresholds and suggestion parameters
 */

import { Router } from 'express'
import * as adAccountSettingController from '../controllers/AdAccountSettingController'

/**
 * Ad account setting routes
 *
 * Routes:
 * - PUT    /:adAccountId   - Upsert ad account setting
 * - GET    /:adAccountId   - Retrieve ad account setting (returns default if not found)
 */
export const adAccountSettingRoutes = Router()

// Upsert ad account setting
adAccountSettingRoutes.put('/:adAccountId', adAccountSettingController.upsertAdAccountSetting)

// Retrieve ad account setting
adAccountSettingRoutes.get('/:adAccountId', adAccountSettingController.getAdAccountSetting)
