import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import { scheduleInput } from "@/lib/calendar";
import { failure, hashToken, json, sameOrigin } from "@/lib/api";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Invalid origin" }, 403);
  try {
    const input = scheduleInput.parse(await request.json());
    const token = randomBytes(32).toString("hex");
    await db()
      .insert(schedules)
      .values({ ...input, tokenHash: hashToken(token) });
    return json({ token }, 201);
  } catch (error) {
    return failure(error);
  }
}
