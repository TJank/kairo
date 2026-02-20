"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { colorClasses } from "@/app/calendar/colors";

type Entry = {
  kind: "event" | "task";
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  category: string;
  allDay?: boolean;
  done?: boolean;
  projectKey?: string;
  projectLabel?: string;
  projectColor?: string;
};

type WeekResponse = { entries?: Entry[] };

type Positioned = Entry & {
  dayKey: string;
  startSlot: number;
  endSlot: number;
  col: number;
  cols: number;
};

const START_HOUR = 6;
const END_HOUR = 20; // inclusive start hour of last slot row; view ends 20:30
const SLOT_MIN = 30;
const SLOT_HEIGHT = 44; // px

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function slotIndexFromDate(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const totalMin = (h - START_HOUR) * 60 + m;
  return Math.floor(totalMin / SLOT_MIN);
}

function slotIndexFromDateCeil(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const totalMin = (h - START_HOUR) * 60 + m;
  return Math.ceil(totalMin / SLOT_MIN);
}

function formatSlotLabel(slot: number) {
  const minutes = slot * SLOT_MIN;
  const h24 = START_HOUR + Math.floor(minutes / 60);
  const mm = minutes % 60;

  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;

  return `${String(h12).padStart(2, "0")}:${mm === 0 ? "00" : "30"} ${ampm}`;
}

function displayPrefix(ev: Entry) {
  const label = ev.projectLabel || ev.projectKey;
  return label ? `${label}: ` : "";
}

export default function WeekGrid() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 }),
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);

  const weekEnd = useMemo(
    () => endOfWeek(weekStart, { weekStartsOn: 0 }),
    [weekStart],
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const slotCount = useMemo(() => (END_HOUR - START_HOUR + 1) * 2, []); // 6:00..20:30
  const slots = useMemo(
    () => Array.from({ length: slotCount }, (_, i) => i),
    [slotCount],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const from = weekStart.toISOString();
        const to = addDays(weekEnd, 1).toISOString();
        const res = await fetch(
          `/api/calendar/week?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        );
        const json = (await res.json()) as WeekResponse;
        if (!res.ok) {
          throw new Error(
            (json as any)?.detail || (json as any)?.error || "Request failed",
          );
        }
        if (!cancelled) setEntries(json.entries ?? []);

        // Auto-scroll to current slot if viewing this week
        const now = new Date();
        const inThisWeek = now >= weekStart && now <= weekEnd;
        if (inThisWeek) {
          const slot = clamp(slotIndexFromDate(now), 0, slotCount - 1);
          setTimeout(() => {
            const el = gridRef.current?.querySelector(
              `[data-slot="${slot}"]`,
            ) as HTMLElement | null;
            el?.scrollIntoView({ block: "start", inline: "nearest" });
          }, 50);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [weekStart, weekEnd, slotCount]);

  const allDayByDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const ev of entries) {
      if (!ev.allDay) continue;
      const s = parseISO(ev.startAt);
      const dayKey = format(s, "yyyy-MM-dd");
      const arr = map.get(dayKey) ?? [];
      arr.push(ev);
      map.set(dayKey, arr);
    }
    return map;
  }, [entries]);

  const positionedByDay = useMemo(() => {
    const map = new Map<string, Positioned[]>();

    for (const d of days) {
      const dayKey = format(d, "yyyy-MM-dd");

      const dayItems = entries
        .filter((e) => !e.allDay)
        .filter((e) => format(parseISO(e.startAt), "yyyy-MM-dd") === dayKey)
        .map((e) => {
          const start = parseISO(e.startAt);
          const end = parseISO(e.endAt);
          let startSlot = slotIndexFromDate(start);
          let endSlot = slotIndexFromDateCeil(end);

          // clip to visible range
          startSlot = clamp(startSlot, 0, slotCount);
          endSlot = clamp(endSlot, 0, slotCount);
          if (endSlot <= startSlot) endSlot = Math.min(startSlot + 1, slotCount);

          return {
            ...e,
            dayKey,
            startSlot,
            endSlot,
            col: 0,
            cols: 1,
          } as Positioned;
        })
        .filter((e) => e.startSlot < slotCount && e.endSlot > 0);

      // Build clusters: connected by overlap
      dayItems.sort((a, b) => a.startSlot - b.startSlot || a.endSlot - b.endSlot);

      const clusters: Positioned[][] = [];
      let current: Positioned[] = [];
      let currentEnd = -1;

      for (const ev of dayItems) {
        if (current.length === 0) {
          current = [ev];
          currentEnd = ev.endSlot;
          continue;
        }
        if (ev.startSlot < currentEnd) {
          current.push(ev);
          currentEnd = Math.max(currentEnd, ev.endSlot);
        } else {
          clusters.push(current);
          current = [ev];
          currentEnd = ev.endSlot;
        }
      }
      if (current.length) clusters.push(current);

      // For each cluster, do interval partitioning (column assignment)
      const laidOut: Positioned[] = [];
      for (const cluster of clusters) {
        const active: { end: number; col: number }[] = [];
        const usedCols: boolean[] = [];
        let maxCols = 0;

        for (const ev of cluster) {
          // expire active
          for (let i = active.length - 1; i >= 0; i--) {
            if (active[i].end <= ev.startSlot) {
              usedCols[active[i].col] = false;
              active.splice(i, 1);
            }
          }

          // find first free col
          let col = usedCols.findIndex((v) => !v);
          if (col === -1) col = usedCols.length;
          usedCols[col] = true;

          active.push({ end: ev.endSlot, col });
          maxCols = Math.max(maxCols, active.length, usedCols.length);

          ev.col = col;
          laidOut.push(ev);
        }

        for (const ev of cluster) {
          ev.cols = Math.max(1, maxCols);
        }
      }

      map.set(dayKey, laidOut);
    }

    return map;
  }, [entries, days, slotCount]);

  return (
    <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Week View</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")} (Sun–Sat)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setWeekStart((d) => startOfWeek(subWeeks(d, 1), { weekStartsOn: 0 }))
            }
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            ← Prev
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            This week
          </button>
          <button
            onClick={() =>
              setWeekStart((d) => startOfWeek(addWeeks(d, 1), { weekStartsOn: 0 }))
            }
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            Next →
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200 ring-1 ring-red-500/20">
          Calendar error: {error}
        </div>
      ) : null}

      <div ref={gridRef} className="mt-5 overflow-auto rounded-2xl ring-1 ring-white/10">
        {/* Header row */}
        <div
          className="grid"
          style={{ gridTemplateColumns: "80px repeat(7, minmax(180px, 1fr))" }}
        >
          <div className="sticky top-0 z-20 bg-zinc-950/90 p-3 text-xs font-semibold text-zinc-400 ring-1 ring-white/10" />
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className="sticky top-0 z-20 bg-zinc-950/90 p-3 text-sm font-semibold ring-1 ring-white/10"
            >
              <div className="text-zinc-100">{format(d, "EEE")}</div>
              <div className="text-xs text-zinc-400">{format(d, "MMM d")}</div>
            </div>
          ))}

          {/* All-day row */}
          <div className="contents">
            <div className="bg-black/30 p-3 text-xs text-zinc-400 ring-1 ring-white/10">
              All day
            </div>
            {days.map((d) => {
              const dayKey = format(d, "yyyy-MM-dd");
              const items = allDayByDay.get(dayKey) ?? [];
              return (
                <div
                  key={dayKey + "-allday"}
                  className="min-h-[56px] bg-black/25 p-2 ring-1 ring-white/10"
                >
                  {items.slice(0, 4).map((ev) => (
                    <div
                      key={ev.id}
                      className={`mb-1 truncate rounded-lg px-2 py-1 text-xs ring-1 ${
                        ev.kind === "task"
                          ? ev.done
                            ? "bg-zinc-500/10 text-zinc-400 line-through ring-white/10"
                            : "bg-indigo-400/10 text-indigo-100 ring-indigo-300/20"
                          : colorClasses(ev.projectColor)
                      }`}
                      title={ev.title}
                    >
                      {displayPrefix(ev)}{ev.title}
                    </div>
                  ))}
                  {items.length > 4 ? (
                    <div className="text-[11px] text-zinc-400">+{items.length - 4} more</div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Time grid + day columns (spanning blocks) */}
          <div className="contents">
            {/* Time labels column (sticky when scrolling right) */}
            <div className="sticky left-0 z-20 bg-zinc-950/90 ring-1 ring-white/10">
              {slots.map((slot) => (
                <div
                  key={slot}
                  data-slot={slot}
                  className="p-3 text-xs text-zinc-400 ring-1 ring-white/10"
                  style={{ height: SLOT_HEIGHT }}
                >
                  {formatSlotLabel(slot)}
                </div>
              ))}
            </div>

            {days.map((d) => {
              const dayKey = format(d, "yyyy-MM-dd");
              const positioned = positionedByDay.get(dayKey) ?? [];
              const height = slotCount * SLOT_HEIGHT;

              return (
                <div key={dayKey} className="relative bg-black/20 ring-1 ring-white/10">
                  {/* background grid */}
                  <div
                    className="absolute inset-0"
                    style={{ height }}
                    aria-hidden
                  >
                    {slots.map((slot) => (
                      <div
                        key={slot}
                        className="ring-1 ring-white/10"
                        style={{ height: SLOT_HEIGHT }}
                      />
                    ))}
                  </div>

                  {/* event blocks */}
                  <div className="relative" style={{ height }}>
                    {positioned.map((ev) => {
                      const top = ev.startSlot * SLOT_HEIGHT + 4;
                      const h = (ev.endSlot - ev.startSlot) * SLOT_HEIGHT - 8;
                      const cols = Math.max(1, ev.cols);
                      const colW = 100 / cols;
                      const left = ev.col * colW;

                      const baseClasses =
                        ev.kind === "task"
                          ? ev.done
                            ? "bg-zinc-500/10 text-zinc-400 line-through ring-white/10"
                            : "bg-indigo-400/10 text-indigo-100 ring-indigo-300/20"
                          : colorClasses(ev.projectColor);

                      return (
                        <div
                          key={ev.id + ev.startAt}
                          className={`absolute overflow-hidden rounded-lg px-2 py-1 text-[11px] ring-1 ${baseClasses}`}
                          style={{
                            top,
                            height: Math.max(18, h),
                            left: `calc(${left}% + 4px)`,
                            width: `calc(${colW}% - 8px)`,
                          }}
                          title={ev.title}
                        >
                          <div className="truncate font-medium">
                            {displayPrefix(ev)}{ev.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        {loading ? "Loading…" : `Showing ${entries.length} planner item(s) (local DB).`}
      </div>
    </div>
  );
}
