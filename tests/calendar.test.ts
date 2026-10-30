import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  dateKey,
  eventInput,
  layoutEvents,
  monday,
  type CalendarEvent,
} from "../src/lib/calendar";
test("week starts on Monday across month and year boundaries", () => {
  assert.equal(dateKey(monday(new Date(2027, 0, 3, 12))), "2026-12-28");
  assert.equal(
    dateKey(addDays(monday(new Date(2027, 0, 3, 12)), 6)),
    "2027-01-03",
  );
});
const base = {
  title: "Dinner",
  notes: "",
  location: "",
  person: "both" as const,
  day: "2026-10-30",
  start: 1140,
  end: 1200,
};
test("rejects invalid dates, backwards times, and invalid people", () => {
  for (const data of [
    { ...base, day: "2026-02-30" },
    { ...base, start: 1300 },
    { ...base, end: 1441 },
    { ...base, person: "stranger" },
    { ...base, title: "  " },
  ])
    assert.equal(eventInput.safeParse(data).success, false);
  assert.equal(eventInput.safeParse({ ...base, end: 1440 }).success, true);
});
test("overlapping events use separate lanes; adjacent events reuse space", () => {
  const event = (id: string, start: number, end: number): CalendarEvent => ({
    ...base,
    id,
    start,
    end,
    version: 1,
  });
  const layout = layoutEvents([
    event("a", 540, 660),
    event("b", 600, 720),
    event("c", 660, 700),
    event("d", 720, 780),
  ]);
  assert.deepEqual(
    layout.map((e) => [e.event.id, e.lane, e.lanes]),
    [
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 2],
      ["d", 0, 1],
    ],
  );
});
