/**
 * Metric Configuration Routes
 * RESTful routes for user-defined metric configuration per ad account
 */

import { Router } from 'express'
import * as metricConfigController from '../controllers/MetricConfigController'

/**
 * Metric configuration routes
 *
 * Routes:
 * - PUT    /:adAccountId   - Upsert metric configuration for ad account
 * - GET    /:adAccountId   - Retrieve metric configuration (returns default if not found)
 */
export const metricConfigRoutes = Router()

// Upsert metric configuration
metricConfigRoutes.put('/:adAccountId', metricConfigController.upsertMetricConfiguration)

// Retrieve metric configuration
metricConfigRoutes.get('/:adAccountId', metricConfigController.getMetricConfiguration)
