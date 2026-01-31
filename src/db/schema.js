import { pgTable, serial, text, integer, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Enum for match status
 */
export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished']);

/**
 * Matches table - Stores the core match information
 */
export const matches = pgTable('matches', {
    id: serial('id').primaryKey(),
    sport: text('sport').notNull(),
    homeTeam: text('home_team').notNull(),
    awayTeam: text('away_team').notNull(),
    status: matchStatusEnum('status').default('scheduled').notNull(),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    homeScore: integer('home_score').default(0).notNull(),
    awayScore: integer('away_score').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Commentary table - Stores real-time play-by-play events
 */
export const commentary = pgTable('commentary', {
    id: serial('id').primaryKey(),
    matchId: integer('match_id')
        .references(() => matches.id, { onDelete: 'cascade' })
        .notNull(),
    minute: integer('minute'),
    sequence: integer('sequence').notNull(),
    period: text('period'),
    eventType: text('event_type').notNull(), // e.g., 'goal', 'card', 'substitution'
    actor: text('actor'), // The player involved
    team: text('team'), // The team responsible for the event
    message: text('message').notNull(),
    metadata: jsonb('metadata'), // Flexible field for extra event details
    tags: text('tags').array(), // Searchable tags
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Relations definition for convenient querying
 */
export const matchesRelations = relations(matches, ({ many }) => ({
    commentaries: many(commentary),
}));

export const commentaryRelations = relations(commentary, ({ one }) => ({
    match: one(matches, {
        fields: [commentary.matchId],
        references: [matches.id],
    }),
}));
