/**
 * Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod'

export const SessionActionSchema = z.object({
    action: z.enum(['connect', 'disconnect']),
    accountId: z.string().min(1).optional(),
})

export const CallbackQuerySchema = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
})

export const AccountIdQuerySchema = z.object({
    accountId: z.string().min(1),
})

// ============================================================================
// Ad Account Setting Schemas
// ============================================================================

/**
 * Schema for ad account identifier in URL path parameter
 */
export const AdAccountIdParamSchema = z.object({
    adAccountId: z.string().min(1, 'Ad account ID is required'),
})

/**
 * Schema for upsert ad account setting request body
 * All metric threshold fields and suggestion parameters are optional
 */
export const UpsertAdAccountSettingSchema = z.object({
    impressions: z.number().optional(),
    clicks: z.number().optional(),
    spend: z.number().optional(),
    cpm: z.number().optional(),
    cpc: z.number().optional(),
    ctr: z.number().optional(),
    reach: z.number().optional(),
    frequency: z.number().optional(),
    linkCtr: z.number().optional(),
    costPerInlineLinkClick: z.number().optional(),
    costPerResult: z.number().optional(),
    roas: z.number().optional(),
    scalePercent: z.number().optional(),
    note: z.string().optional(),
}).strict() // Reject unknown fields
