"use client";

import { useState, useTransition } from "react";
import { createSection } from "@/app/actions/whiteboard";

type SectionType = "QUOTES" | "GOALS" | "DREAMBOARD" | "NOTES";

const SECTION_TYPES: { value: SectionType; label: string; desc: string }[] = [
  { value: "QUOTES", label: "Quotes", desc: "Inspiring quotes, plain text" },
  { value: "GOALS", label: "Goals", desc: "Checklist with due dates" },
  { value: "DREAMBOARD", label: "Dreamboard", desc: "Aspirational goals" },
  { value: "NOTES", label: "Notes", desc: "Plain text blocks" },
];

const COLOR_OPTIONS = [
  { value: undefined, swatch: "bg-zinc-600", label: "Zinc" },
  { value: "blue", swatch: "bg-blue-500", label: "Blue" },
  { value: "emerald", swatch: "bg-emerald-500", label: "Emerald" },
  { value: "rose", swatch: "bg-rose-500", label: "Rose" },
  { value: "amber", swatch: "bg-amber-500", label: "Amber" },
  { value: "purple", swatch: "bg-purple-500", label: "Purple" },
  { value: "orange", swatch: "bg-orange-500", label: "Orange" },
];

export default function AddSectionModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<SectionType>("GOALS");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    startTransition(async () => {
      await createSection(title, type, color);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 p-6 ring-1 ring-white/10 shadow-2xl">
        <h2 className="text-xl font-semibold">Add Section</h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-sm text-zinc-400">Title</label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder="e.g. Q2 Goals"
              className="mt-1.5 w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
          </div>

          <div>
            <label className="block text-sm text-zinc-400">Type</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {SECTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-xl px-3 py-2.5 text-left text-sm ring-1 transition-colors ${
                    type === t.value
                      ? "bg-white/15 ring-white/30"
                      : "bg-black/30 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="mt-0.5 text-xs text-zinc-400">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400">Accent color</label>
            <div className="mt-1.5 flex gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value ?? "default"}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`h-7 w-7 rounded-full ${c.swatch} ring-offset-zinc-900 transition-all ${
                    color === c.value
                      ? "ring-2 ring-white ring-offset-2 scale-110"
                      : "ring-0 opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-white/15 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Creating…" : "Create Section"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-black/30 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
