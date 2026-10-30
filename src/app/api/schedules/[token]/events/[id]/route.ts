import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eventInput } from "@/lib/calendar";
import { failure, findSchedule, json, sameOrigin } from "@/lib/api";
type Context = { params: Promise<{ token: string; id: string }> };
async function mutate(request: Request, context: Context, remove: boolean) {
  if (!sameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  try {
    const { token, id } = await context.params;
    z.uuid().parse(id);
    const schedule = await findSchedule(token);
    if (!schedule) return json({ error: "Schedule not found" }, 404);
    const body = await request.json();
    const version = z.number().int().positive().parse(body.version);
    const where = and(
      eq(events.id, id),
      eq(events.scheduleId, schedule.id),
      eq(events.version, version),
    );
    const result = remove
      ? await db().delete(events).where(where).returning({ id: events.id })
      : await db()
          .update(events)
          .set({
            ...eventInput.parse(body),
            version: sql`${events.version} + 1`,
          })
          .where(where)
          .returning();
    if (!result.length)
      return json(
        {
          error:
            "This event changed or was deleted by your partner. Close this window and reopen the event to get the latest version.",
        },
        409,
      );
    return json(result[0]);
  } catch (error) {
    return failure(error);
  }
}
export const PATCH = (request: Request, context: Context) =>
  mutate(request, context, false);
export const DELETE = (request: Request, context: Context) =>
  mutate(request, context, true);
