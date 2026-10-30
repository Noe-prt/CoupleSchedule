import { db } from "@/db";
import { events } from "@/db/schema";
import { eventInput } from "@/lib/calendar";
import { failure, findSchedule, json, sameOrigin } from "@/lib/api";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!sameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  try {
    const schedule = await findSchedule((await params).token);
    if (!schedule) return json({ error: "Schedule not found" }, 404);
    const input = eventInput.parse(await request.json());
    const [event] = await db()
      .insert(events)
      .values({ ...input, scheduleId: schedule.id })
      .returning();
    return json(event, 201);
  } catch (error) {
    return failure(error);
  }
}
