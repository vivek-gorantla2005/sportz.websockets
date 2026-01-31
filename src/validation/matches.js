import { z } from 'zod';

/**
 * Constant for match statuses to maintain consistency across the app
 */
export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished',
};

/**
 * Validates ISO 8601 date strings
 */
const isoDateString = z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date string',
});

/**
 * Schema for listing matches with pagination limits
 */
export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Schema for validating match ID in request parameters
 */
export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

/**
 * Schema for creating a new match
 */
export const createMatchSchema = z
    .object({
        sport: z.string().trim().min(1, 'Sport is required'),
        homeTeam: z.string().trim().min(1, 'Home team is required'),
        awayTeam: z.string().trim().min(1, 'Away team is required'),
        startTime: isoDateString,
        endTime: isoDateString.optional(),
        homeScore: z.coerce.number().int().nonnegative().default(0).optional(),
        awayScore: z.coerce.number().int().nonnegative().default(0).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.endTime && data.startTime) {
            const start = new Date(data.startTime);
            const end = new Date(data.endTime);

            if (end <= start) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'End time must be after start time',
                    path: ['endTime'],
                });
            }
        }
    });

/**
 * Schema for updating match scores
 */
export const updateScoreSchema = z.object({
    homeScore: z.coerce.number().int().nonnegative(),
    awayScore: z.coerce.number().int().nonnegative(),
});
