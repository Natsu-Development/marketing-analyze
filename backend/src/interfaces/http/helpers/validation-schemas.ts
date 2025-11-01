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
