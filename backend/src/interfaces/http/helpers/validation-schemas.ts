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
export const UpsertAdAccountSettingSchema = z
    .object({
        cpm: z.number().optional(),
        ctr: z.number().optional(),
        frequency: z.number().optional(),
        inlineLinkCtr: z.number().optional(),
        costPerInlineLinkClick: z.number().optional(),
        purchaseRoas: z.number().optional(),
        purchases: z.number().optional(),
        costPerPurchase: z.number().optional(),
        scalePercent: z.number().optional(),
        note: z.string().optional(),
        initScaleDay: z.number().optional(),
    })
    .strict() // Reject unknown fields
