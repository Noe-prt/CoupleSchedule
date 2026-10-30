"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Heart,
  Link2,
  MapPin,
  Plus,
  Settings2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  addDays,
  CalendarEvent,
  dateKey,
  layoutEvents,
  monday,
  Schedule,
  timeLabel,
} from "@/lib/calendar";
import { Modal } from "./modal";

const initialSchedule = {
  title: "Our little world",
  personOne: "Alex",
  personTwo: "Jamie",
};
const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
type Draft = Omit<CalendarEvent, "id" | "version"> & {
  id?: string;
  version?: number;
};
async function request<T>(
  url: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    cache: "no-store",
    signal,
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(value.error || "Something went wrong. Please try again.");
  return value;
}
function previewEvents(week: Date): CalendarEvent[] {
  return [
    [0, "one", "Morning run", 420, 480, "Riverside park"],
    [0, "two", "Slow morning", 480, 540, "Coffee & a good book"],
    [0, "one", "Design studio", 570, 750, "At the office"],
    [0, "two", "Team catch-up", 600, 690, ""],
    [0, "both", "Dinner together", 1140, 1230, "Try that new pasta recipe"],
    [1, "one", "Deep work", 540, 720, ""],
    [1, "two", "Yoga class", 480, 540, "The little studio"],
    [1, "two", "Office day", 600, 1020, ""],
    [1, "one", "Coffee with Sam", 840, 900, ""],
    [2, "both", "Breakfast date", 480, 540, "Our favorite café"],
    [2, "one", "Project time", 600, 780, ""],
    [2, "two", "Work from home", 600, 840, ""],
    [2, "one", "Gym", 1050, 1110, ""],
    [3, "one", "Office day", 540, 1020, ""],
    [3, "two", "Creative time", 570, 720, ""],
    [3, "two", "Lunch with Ella", 750, 840, ""],
    [3, "both", "Movie night", 1200, 1320, "You pick the movie"],
    [4, "one", "Wrap up the week", 540, 720, ""],
    [4, "two", "Team workshop", 600, 780, ""],
    [4, "both", "Date night ♡", 1140, 1290, "Somewhere new"],
    [5, "both", "Farmers market", 600, 720, "Flowers, coffee, and pastries"],
    [5, "one", "A little me time", 840, 960, ""],
    [5, "two", "Book club", 900, 1020, ""],
    [6, "both", "Sunday reset", 660, 780, "Plan, tidy, recharge"],
    [6, "both", "Call the family", 1020, 1080, ""],
  ].map((row, i) => ({
    id: `preview-${i}`,
    version: 1,
    day: dateKey(addDays(week, row[0] as number)),
    person: row[1] as CalendarEvent["person"],
    title: row[2] as string,
    start: row[3] as number,
    end: row[4] as number,
    location: row[5] as string,
    notes: "",
  }));
}
export function CalendarApp({ token }: { token?: string }) {
  const [week, setWeek] = useState<Date | null>(null);
  const [today, setToday] = useState("");
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<"create" | "settings" | "share" | null>(
    null,
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"week" | "agenda">("week");
  const [lastSync, setLastSync] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const revision = useRef(0);
  const calendarScroll = useRef<HTMLDivElement>(null);
  const weekKey = week ? dateKey(week) : "";
  useEffect(() => {
    const now = new Date();
    setToday(dateKey(now));
    setWeek(monday(now));
    setShareUrl(window.location.href);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !weekKey) return;
      const currentRevision = revision.current;
      const end = dateKey(addDays(new Date(weekKey + "T12:00:00"), 6));
      try {
        const data = await request<{
          schedule: Schedule;
          events: CalendarEvent[];
        }>(
          `/api/schedules/${token}?from=${weekKey}&to=${end}`,
          "GET",
          undefined,
          signal,
        );
        if (signal?.aborted || currentRevision !== revision.current) return;
        setSchedule(data.schedule);
        setEvents(data.events);
        setError("");
        setLoading(false);
        setLastSync(true);
      } catch (e) {
        if (!signal?.aborted) {
          setError((e as Error).message);
          setLoading(false);
          setLastSync(false);
        }
      }
    },
    [token, weekKey],
  );
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const timer = setInterval(() => {
      if (!document.hidden) void refresh(controller.signal);
    }, 10000);
    const focus = () => void refresh(controller.signal);
    window.addEventListener("focus", focus);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  useEffect(() => {
    if (calendarScroll.current) calendarScroll.current.scrollTop = 420;
  }, [loading, weekKey, view]);
  const displayed = token ? events : week ? previewEvents(week) : [];
  const filtered = displayed.filter(
    (e) => filter === "all" || e.person === filter || e.person === "both",
  );
  const together = displayed.filter((e) => e.person === "both").length;
  const close = () => {
    if (!busy) {
      setModal(null);
      setDraft(null);
      setError("");
      setConfirmDelete(false);
    }
  };
  function openEvent(
    event?: CalendarEvent,
    day?: string,
    person?: "one" | "two",
    start = 540,
  ) {
    if (!token) {
      setModal("create");
      return;
    }
    setError("");
    setConfirmDelete(false);
    setDraft(
      event || {
        title: "",
        day: day || today,
        person: person || "one",
        start,
        end: Math.min(start + 60, 1440),
        location: "",
        notes: "",
      },
    );
  }
  async function saveSchedule(form: FormData) {
    setBusy(true);
    setError("");
    revision.current++;
    const data = {
      title: form.get("title"),
      personOne: form.get("personOne"),
      personTwo: form.get("personTwo"),
    };
    try {
      if (modal === "create") {
        const result = await request<{ token: string }>(
          "/api/schedules",
          "POST",
          data,
        );
        window.location.assign(`/s/${result.token}`);
      } else {
        const result = await request<Schedule>(
          `/api/schedules/${token}`,
          "PATCH",
          data,
        );
        setSchedule(result);
        setModal(null);
        setNotice("Your space, updated.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveEvent(remove = false) {
    if (!draft) return;
    setBusy(true);
    setError("");
    revision.current++;
    try {
      await request(
        `/api/schedules/${token}/events${draft.id ? `/${draft.id}` : ""}`,
        remove ? "DELETE" : draft.id ? "PATCH" : "POST",
        draft,
      );
      setDraft(null);
      setConfirmDelete(false);
      setNotice(
        remove ? "Event deleted." : "A little more in sync. Event saved.",
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function moveWeek(n: number) {
    if (week) {
      setEvents([]);
      setLoading(!!token);
      setWeek(addDays(week, n));
    }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("Link copied. Send a little togetherness.");
    } catch {
      setNotice("Select and copy the link below.");
    }
  }
  const days = week
    ? Array.from({ length: 7 }, (_, i) => addDays(week, i))
    : [];
  const monthLabel = week
    ? week.toLocaleDateString("en", { month: "long", year: "numeric" })
    : "Your shared week";
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Together home">
          <span className="brand-icon">
            <Heart size={22} />
          </span>
          together<span className="brand-dot">.</span>
        </a>
        <p className="sidebar-label">A SPACE FOR TWO</p>
        <button
          className="space-card"
          onClick={() => setModal(token ? "settings" : "create")}
        >
          <div className="mini-avatars">
            <span>{schedule.personOne[0]}</span>
            <span>{schedule.personTwo[0]}</span>
          </div>
          <div>
            <strong>{schedule.title}</strong>
            <small>
              {schedule.personOne} & {schedule.personTwo}
            </small>
          </div>
          <Settings2 size={15} />
        </button>
        <nav aria-label="Main navigation">
          <button className="nav-item selected" onClick={() => setView("week")}>
            <CalendarDays size={19} /> Our calendar <span>♡</span>
          </button>
          <button
            className="nav-item"
            onClick={() => setModal(token ? "settings" : "create")}
          >
            <Users size={19} /> Our space
          </button>
        </nav>
        <div className="sidebar-divider" />
        <p className="sidebar-label">ON THE CALENDAR</p>
        <button
          className={`person-filter ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          <span className="color-dot all" /> Everyone <Check size={14} />
        </button>
        <button
          className={`person-filter ${filter === "one" ? "active" : ""}`}
          onClick={() => setFilter("one")}
        >
          <span className="color-dot one" /> {schedule.personOne}
          <Check size={14} />
        </button>
        <button
          className={`person-filter ${filter === "two" ? "active" : ""}`}
          onClick={() => setFilter("two")}
        >
          <span className="color-dot two" /> {schedule.personTwo}
          <Check size={14} />
        </button>
        <div className="sidebar-bottom">
          <div className="little-note">
            <Sparkles size={21} />
            <h3>
              Different days.
              <br />A life together.
            </h3>
            <p>A little planning makes more room for the good stuff.</p>
            <span className="note-doodle">♡</span>
          </div>
          <button
            className="invite"
            onClick={() => setModal(token ? "share" : "create")}
          >
            <Link2 size={17} /> Invite your person <ArrowUpRight size={16} />
          </button>
          <p className="made-for">Made for your kind of together.</p>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            Our space <ChevronRight size={13} />
            <span>Calendar</span>
          </div>
          <div className="topbar-right">
            <span className="sync">
              <i className={lastSync || !token ? "connected" : ""} />
              {token
                ? lastSync
                  ? "Changes saved · syncs every 10s"
                  : "Connecting"
                : "A peek at life together"}
            </span>
            <div className="mini-avatars">
              <span>{schedule.personOne[0]}</span>
              <span>{schedule.personTwo[0]}</span>
            </div>
          </div>
        </header>
        <section className="workspace">
          <div className="page-heading">
            <div>
              <div className="eyebrow">TWO PEOPLE. ONE SHARED WEEK.</div>
              <h1>
                A little more in sync<span>♡</span>
              </h1>
              <p>Your plans, their plans, and everything in between.</p>
            </div>
            <button
              className="button secondary"
              onClick={() => setModal(token ? "share" : "create")}
            >
              <Link2 size={16} />
              {token ? "Share calendar" : "Make it yours"}
            </button>
          </div>
          {!token && (
            <div className="preview-banner">
              <span>
                <Sparkles size={17} />
                <strong>Your week could look a little like this.</strong> This
                is a preview — start a fresh calendar for the two of you.
              </span>
              <button onClick={() => setModal("create")}>
                Create our calendar <ArrowUpRight size={16} />
              </button>
            </div>
          )}
          {error && !modal && !draft && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => void refresh()}>Try again</button>
            </div>
          )}
          <div className="calendar-toolbar">
            <div className="date-controls">
              <h2>{monthLabel}</h2>
              <div className="week-arrows">
                <button
                  className="icon-button"
                  aria-label="Previous week"
                  onClick={() => moveWeek(-7)}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Next week"
                  onClick={() => moveWeek(7)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <button
                className="today-button"
                onClick={() => {
                  const current = monday(new Date());
                  if (dateKey(current) === weekKey) {
                    void refresh();
                  } else {
                    setEvents([]);
                    setLoading(!!token);
                    setWeek(current);
                  }
                }}
              >
                Today
              </button>
              <span className="week-range">
                {week
                  ? `${week.toLocaleDateString("en", { month: "short", day: "numeric" })} – ${addDays(week, 6).toLocaleDateString("en", { month: "short", day: "numeric" })}`
                  : ""}
              </span>
            </div>
            <div className="toolbar-actions">
              <div className="view-switch">
                <button
                  className={view === "week" ? "active" : ""}
                  onClick={() => setView("week")}
                >
                  Week
                </button>
                <button
                  className={view === "agenda" ? "active" : ""}
                  onClick={() => setView("agenda")}
                >
                  Agenda
                </button>
              </div>
              <button className="button primary" onClick={() => openEvent()}>
                <Plus size={17} /> Add event
              </button>
            </div>
          </div>
          <div className="calendar-card">
            <div className="calendar-caption">
              <span>
                <span className="color-dot one" />
                {schedule.personOne}
                <span className="color-dot two" />
                {schedule.personTwo}
                <span className="color-dot both" />
                Together
              </span>
              <span className="calendar-hint">
                <Plus size={13} /> Click a time to make a plan
              </span>
            </div>
            {loading ? (
              <div className="loading">Getting your week ready…</div>
            ) : view === "week" ? (
              <div className="calendar-scroll" ref={calendarScroll}>
                <div className="calendar-grid">
                  <div className="day-headers">
                    <div className="timezone">
                      LOCAL
                      <br />
                      TIME
                    </div>
                    {days.map((day, i) => (
                      <div
                        className={`day-header ${dateKey(day) === today ? "is-today" : ""} ${i > 4 ? "weekend" : ""}`}
                        key={dateKey(day)}
                      >
                        <div>
                          <span>{weekdays[i].slice(0, 3)}</span>
                          <strong>{day.getDate()}</strong>
                          {dateKey(day) === today && <i />}
                        </div>
                        <div className="partner-headers">
                          <span>
                            <i className="color-dot one" />
                            {schedule.personOne}
                          </span>
                          <span>
                            <i className="color-dot two" />
                            {schedule.personTwo}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="time-grid">
                    <div className="time-axis">
                      {hours.map((hour) => (
                        <span key={hour} style={{ top: hour * 60 }}>
                          {timeLabel(hour * 60)}
                        </span>
                      ))}
                    </div>
                    {days.map((day, i) => (
                      <div
                        className={`day-body ${i > 4 ? "weekend" : ""}`}
                        key={dateKey(day)}
                      >
                        {(["one", "two"] as const).map((person) => (
                          <div className="person-column" key={person}>
                            {hours.map((hour) => (
                              <button
                                key={hour}
                                className="time-slot"
                                style={{ top: hour * 60 }}
                                aria-label={`Add event for ${person === "one" ? schedule.personOne : schedule.personTwo}, ${weekdays[i]}, ${timeLabel(hour * 60)}`}
                                onClick={() =>
                                  openEvent(
                                    undefined,
                                    dateKey(day),
                                    person,
                                    hour * 60,
                                  )
                                }
                              />
                            ))}
                            {layoutEvents(
                              filtered.filter(
                                (e) =>
                                  e.day === dateKey(day) &&
                                  (e.person === person || e.person === "both"),
                              ),
                            ).map(({ event, lane, lanes }) => (
                              <button
                                key={event.id}
                                className={`event ${event.person}`}
                                style={{
                                  top: event.start,
                                  height: Math.max(
                                    event.end - event.start - 3,
                                    19,
                                  ),
                                  left: `calc(${(lane / lanes) * 100}% + 3px)`,
                                  width: `calc(${100 / lanes}% - 6px)`,
                                }}
                                onClick={() => openEvent(event)}
                                title={`${event.title} · ${timeLabel(event.start)}–${timeLabel(event.end)}`}
                              >
                                <span className="event-time">
                                  {timeLabel(event.start)}
                                  {event.person === "both" && (
                                    <Heart size={9} />
                                  )}
                                </span>
                                <strong>{event.title}</strong>
                                {event.end - event.start >= 70 &&
                                  event.location && (
                                    <small>{event.location}</small>
                                  )}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="agenda">
                {days.map((day, i) => {
                  const items = filtered
                    .filter((e) => e.day === dateKey(day))
                    .sort((a, b) => a.start - b.start);
                  return (
                    <section key={dateKey(day)}>
                      <h3>
                        {weekdays[i]} <span>{day.getDate()}</span>
                      </h3>
                      {items.length ? (
                        items.map((event) => (
                          <button
                            className="agenda-event"
                            key={event.id}
                            onClick={() => openEvent(event)}
                          >
                            <span className={`color-dot ${event.person}`} />
                            <time>
                              {timeLabel(event.start)} – {timeLabel(event.end)}
                            </time>
                            <strong>{event.title}</strong>
                            <span>
                              {event.person === "both"
                                ? "Together"
                                : event.person === "one"
                                  ? schedule.personOne
                                  : schedule.personTwo}
                            </span>
                          </button>
                        ))
                      ) : (
                        <button
                          className="empty-day"
                          onClick={() => openEvent(undefined, dateKey(day))}
                        >
                          A little room for something good. + Add a plan
                        </button>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
            <div className="calendar-footer">
              <span>
                <Heart size={14} />
                {together
                  ? `${together} shared ${together === 1 ? "plan" : "plans"} to look forward to this week`
                  : "Make a little time for each other this week"}
              </span>
              <span>
                {token
                  ? "Your time zone · " +
                    (today
                      ? Intl.DateTimeFormat().resolvedOptions().timeZone
                      : "")
                  : "Sample calendar · Yours starts fresh"}
              </span>
            </div>
          </div>
          <div className="bottom-note">
            <span>Life gets busy. Stay close.</span>
            <span>One link. Two schedules. More together.</span>
          </div>
        </section>
      </main>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {(modal === "create" || modal === "settings") && (
        <Modal
          title={
            modal === "create"
              ? "A space for the two of you"
              : "Make this space yours"
          }
          close={close}
        >
          <p className="modal-intro">
            {modal === "create"
              ? "No accounts, no fuss. Just a shared link and a little more time together."
              : "The little details that make it your calendar."}
          </p>
          <form action={saveSchedule}>
            <label>
              Calendar name
              <input
                name="title"
                required
                maxLength={80}
                defaultValue={
                  modal === "create" ? "Our little world" : schedule.title
                }
              />
            </label>
            <div className="form-row">
              <label>
                <span className="color-dot one" /> First person
                <input
                  name="personOne"
                  required
                  placeholder="Your name"
                  maxLength={30}
                  defaultValue={modal === "settings" ? schedule.personOne : ""}
                />
              </label>
              <label>
                <span className="color-dot two" /> Second person
                <input
                  name="personTwo"
                  required
                  placeholder="Their name"
                  maxLength={30}
                  defaultValue={modal === "settings" ? schedule.personTwo : ""}
                />
              </label>
            </div>
            <div className="privacy-note">
              <Link2 size={17} />
              <span>
                Anyone with your unique link can view and edit. Keep it between
                the people you trust, and save a copy to return later.
              </span>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy}>
              {busy
                ? "Saving…"
                : modal === "create"
                  ? "Create our calendar"
                  : "Save changes"}
              <ArrowUpRight size={16} />
            </button>
          </form>
        </Modal>
      )}
      {modal === "share" && (
        <Modal title="Good things are better shared" close={close}>
          <div className="share-illustration">
            <span>{schedule.personOne[0]}</span>
            <Heart size={24} />
            <span>{schedule.personTwo[0]}</span>
          </div>
          <p className="modal-intro">
            Send this link to your person. You can both add and edit plans, from
            wherever you are.
          </p>
          <label>
            Your calendar link
            <div className="copy-field">
              <input
                value={shareUrl}
                readOnly
                onFocus={(e) => e.target.select()}
                aria-label="Shared calendar link"
              />
              <button
                className="icon-button"
                aria-label="Copy link"
                onClick={copyLink}
              >
                <Copy size={18} />
              </button>
            </div>
          </label>
          <div className="privacy-note">
            <Link2 size={17} />
            <span>
              This link is your key. Anyone who has it can edit your calendar.
              Bookmark it so you can come back.
            </span>
          </div>
          <button className="button primary full" onClick={copyLink}>
            <Copy size={16} />
            Copy invite link
          </button>
        </Modal>
      )}
      {draft && (
        <Modal
          title={draft.id ? "A plan worth keeping" : "Make a little plan"}
          close={close}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveEvent();
            }}
          >
            <label>
              What’s the plan?
              <input
                autoFocus
                required
                maxLength={100}
                placeholder="Coffee, a big day, a little adventure…"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label>
              Who’s going?
              <div className="person-picker">
                {(["one", "two", "both"] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={draft.person === p ? `picked ${p}` : ""}
                    onClick={() => setDraft({ ...draft, person: p })}
                  >
                    {p === "both" ? (
                      <Heart size={14} />
                    ) : (
                      <span className={`color-dot ${p}`} />
                    )}{" "}
                    {p === "one"
                      ? schedule.personOne
                      : p === "two"
                        ? schedule.personTwo
                        : "Together"}
                  </button>
                ))}
              </div>
            </label>
            <label>
              Date
              <input
                type="date"
                required
                value={draft.day}
                onChange={(e) => setDraft({ ...draft, day: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label>
                <Clock3 size={13} /> Starts
                <input
                  type="time"
                  required
                  value={timeLabel(draft.start)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    setDraft({ ...draft, start: h * 60 + m });
                  }}
                />
              </label>
              <label>
                Ends
                <select
                  value={draft.end}
                  onChange={(e) =>
                    setDraft({ ...draft, end: Number(e.target.value) })
                  }
                >
                  {Array.from(
                    new Set([
                      ...Array.from({ length: 96 }, (_, i) => (i + 1) * 15),
                      draft.end,
                    ]),
                  )
                    .sort((a, b) => a - b)
                    .map((n) => (
                      <option key={n} value={n}>
                        {n === 1440 ? "24:00 (end of day)" : timeLabel(n)}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <label>
              <MapPin size={13} /> Location{" "}
              <span className="optional">optional</span>
              <input
                maxLength={120}
                placeholder="Somewhere lovely"
                value={draft.location}
                onChange={(e) =>
                  setDraft({ ...draft, location: e.target.value })
                }
              />
            </label>
            <label>
              Notes <span className="optional">optional</span>
              <textarea
                maxLength={1000}
                rows={2}
                placeholder="Anything else to remember?"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              {draft.id && (
                <button
                  type="button"
                  className="delete-button"
                  disabled={busy}
                  onClick={() => {
                    if (confirmDelete) void saveEvent(true);
                    else setConfirmDelete(true);
                  }}
                >
                  {confirmDelete ? "Confirm delete" : "Delete event"}
                </button>
              )}
              <button type="submit" className="button primary" disabled={busy}>
                {busy ? "Saving…" : "Save plan"}
                <Check size={16} />
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
