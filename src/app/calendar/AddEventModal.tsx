"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { createEvent, createProject } from "@/app/actions/calendar";
import { COLOR_OPTIONS, COLOR_SWATCH } from "@/lib/colors";
import Modal, { ModalFooter, ModalInput, ModalFieldLabel, ColorPicker } from "@/components/Modal";

type Project = { id: string; key: string; name: string; color: string; scope?: string };

const DAYS_OF_WEEK = [
  { label: "Su", value: 0 },
  { label: "Mo", value: 1 },
  { label: "Tu", value: 2 },
  { label: "We", value: 3 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
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

function dateToInputValue(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function AddEventModal({
  date,
  startSlotMin,
  projects: initialProjects,
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

  // Core fields
  const [title, setTitle] = useState("");
  const [dateVal, setDateVal] = useState(dateToInputValue(date));
  const [startTime, setStartTime] = useState(minsToTimeStr(startSlotMin));
  const [endTime, setEndTime] = useState(minsToTimeStr(endSlotMin));

  // Group
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [newGroupShared, setNewGroupShared] = useState(false);
  const [groupError, setGroupError] = useState("");

  // Notes
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // All day
  const [allDay, setAllDay] = useState(false);

  // Recurrence
  const [recurrence, setRecurrence] = useState<"none" | "mon-fri" | "daily" | "custom">("none");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [biweekly, setBiweekly] = useState(false);

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleCustomDay(day: number) {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function getRecurrenceDays(): number[] | undefined {
    if (recurrence === "none") return undefined;
    if (recurrence === "mon-fri") return [1, 2, 3, 4, 5];
    if (recurrence === "daily") return [0, 1, 2, 3, 4, 5, 6];
    return customDays.length > 0 ? customDays : undefined;
  }

  function buildStartAt() {
    const [h, m] = startTime.split(":").map(Number);
    const d = new Date(dateVal + "T00:00:00");
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  function buildEndAt() {
    const [h, m] = endTime.split(":").map(Number);
    const d = new Date(dateVal + "T00:00:00");
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (!allDay && timeStrToMins(endTime) <= timeStrToMins(startTime)) {
      setError("End time must be after start time");
      return;
    }

    startTransition(async () => {
      let projectId = selectedProjectId;

      if (showNewGroup && newKey.trim() && newName.trim()) {
        const k = newKey.trim().toUpperCase();
        const groupResult = await createProject(k, newName.trim(), newColor, newGroupShared ? "shared" : "calendar");
        if (!groupResult || "error" in groupResult) {
          setGroupError(groupResult?.error ?? "Failed to create group");
          return;
        }
        projectId = groupResult.id;
      }

      const result = await createEvent(
        title,
        allDay ? dateVal : buildStartAt(),
        allDay ? dateVal : buildEndAt(),
        projectId,
        getRecurrenceDays(),
        notes || null,
        recurrence !== "none" ? biweekly : false,
        allDay
      );
      if (result?.error) { setError(result.error); return; }
      onCreated();
      onClose();
    });
  }

  return (
    <Modal title="New Event" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Title */}
        <ModalInput
          value={title}
          onChange={(v) => { setTitle(v); setError(""); }}
          placeholder="Event title"
          autoFocus
          error={error}
        />

        {/* Date + Time */}
        <div className="space-y-3">
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

        {/* Recurrence */}
        <div>
          <ModalFieldLabel>Repeats</ModalFieldLabel>
          <div className="flex gap-2 flex-wrap mt-0.5">
            {(["none", "mon-fri", "daily", "custom"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecurrence(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                  recurrence === r
                    ? "bg-white/15 text-white ring-white/30"
                    : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
                }`}
              >
                {r === "none" ? "One-time" : r === "mon-fri" ? "Mon – Fri" : r === "daily" ? "Every day" : "Custom"}
              </button>
            ))}
          </div>

          {recurrence === "custom" && (
            <div className="mt-3 flex gap-1.5">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleCustomDay(d.value)}
                  className={`h-9 w-9 rounded-full text-xs font-medium ring-1 transition-colors ${
                    customDays.includes(d.value)
                      ? "bg-white/20 text-white ring-white/40"
                      : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {recurrence !== "none" && (
            <div className="mt-3">
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
        </div>

        {/* Group */}
        <div>
          <ModalFieldLabel>Group</ModalFieldLabel>
          <div className="flex flex-wrap gap-2 mt-0.5">
            {/* No group */}
            <button
              type="button"
              onClick={() => { setSelectedProjectId(null); setShowNewGroup(false); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                selectedProjectId === null && !showNewGroup
                  ? "bg-white/15 text-white ring-white/30"
                  : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
              }`}
            >
              None
            </button>

            {/* Existing projects */}
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedProjectId(p.id); setShowNewGroup(false); }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                  selectedProjectId === p.id && !showNewGroup
                    ? "bg-white/15 text-white ring-white/30"
                    : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
                }`}
              >
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${COLOR_SWATCH[p.color] ?? "bg-zinc-500"}`} />
                {p.name}
              </button>
            ))}

            {/* Create new group */}
            <button
              type="button"
              onClick={() => { setShowNewGroup(true); setSelectedProjectId(null); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                showNewGroup
                  ? "bg-white/15 text-white ring-white/30"
                  : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
              }`}
            >
              + New group
            </button>
          </div>

          {/* Inline new group form */}
          {showNewGroup && (
            <div className="mt-3 rounded-xl bg-black/30 p-4 ring-1 ring-white/10 space-y-3">
              <div className="flex gap-2">
                <input
                  value={newKey}
                  onChange={(e) => { setNewKey(e.target.value.toUpperCase()); setGroupError(""); }}
                  placeholder="KEY"
                  maxLength={6}
                  className="w-20 rounded-lg bg-black/40 px-2 py-1.5 text-sm font-mono outline-none ring-1 ring-white/20 focus:ring-white/40 placeholder:text-zinc-600"
                />
                <input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setGroupError(""); }}
                  placeholder="Group name"
                  className="flex-1 rounded-lg bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40 placeholder:text-zinc-600"
                />
              </div>
              <ColorPicker options={COLOR_OPTIONS} value={newColor} onChange={setNewColor} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newGroupShared}
                  onChange={(e) => setNewGroupShared(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-zinc-400">Also show in Tasks</span>
              </label>
              {groupError && <p className="text-xs text-rose-400">{groupError}</p>}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          {showNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note…"
              rows={3}
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-500 resize-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              + Add note
            </button>
          )}
        </div>

        {/* Footer */}
        <ModalFooter
          submitLabel="Create Event"
          pendingLabel="Creating…"
          isPending={isPending}
          onCancel={onClose}
        />
      </form>
    </Modal>
  );
}
