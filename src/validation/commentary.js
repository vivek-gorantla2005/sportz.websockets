import z from "zod";

export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

/**
 * Schema for listing commentary entries with pagination limits
 */
export const listCommentaryQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Schema for creating a new commentary entry
 */
export const createCommentarySchema = z.object({
    minute: z.coerce.number().int().nonnegative(),
    sequence: z.coerce.number().int().nonnegative(),
    period: z.string().trim().min(1, 'Period is required'),
    eventType: z.string().trim().min(1, 'Event type is required'),
    actor: z.string().trim().optional(),
    team: z.string().trim().optional(),
    message: z.string().trim().min(1, 'Message is required'),
    metadata: z.record(z.string(), z.any()).default({}),
    tags: z.array(z.string()).default([]),
});
