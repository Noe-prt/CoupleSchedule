import { z } from "zod";
export const scheduleInput = z.object({
  title: z.string().trim().min(1).max(80),
  personOne: z.string().trim().min(1).max(30),
  personTwo: z.string().trim().min(1).max(30),
});
export const dayInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return !isNaN(+d) && d.toISOString().slice(0, 10) === v;
  }, "Choose a valid date");
export const eventInput = z
  .object({
    title: z.string().trim().min(1).max(100),
    notes: z.string().trim().max(1000).default(""),
    location: z.string().trim().max(120).default(""),
    person: z.enum(["one", "two", "both"]),
    day: dayInput,
    start: z.number().int().min(0).max(1439),
    end: z.number().int().min(1).max(1440),
  })
  .refine((v) => v.end > v.start, {
    message: "End time must be after start time",
    path: ["end"],
  });
export type CalendarEvent = z.infer<typeof eventInput> & {
  id: string;
  version: number;
};
export type Schedule = z.infer<typeof scheduleInput>;
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function monday(d: Date) {
  const result = new Date(d);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
export function addDays(d: Date, n: number) {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}
export function timeLabel(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
// Give simultaneous events separate lanes so every event remains clickable.
export function layoutEvents(items: CalendarEvent[]) {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const result: { event: CalendarEvent; lane: number; lanes: number }[] = [];
  let group: typeof result = [],
    ends: number[] = [],
    groupEnd = -1;
  const flush = () => {
    for (const item of group) item.lanes = ends.length;
    result.push(...group);
    group = [];
    ends = [];
  };
  for (const event of sorted) {
    if (event.start >= groupEnd) flush();
    let lane = ends.findIndex((end) => end <= event.start);
    if (lane === -1) lane = ends.length;
    ends[lane] = event.end;
    group.push({ event, lane, lanes: 1 });
    groupEnd = Math.max(groupEnd, event.end);
  }
  flush();
  return result;
}
