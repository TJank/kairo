"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import {
  updateEvent,
  updateRecurringEvent,
  getRecurringEventData,
} from "@/app/actions/calendar";
import type { PopoverEntry } from "./EventPopover";
import { COLOR_SWATCH } from "@/app/calendar/colors";

type Project = { id: string; key: string; name: string; color: string };

const DAYS_OF_WEEK = [
  { label: "Su", value: 0 },
  { label: "Mo", value: 1 },
  { label: "Tu", value: 2 },
  { label: "We", value: 3 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
];


function toTimeStr(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateStr(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd");
}

function timeStrToMins(s: string) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function minsToTimeStr(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

export default function EditEventModal({
  entry,
  projects,
  onClose,
  onSaved,
}: {
  entry: PopoverEntry;
  projects: Project[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isRecurring = !!entry.recurring;
  const [recurringEventId] = entry.id.split(/:(.+)/);

  // Common fields
  const [title, setTitle] = useState(entry.title);
  const [startTime, setStartTime] = useState(toTimeStr(entry.startAt));
  const [endTime, setEndTime] = useState(toTimeStr(entry.endAt));
  const [dateVal, setDateVal] = useState(toDateStr(entry.startAt));
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.find((p) => p.key === entry.projectKey)?.id ?? null
  );

  // Recurring-only
  const [days, setDays] = useState<number[]>([]);

  // Loading state for recurring data fetch
  const [loading, setLoading] = useState(isRecurring);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isRecurring) return;
    getRecurringEventData(recurringEventId).then((data) => {
      if (data) {
        setDays(data.days);
        const proj = projects.find((p) => p.id === data.projectId);
        setSelectedProjectId(data.projectId);
        // Update times from DB's stored minutes (more accurate than entry display times)
        setStartTime(minsToTimeStr(data.startMin));
        setEndTime(minsToTimeStr(data.endMin));
        void proj; // used above
      }
      setLoading(false);
    });
  }, [isRecurring, recurringEventId, projects]);

  function toggleDay(day: number) {
    setDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (timeStrToMins(endTime) <= timeStrToMins(startTime)) {
      setError("End time must be after start time");
      return;
    }
    if (isRecurring && days.length === 0) {
      setError("Select at least one day");
      return;
    }

    startTransition(async () => {
      let result;
      if (isRecurring) {
        result = await updateRecurringEvent(
          recurringEventId,
          title,
          timeStrToMins(startTime),
          timeStrToMins(endTime),
          days,
          selectedProjectId
        );
      } else {
        const d = new Date(dateVal + "T00:00:00");
        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        const startAt = new Date(d); startAt.setHours(sh, sm, 0, 0);
        const endAt = new Date(d); endAt.setHours(eh, em, 0, 0);
        result = await updateEvent(
          entry.id,
          title,
          startAt.toISOString(),
          endAt.toISOString(),
          selectedProjectId
        );
      }
      if (result?.error) { setError(result.error); return; }
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 pt-6 pb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Edit {isRecurring ? "recurring series" : "event"}
            </h2>
            {isRecurring && (
              <p className="mt-0.5 text-xs text-zinc-500">Changes apply to all future occurrences</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-zinc-500">Loading…</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">

            {/* Title */}
            <div>
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(""); }}
                placeholder="Event title"
                autoFocus
                className="w-full rounded-xl bg-black/40 px-4 py-3 text-base outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-500"
              />
              {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
            </div>

            {/* Date (one-off only) + Times */}
            <div className={`grid gap-3 ${!isRecurring ? "grid-cols-3" : "grid-cols-2"}`}>
              {!isRecurring && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Date</label>
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
                />
              </div>
            </div>

            {/* Days (recurring only) */}
            {isRecurring && (
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">Repeats on</label>
                <div className="flex gap-1.5">
                  {DAYS_OF_WEEK.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`h-9 w-9 rounded-full text-xs font-medium ring-1 transition-colors ${
                        days.includes(d.value)
                          ? "bg-white/20 text-white ring-white/40"
                          : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/10"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Group */}
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">Group</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(null)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                    selectedProjectId === null
                      ? "bg-white/15 text-white ring-white/30"
                      : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8"
                  }`}
                >
                  None
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                      selectedProjectId === p.id
                        ? "bg-white/15 text-white ring-white/30"
                        : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8"
                    }`}
                  >
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${COLOR_SWATCH[p.color] ?? "bg-zinc-500"}`} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-xl bg-white/15 py-2.5 text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-black/30 px-5 py-2.5 text-sm text-zinc-400 ring-1 ring-white/10 hover:bg-white/8 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
