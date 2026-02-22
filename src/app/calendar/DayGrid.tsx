"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { colorClasses } from "@/app/calendar/colors";
import AddEventModal from "@/app/calendar/AddEventModal";

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
  startSlot: number;
  endSlot: number;
  col: number;
  cols: number;
};

type Project = { id: string; key: string; name: string; color: string };

const START_HOUR = 6;
const END_HOUR = 20;
const SLOT_MIN = 30;
const SLOT_HEIGHT = 44;

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

function slotToMins(slot: number) {
  return START_HOUR * 60 + slot * SLOT_MIN;
}

function displayPrefix(ev: Entry) {
  const label = ev.projectLabel || ev.projectKey;
  return label ? `${label}: ` : "";
}

export default function DayGrid({
  selectedDay,
  onDayChange,
  projects = [],
  onRefresh,
}: {
  selectedDay: Date;
  onDayChange: (d: Date) => void;
  projects?: Project[];
  onRefresh?: () => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<{ date: Date; startSlotMin: number } | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);

  const slotCount = useMemo(() => (END_HOUR - START_HOUR + 1) * 2, []);
  const slots = useMemo(
    () => Array.from({ length: slotCount }, (_, i) => i),
    [slotCount]
  );

  const dayKey = format(selectedDay, "yyyy-MM-dd");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = startOfDay(selectedDay).toISOString();
      const to = addDays(startOfDay(selectedDay), 1).toISOString();
      const res = await fetch(
        `/api/calendar/week?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      const json = (await res.json()) as WeekResponse;
      if (!res.ok) throw new Error("Request failed");
      setEntries(json.entries ?? []);

      const now = new Date();
      const isToday = format(now, "yyyy-MM-dd") === dayKey;
      if (isToday) {
        const slot = clamp(slotIndexFromDate(now), 0, slotCount - 1);
        setTimeout(() => {
          const el = gridRef.current?.querySelector(
            `[data-slot="${slot}"]`
          ) as HTMLElement | null;
          el?.scrollIntoView({ block: "start", inline: "nearest" });
        }, 50);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedDay, dayKey, slotCount]);

  useEffect(() => {
    let cancelled = false;
    const doLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        const from = startOfDay(selectedDay).toISOString();
        const to = addDays(startOfDay(selectedDay), 1).toISOString();
        const res = await fetch(
          `/api/calendar/week?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );
        const json = (await res.json()) as WeekResponse;
        if (!res.ok) throw new Error("Request failed");
        if (!cancelled) setEntries(json.entries ?? []);

        const now = new Date();
        const isToday = format(now, "yyyy-MM-dd") === dayKey;
        if (isToday) {
          const slot = clamp(slotIndexFromDate(now), 0, slotCount - 1);
          setTimeout(() => {
            const el = gridRef.current?.querySelector(
              `[data-slot="${slot}"]`
            ) as HTMLElement | null;
            el?.scrollIntoView({ block: "start", inline: "nearest" });
          }, 50);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doLoad();
    return () => { cancelled = true; };
  }, [selectedDay, dayKey, slotCount]);

  const allDayItems = useMemo(
    () => entries.filter((e) => e.allDay && format(parseISO(e.startAt), "yyyy-MM-dd") === dayKey),
    [entries, dayKey]
  );

  const positioned = useMemo((): Positioned[] => {
    const dayItems = entries
      .filter((e) => !e.allDay)
      .filter((e) => format(parseISO(e.startAt), "yyyy-MM-dd") === dayKey)
      .map((e) => {
        const start = parseISO(e.startAt);
        const end = parseISO(e.endAt);
        let startSlot = slotIndexFromDate(start);
        let endSlot = slotIndexFromDateCeil(end);
        startSlot = clamp(startSlot, 0, slotCount);
        endSlot = clamp(endSlot, 0, slotCount);
        if (endSlot <= startSlot) endSlot = Math.min(startSlot + 1, slotCount);
        return { ...e, startSlot, endSlot, col: 0, cols: 1 } as Positioned;
      })
      .filter((e) => e.startSlot < slotCount && e.endSlot > 0);

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

    const laidOut: Positioned[] = [];
    for (const cluster of clusters) {
      const active: { end: number; col: number }[] = [];
      const usedCols: boolean[] = [];
      let maxCols = 0;

      for (const ev of cluster) {
        for (let i = active.length - 1; i >= 0; i--) {
          if (active[i].end <= ev.startSlot) {
            usedCols[active[i].col] = false;
            active.splice(i, 1);
          }
        }
        let col = usedCols.findIndex((v) => !v);
        if (col === -1) col = usedCols.length;
        usedCols[col] = true;
        active.push({ end: ev.endSlot, col });
        maxCols = Math.max(maxCols, active.length, usedCols.length);
        ev.col = col;
        laidOut.push(ev);
      }

      for (const ev of cluster) ev.cols = Math.max(1, maxCols);
    }

    return laidOut;
  }, [entries, dayKey, slotCount]);

  const isToday = format(new Date(), "yyyy-MM-dd") === dayKey;
  const height = slotCount * SLOT_HEIGHT;

  return (
    <>
      <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Day View</h2>
            <p className={`mt-1 text-sm ${isToday ? "text-emerald-400" : "text-zinc-400"}`}>
              {format(selectedDay, "EEEE, MMMM d, yyyy")}
              {isToday && " · Today"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDayChange(subDays(selectedDay, 1))}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
            >
              ← Prev
            </button>
            <button
              onClick={() => onDayChange(new Date())}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
            >
              Today
            </button>
            <button
              onClick={() => onDayChange(addDays(selectedDay, 1))}
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

        <div ref={gridRef} className="mt-5 overflow-auto rounded-2xl ring-1 ring-white/10 max-h-[calc(100vh-14rem)]">
          <div
            className="grid"
            style={{ gridTemplateColumns: "80px 1fr" }}
          >
            {/* Header */}
            <div className="sticky top-0 z-20 bg-zinc-950/90 p-3 text-xs font-semibold text-zinc-400 ring-1 ring-white/10" />
            <div className="sticky top-0 z-20 bg-zinc-950/90 p-3 text-sm font-semibold ring-1 ring-white/10">
              <div className={isToday ? "text-emerald-300" : "text-zinc-100"}>
                {format(selectedDay, "EEE")}
              </div>
              <div className="text-xs text-zinc-400">{format(selectedDay, "MMM d")}</div>
            </div>

            {/* All-day row */}
            <div className="contents">
              <div className="bg-black/30 p-3 text-xs text-zinc-400 ring-1 ring-white/10">
                All day
              </div>
              <div className="min-h-[56px] bg-black/25 p-2 ring-1 ring-white/10">
                {allDayItems.length === 0 && (
                  <p className="text-[10px] text-zinc-700 italic">No events</p>
                )}
                {allDayItems.slice(0, 6).map((ev) => (
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
                {allDayItems.length > 6 && (
                  <div className="text-[11px] text-zinc-400">+{allDayItems.length - 6} more</div>
                )}
              </div>
            </div>

            {/* Time grid */}
            <div className="contents">
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

              <div className="relative bg-black/20 ring-1 ring-white/10">
                {/* Background grid — clickable slots */}
                <div className="absolute inset-0" style={{ height }}>
                  {slots.map((slot) => (
                    <div
                      key={slot}
                      className="cursor-pointer ring-1 ring-white/10 hover:bg-white/5 transition-colors"
                      style={{ height: SLOT_HEIGHT }}
                      onClick={() =>
                        setAddModal({ date: selectedDay, startSlotMin: slotToMins(slot) })
                      }
                      title={`Add event at ${formatSlotLabel(slot)}`}
                    />
                  ))}
                </div>

                {/* Event blocks */}
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
                        className={`absolute overflow-hidden rounded-lg px-2 py-1 text-[11px] ring-1 ${baseClasses} z-10`}
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
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          {loading
            ? "Loading…"
            : entries.length === 0
            ? "No events today."
            : `${entries.length} item(s) · Click a time slot to add an event.`}
        </div>
      </div>

      {addModal && (
        <AddEventModal
          date={addModal.date}
          startSlotMin={addModal.startSlotMin}
          projects={projects}
          onClose={() => setAddModal(null)}
          onCreated={() => {
            load();
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
