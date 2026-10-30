import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { events, schedules } from "@/db/schema";
import { dayInput, scheduleInput } from "@/lib/calendar";
import { failure, findSchedule, json, sameOrigin } from "@/lib/api";
type Context = { params: Promise<{ token: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const schedule = await findSchedule(token);
    if (!schedule)
      return json(
        { error: "Schedule not found. Check your shared link." },
        404,
      );
    const query = new URL(request.url).searchParams;
    const from = dayInput.parse(query.get("from")),
      to = dayInput.parse(query.get("to"));
    if (to < from || (+new Date(to) - +new Date(from)) / 86400000 > 31)
      return json({ error: "Choose a range of up to 31 days" }, 400);
    const rows = await db()
      .select({
        id: events.id,
        title: events.title,
        notes: events.notes,
        location: events.location,
        person: events.person,
        day: events.day,
        start: events.start,
        end: events.end,
        version: events.version,
      })
      .from(events)
      .where(
        and(
          eq(events.scheduleId, schedule.id),
          gte(events.day, from),
          lte(events.day, to),
        ),
      );
    const { id: _id, ...publicSchedule } = schedule;
    return json({ schedule: publicSchedule, events: rows });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  if (!sameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  try {
    const schedule = await findSchedule((await context.params).token);
    if (!schedule) return json({ error: "Schedule not found" }, 404);
    const input = scheduleInput.parse(await request.json());
    await db()
      .update(schedules)
      .set(input)
      .where(eq(schedules.id, schedule.id));
    return json(input);
  } catch (error) {
    return failure(error);
  }
}
