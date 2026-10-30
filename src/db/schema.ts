import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  integer,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const schedules = pgTable("schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 80 }).notNull(),
  personOne: varchar("person_one", { length: 30 }).notNull(),
  personTwo: varchar("person_two", { length: 30 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedules.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 100 }).notNull(),
    notes: varchar("notes", { length: 1000 }).notNull().default(""),
    location: varchar("location", { length: 120 }).notNull().default(""),
    person: varchar("person", { length: 8 }).notNull(),
    day: date("day").notNull(),
    start: integer("start_minute").notNull(),
    end: integer("end_minute").notNull(),
    version: integer("version").notNull().default(1),
  },
  (t) => [
    index("events_schedule_day_idx").on(t.scheduleId, t.day),
    check(
      "events_time_check",
      sql`${t.start} >= 0 AND ${t.end} <= 1440 AND ${t.end} > ${t.start}`,
    ),
    check("events_person_check", sql`${t.person} IN ('one', 'two', 'both')`),
  ],
);
