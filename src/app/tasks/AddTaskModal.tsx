"use client";

import { useState, useTransition } from "react";
import { createTask, createTaskSection } from "@/app/actions/tasks";
import { COLOR_OPTIONS, COLOR_SWATCH } from "@/lib/colors";
import Modal, { ModalFooter, ModalInput, ModalFieldLabel, ColorPicker } from "@/components/Modal";

type Priority = "HIGH" | "MEDIUM" | "LOW";
type Project = { id: string; key: string; name: string; color: string; scope?: string };

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export default function AddTaskModal({
  projects: initialProjects,
  onClose,
}: {
  projects: Project[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  // Task fields
  const [text, setText] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Inline new-section form
  const [showNewSection, setShowNewSection] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [newSectionShared, setNewSectionShared] = useState(false);
  const [sectionError, setSectionError] = useState("");

  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) { setError("Task description is required"); return; }

    startTransition(async () => {
      let sectionId = selectedSectionId;

      // If new section form is open and filled, create it first
      if (showNewSection && newKey.trim() && newName.trim()) {
        const result = await createTaskSection(
          newKey.trim().toUpperCase(),
          newName.trim(),
          newColor,
          newSectionShared ? "shared" : "tasks",
        );
        if (!result || "error" in result) {
          setSectionError(result?.error ?? "Failed to create section");
          return;
        }
        sectionId = result.id;
      }

      const result = await createTask(text, sectionId, priority, dueDate || null, notes || null, dueTime || null);
      if (result && "error" in result) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <Modal title="New Task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Task description */}
        <ModalInput
          value={text}
          onChange={(v) => { setText(v); setError(""); }}
          placeholder="What needs to be done?"
          autoFocus
          error={error}
        />

        {/* Due date + time */}
        <div>
          <ModalFieldLabel>Due date</ModalFieldLabel>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); if (!e.target.value) setDueTime(""); }}
              className="rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
            />
            {dueDate && (
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="Time (optional)"
                className="rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 text-zinc-300"
              />
            )}
          </div>
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

        {/* Priority */}
        <div>
          <ModalFieldLabel>Priority</ModalFieldLabel>
          <div className="flex gap-2 mt-0.5">
            <button
              type="button"
              onClick={() => setPriority(null)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                priority === null
                  ? "bg-white/15 text-white ring-white/30"
                  : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
              }`}
            >
              None
            </button>
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                  priority === p.value
                    ? "bg-white/15 text-white ring-white/30"
                    : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section */}
        <div>
          <ModalFieldLabel>Section</ModalFieldLabel>
          <div className="flex flex-wrap gap-2 mt-0.5">
            {/* Existing sections */}
            {initialProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedSectionId(p.id); setShowNewSection(false); }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                  selectedSectionId === p.id && !showNewSection
                    ? "bg-white/15 text-white ring-white/30"
                    : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
                }`}
              >
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${COLOR_SWATCH[p.color] ?? "bg-zinc-500"}`} />
                {p.name}
              </button>
            ))}

            {/* New section */}
            <button
              type="button"
              onClick={() => { setShowNewSection(true); setSelectedSectionId(null); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                showNewSection
                  ? "bg-white/15 text-white ring-white/30"
                  : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
              }`}
            >
              + New section
            </button>
          </div>

          {/* Inline new section form */}
          {showNewSection && (
            <div className="mt-3 rounded-xl bg-black/30 p-4 ring-1 ring-white/10 space-y-3">
              <div className="flex gap-2">
                <input
                  value={newKey}
                  onChange={(e) => { setNewKey(e.target.value.toUpperCase()); setSectionError(""); }}
                  placeholder="KEY"
                  maxLength={15}
                  className="w-20 rounded-lg bg-black/40 px-2 py-1.5 text-sm font-mono outline-none ring-1 ring-white/20 focus:ring-white/40 placeholder:text-zinc-600"
                />
                <input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setSectionError(""); }}
                  placeholder="Section name"
                  className="flex-1 rounded-lg bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40 placeholder:text-zinc-600"
                />
              </div>
              <ColorPicker options={COLOR_OPTIONS} value={newColor} onChange={setNewColor} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSectionShared}
                  onChange={(e) => setNewSectionShared(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-zinc-400">Also show in Calendar</span>
              </label>
              {sectionError && <p className="text-xs text-rose-400">{sectionError}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <ModalFooter
          submitLabel="Create Task"
          pendingLabel="Creating…"
          isPending={isPending}
          onCancel={onClose}
        />
      </form>
    </Modal>
  );
}
