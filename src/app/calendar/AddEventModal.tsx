"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { createEvent } from "@/app/actions/calendar";

type Project = { id: string; key: string; name: string; color: string };

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

function minsToTimeStr(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeStrToMins(s: string) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export default function AddEventModal({
  date,
  startSlotMin,
  projects,
  onClose,
  onCreated,
}: {
  date: Date;
  startSlotMin: number;
  projects: Project[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const endSlotMin = Math.min(startSlotMin + 60, 23 * 60 + 59);

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [startTime, setStartTime] = useState(minsToTimeStr(startSlotMin));
  const [endTime, setEndTime] = useState(minsToTimeStr(endSlotMin));
  const [recurrence, setRecurrence] = useState<"none" | "mon-fri" | "daily" | "custom">("none");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleCustomDay(day: number) {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function buildStartAt() {
    const [h, m] = startTime.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  function buildEndAt() {
    const [h, m] = endTime.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  function getRecurrenceDays(): number[] | undefined {
    if (recurrence === "none") return undefined;
    if (recurrence === "mon-fri") return [1, 2, 3, 4, 5];
    if (recurrence === "daily") return [0, 1, 2, 3, 4, 5, 6];
    return customDays.length > 0 ? customDays : undefined;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (timeStrToMins(endTime) <= timeStrToMins(startTime)) {
      setError("End must be after start");
      return;
    }

    startTransition(async () => {
      const result = await createEvent(
        title,
        buildStartAt(),
        buildEndAt(),
        projectId || null,
        getRecurrenceDays()
      );
      if (result?.error) { setError(result.error); return; }
      onCreated();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 p-6 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add Event</h2>
          <div className="text-sm text-zinc-400">{format(date, "EEE, MMM d")}</div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder="Event title…"
              className="w-full rounded-xl bg-black/40 px-3 py-2.5 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-zinc-400 mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-zinc-400 mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Category (optional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
              >
                <option value="">No category</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-2">Recurrence</label>
            <div className="flex gap-2 flex-wrap">
              {(["none", "mon-fri", "daily", "custom"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecurrence(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs ring-1 transition-colors ${
                    recurrence === r
                      ? "bg-white/15 ring-white/30"
                      : "bg-black/30 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {r === "none" ? "One-time" : r === "mon-fri" ? "Mon–Fri" : r === "daily" ? "Daily" : "Custom"}
                </button>
              ))}
            </div>

            {recurrence === "custom" && (
              <div className="mt-3 flex gap-2">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleCustomDay(d.value)}
                    className={`h-8 w-8 rounded-full text-xs ring-1 transition-colors ${
                      customDays.includes(d.value)
                        ? "bg-white/20 ring-white/40"
                        : "bg-black/30 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    {d.label.slice(0, 1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-white/15 py-2.5 text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Creating…" : "Create Event"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-black/30 px-4 py-2.5 text-sm ring-1 ring-white/10 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
