"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  eachDayOfInterval,
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

const MAX_CHIPS = 3;

function displayPrefix(ev: Entry) {
  const label = ev.projectLabel || ev.projectKey;
  return label ? `${label}: ` : "";
}

export default function MonthGrid({
  onDayClick,
}: {
  onDayClick: (d: Date) => void;
}) {
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gridStart = useMemo(
    () => startOfWeek(monthStart, { weekStartsOn: 0 }),
    [monthStart]
  );
  const gridEnd = useMemo(
    () => endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 }),
    [monthStart]
  );

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  useEffect(() => {
    let cancelled = false;
    const doLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        const from = gridStart.toISOString();
        const to = gridEnd.toISOString();
        const res = await fetch(
          `/api/calendar/week?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );
        const json = (await res.json()) as WeekResponse;
        if (!res.ok) throw new Error("Request failed");
        if (!cancelled) setEntries(json.entries ?? []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doLoad();
    return () => { cancelled = true; };
  }, [gridStart, gridEnd]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const ev of entries) {
      const key = format(parseISO(ev.startAt), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [entries]);

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Month View</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {format(monthStart, "MMMM yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthStart((d) => startOfMonth(subMonths(d, 1)))}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            ← Prev
          </button>
          <button
            onClick={() => setMonthStart(startOfMonth(new Date()))}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            This Month
          </button>
          <button
            onClick={() => setMonthStart((d) => startOfMonth(addMonths(d, 1)))}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            Next →
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200 ring-1 ring-red-500/20">
          Calendar error: {error}
        </div>
      )}

      <div className="mt-5 overflow-auto rounded-2xl ring-1 ring-white/10">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 bg-zinc-950/80">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="p-3 text-center text-xs font-semibold text-zinc-400 ring-1 ring-white/10"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const isToday = key === todayKey;
              const inMonth = isSameMonth(day, monthStart);
              const dayEntries = entriesByDay.get(key) ?? [];
              const overflow = dayEntries.length - MAX_CHIPS;

              return (
                <div
                  key={key}
                  onClick={() => onDayClick(day)}
                  className={`min-h-[96px] cursor-pointer p-2 ring-1 ring-white/10 transition-colors hover:bg-white/5 ${
                    inMonth ? "bg-black/20" : "bg-black/5"
                  }`}
                >
                  {/* Date number */}
                  <div
                    className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday
                        ? "bg-emerald-500/80 text-white"
                        : inMonth
                        ? "text-zinc-200"
                        : "text-zinc-600"
                    }`}
                  >
                    {format(day, "d")}
                  </div>

                  {/* Event chips */}
                  <div className="space-y-0.5">
                    {dayEntries.slice(0, MAX_CHIPS).map((ev) => (
                      <div
                        key={ev.id}
                        className={`truncate rounded px-1.5 py-0.5 text-[10px] ring-1 ${
                          ev.kind === "task"
                            ? ev.done
                              ? "bg-zinc-500/10 text-zinc-500 line-through ring-white/10"
                              : "bg-indigo-400/10 text-indigo-200 ring-indigo-300/20"
                            : colorClasses(ev.projectColor)
                        }`}
                        title={`${displayPrefix(ev)}${ev.title}`}
                      >
                        {displayPrefix(ev)}{ev.title}
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="text-[10px] text-zinc-400">+{overflow} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        {loading ? "Loading…" : `${entries.length} item(s) this month · Click a day for details.`}
      </div>
    </div>
  );
}
