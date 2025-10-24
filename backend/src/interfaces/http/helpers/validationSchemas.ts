/**
 * Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod'

export const SessionActionSchema = z.object({
    action: z.enum(['connect', 'disconnect']),
    fbUserId: z.string().min(1).optional(),
})

export const CallbackQuerySchema = z.object({
    code: z.string().min(1),
    state: z.string().min(1),
})

export const FbUserIdQuerySchema = z.object({
    fbUserId: z.string().min(1),
})
