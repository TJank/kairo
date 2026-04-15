"use client";

import { useState, useTransition } from "react";
import Modal, { ModalFooter, ModalInput, ModalFieldLabel } from "@/components/Modal";
import { ALL_CATEGORIES, CATEGORY_LABELS, detectCategory } from "@/lib/planParser";
import type { PlanEntryCategory } from "@/lib/planParser";
import { ensureDailyPlan, createPlanEntry } from "@/app/actions/planner";

export default function AddEntryModal({
  dateStr,
  planId,
  onClose,
  onSaved,
}: {
  dateStr: string;
  planId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [startH, setStartH] = useState("9");
  const [startM, setStartM] = useState("00");
  const [endH, setEndH] = useState("9");
  const [endM, setEndM] = useState("30");
  const [category, setCategory] = useState<PlanEntryCategory>("OTHER");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleTitleChange(val: string) {
    setTitle(val);
    // Auto-detect category as user types
    if (val.length > 2) {
      const detected = detectCategory(val);
      if (detected !== "OTHER") setCategory(detected);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const startMin = parseInt(startH) * 60 + parseInt(startM);
    const endMin = parseInt(endH) * 60 + parseInt(endM);

    if (endMin <= startMin) {
      setError("End time must be after start time");
      return;
    }

    startTransition(async () => {
      const id = planId ?? (await ensureDailyPlan(dateStr));
      await createPlanEntry(id, title.trim(), startMin, endMin, category, description.trim() || undefined);
      onSaved();
      onClose();
    });
  }

  return (
    <Modal title="Add Plan Entry" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <ModalFieldLabel>Title</ModalFieldLabel>
          <ModalInput
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g. Deep work: Feature implementation"
            autoFocus
            error={error}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <ModalFieldLabel>Start Time</ModalFieldLabel>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="23"
                value={startH}
                onChange={(e) => setStartH(e.target.value)}
                className="w-16 rounded-xl bg-black/40 px-3 py-2.5 text-sm text-center outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
              />
              <span className="text-zinc-500">:</span>
              <input
                type="number"
                min="0"
                max="59"
                step="5"
                value={startM}
                onChange={(e) => setStartM(e.target.value)}
                className="w-16 rounded-xl bg-black/40 px-3 py-2.5 text-sm text-center outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>

          <div className="flex-1">
            <ModalFieldLabel>End Time</ModalFieldLabel>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="23"
                value={endH}
                onChange={(e) => setEndH(e.target.value)}
                className="w-16 rounded-xl bg-black/40 px-3 py-2.5 text-sm text-center outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
              />
              <span className="text-zinc-500">:</span>
              <input
                type="number"
                min="0"
                max="59"
                step="5"
                value={endM}
                onChange={(e) => setEndM(e.target.value)}
                className="w-16 rounded-xl bg-black/40 px-3 py-2.5 text-sm text-center outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        </div>

        <div>
          <ModalFieldLabel>Category</ModalFieldLabel>
          <div className="flex gap-2 flex-wrap">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium ring-1 transition-colors ${
                  category === cat
                    ? "bg-white/15 text-white ring-white/30"
                    : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <ModalFieldLabel>Description (optional)</ModalFieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            className="w-full rounded-xl bg-black/40 px-4 py-3 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-500 resize-y"
          />
        </div>

        <ModalFooter
          submitLabel="Add Entry"
          pendingLabel="Adding..."
          isPending={isPending}
          onCancel={onClose}
        />
      </form>
    </Modal>
  );
}
