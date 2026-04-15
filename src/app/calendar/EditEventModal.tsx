"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import {
  updateEvent,
  updateRecurringEvent,
  getRecurringEventData,
} from "@/app/actions/calendar";
import type { PopoverEntry } from "./EventPopover";
import { COLOR_SWATCH } from "@/lib/colors";
import Modal, { ModalFooter, ModalFieldLabel } from "@/components/Modal";

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
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [startTime, setStartTime] = useState(toTimeStr(entry.startAt));
  const [endTime, setEndTime] = useState(toTimeStr(entry.endAt));
  const [dateVal, setDateVal] = useState(toDateStr(entry.startAt));
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.find((p) => p.key === entry.projectKey)?.id ?? null
  );

  // Recurring-only
  const [days, setDays] = useState<number[]>([]);
  const [biweekly, setBiweekly] = useState(false);
  const [allDay, setAllDay] = useState(entry.allDay ?? false);

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
        setStartTime(minsToTimeStr(data.startMin));
        setEndTime(minsToTimeStr(data.endMin));
        if (data.notes) setNotes(data.notes);
        setBiweekly(data.biweekly ?? false);
        setAllDay(data.allDay ?? false);
        void proj;
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
    if (!allDay && timeStrToMins(endTime) <= timeStrToMins(startTime)) {
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
          selectedProjectId,
          notes || null,
          biweekly,
          allDay
        );
      } else {
        if (allDay) {
          result = await updateEvent(entry.id, title, dateVal, dateVal, selectedProjectId, notes || null, true);
        } else {
          const d = new Date(dateVal + "T00:00:00");
          const [sh, sm] = startTime.split(":").map(Number);
          const [eh, em] = endTime.split(":").map(Number);
          const startAt = new Date(d); startAt.setHours(sh, sm, 0, 0);
          const endAt = new Date(d); endAt.setHours(eh, em, 0, 0);
          result = await updateEvent(entry.id, title, startAt.toISOString(), endAt.toISOString(), selectedProjectId, notes || null, false);
        }
      }
      if (result?.error) { setError(result.error); return; }
      onSaved();
    });
  }

  const modalTitle = `Edit ${isRecurring ? "recurring series" : "event"}`;

  return (
    <Modal title={modalTitle} onClose={onClose} size="md">
      {isRecurring && (
        <p className="-mt-3 mb-4 text-xs text-zinc-500">Changes apply to all future occurrences</p>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-500">Loading…</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

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

          {/* Date (one-off only) + All day + Times */}
          <div className="space-y-3">
            {!isRecurring && (
              <div className="flex items-center gap-4">
                <div>
                  <ModalFieldLabel>Date</ModalFieldLabel>
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    className="rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs text-zinc-400">All day</span>
                </label>
              </div>
            )}
            {isRecurring && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-zinc-400">All day</span>
              </label>
            )}
            {!allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <ModalFieldLabel>Start</ModalFieldLabel>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <ModalFieldLabel>End</ModalFieldLabel>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Days (recurring only) */}
          {isRecurring && (
            <div className="space-y-3">
              <div>
                <ModalFieldLabel>Repeats on</ModalFieldLabel>
                <div className="flex gap-1.5 mt-0.5">
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
              <button
                type="button"
                onClick={() => setBiweekly((v) => !v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                  biweekly
                    ? "bg-white/15 text-white ring-white/30"
                    : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
                }`}
              >
                Biweekly
              </button>
            </div>
          )}

          {/* Notes */}
          <div>
            <ModalFieldLabel>Notes</ModalFieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note…"
              rows={2}
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-500 resize-none"
            />
          </div>

          {/* Group */}
          <div>
            <ModalFieldLabel>Group</ModalFieldLabel>
            <div className="flex flex-wrap gap-2 mt-0.5">
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
          <ModalFooter
            submitLabel="Save Changes"
            pendingLabel="Saving…"
            isPending={isPending}
            onCancel={onClose}
          />
        </form>
      )}
    </Modal>
  );
}
