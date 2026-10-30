import "server-only";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import { ZodError } from "zod";
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function findSchedule(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return undefined;
  const [schedule] = await db()
    .select({
      id: schedules.id,
      title: schedules.title,
      personOne: schedules.personOne,
      personTwo: schedules.personTwo,
    })
    .from(schedules)
    .where(eq(schedules.tokenHash, hashToken(token)))
    .limit(1);
  return schedule;
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function failure(error: unknown) {
  if (error instanceof ZodError)
    return json({ error: error.issues[0]?.message ?? "Invalid input" }, 400);
  if (error instanceof SyntaxError) return json({ error: "Invalid JSON" }, 400);
  // Never log request URLs: they contain the calendar access key.
  return json(
    {
      error: process.env.DATABASE_URL
        ? "Could not save or load your schedule. Please try again."
        : "Database setup needed. Set DATABASE_URL and run the migrations.",
    },
    503,
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
