import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";
export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

/**
 * GET /matches/:id/commentary
 * Returns a list of commentary entries for a specific match
 */
commentaryRouter.get("/", async (req, res) => {
    try {
        // Validate match ID from params
        const { id: matchId } = matchIdParamSchema.parse(req.params);

        // Validate query params
        const query = listCommentaryQuerySchema.parse(req.query);
        const limit = Math.min(query.limit ?? 100, MAX_LIMIT);

        // Fetch commentary from database
        const rows = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        return res.status(200).json({ commentary: rows });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors,
            });
        }

        console.error("Error fetching commentary:", error);
        return res.status(500).json({
            error: "Internal server error failed to fetch commentary",
        });
    }
});

/**
 * POST /matches/:id/commentary
 * Adds a new commentary entry for a specific match
 */
commentaryRouter.post("/", async (req, res) => {
    try {
        // Validate match ID from params
        const { id: matchId } = matchIdParamSchema.parse(req.params);

        // Validate commentary data from body
        console.log(req.body)
        const commentaryData = createCommentarySchema.parse(req.body);

        // Insert into database
        const [newCommentary] = await db
            .insert(commentary)
            .values({
                ...commentaryData,
                matchId,
            })
            .returning();

        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(matchId, newCommentary)
        }

        return res.status(201).json({
            message: "Commentary added successfully",
            commentary: newCommentary,
        });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors,
            });
        }

        console.error("Error creating commentary:", error);
        return res.status(500).json({
            error: "Internal server error failed to add commentary",
        });
    }
});
