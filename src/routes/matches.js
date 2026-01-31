import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";
export const matchRouter = Router();
const MAX_LIMIT = 100

matchRouter.get('/', async (req, res) => {
    try {
        const parsed = listMatchesQuerySchema.parse(req.query)

        const limit = Math.min(parsed.limit ?? 50, MAX_LIMIT)

        const rows = await db
            .select()
            .from(matches)
            .orderBy(desc(matches.createdAt))
            .limit(limit)

        return res.status(200).json({ matches: rows })
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: "invalid query parameters",
            })
        }

        return res.status(500).json({
            error: "internal server error failed to list matches",
        })
    }
})

matchRouter.post('/', async (req, res) => {
    try {
        const parsed = createMatchSchema.parse(req.body)

        const { startTime, endTime, homeScore, awayScore } = parsed

        const [event] = await db.insert(matches).values({
            ...parsed,
            startTime: new Date(startTime),
            endTime: endTime ? new Date(endTime) : null,
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime),
        }).returning()

        return res.status(201).json({
            message: "Match created successfully",
            event,
        })
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: "invalid payload",
                details: error.errors,
            })
        }

        return res.status(500).json({
            error: "internal server error failed to create a match",
        })
    }
})