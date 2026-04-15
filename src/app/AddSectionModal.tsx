"use client";

import { useState, useTransition } from "react";
import { createSection } from "@/app/actions/whiteboard";
import { SECTION_COLOR_OPTIONS } from "@/lib/colors";
import Modal, { ModalFooter, ModalFieldLabel } from "@/components/Modal";

type SectionType = "QUOTES" | "GOALS" | "DREAMBOARD" | "NOTES" | "WIDGET";

const SECTION_TYPES: { value: SectionType; label: string; desc: string }[] = [
  { value: "QUOTES", label: "Quotes", desc: "Inspiring quotes, plain text" },
  { value: "GOALS", label: "Goals", desc: "Checklist with due dates" },
  { value: "DREAMBOARD", label: "Dreamboard", desc: "Aspirational goals" },
  { value: "NOTES", label: "Notes", desc: "Plain text blocks" },
  { value: "WIDGET", label: "Widget", desc: "Dashboard widget card" },
];

const WIDGET_TYPES = [
  { value: "upcoming-events", label: "Upcoming Events", desc: "Today's calendar events" },
  { value: "countdown", label: "Countdown", desc: "Days until a target date" },
  { value: "weather", label: "Weather", desc: "Weather card (placeholder)" },
];

export default function AddSectionModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<SectionType>("GOALS");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Widget-specific
  const [widgetType, setWidgetType] = useState("upcoming-events");
  const [countdownDate, setCountdownDate] = useState("");
  const [countdownLabel, setCountdownLabel] = useState("");
  const [weatherLocation, setWeatherLocation] = useState("");

  function buildWidgetConfig(): string | undefined {
    if (type !== "WIDGET") return undefined;
    switch (widgetType) {
      case "countdown":
        return JSON.stringify({
          targetDate: countdownDate,
          label: countdownLabel || undefined,
        });
      case "weather":
        return JSON.stringify({
          location: weatherLocation || undefined,
        });
      default:
        return undefined;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (type === "WIDGET" && widgetType === "countdown" && !countdownDate) {
      setError("Target date is required for countdown widget");
      return;
    }
    startTransition(async () => {
      await createSection(
        title,
        type,
        color,
        type === "WIDGET" ? widgetType : undefined,
        buildWidgetConfig()
      );
      onClose();
    });
  }

  return (
    <Modal title="Add Section" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-zinc-400">Title</label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            placeholder={type === "WIDGET" ? "e.g. Today's Schedule" : "e.g. Q2 Goals"}
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

        {/* Widget type picker */}
        {type === "WIDGET" && (
          <div>
            <ModalFieldLabel>Widget type</ModalFieldLabel>
            <div className="mt-1 space-y-2">
              {WIDGET_TYPES.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setWidgetType(w.value)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ring-1 transition-colors ${
                    widgetType === w.value
                      ? "bg-white/15 ring-white/30"
                      : "bg-black/30 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="font-medium">{w.label}</div>
                  <div className="mt-0.5 text-xs text-zinc-400">{w.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Countdown config */}
        {type === "WIDGET" && widgetType === "countdown" && (
          <div className="space-y-3">
            <div>
              <ModalFieldLabel>Target date</ModalFieldLabel>
              <input
                type="date"
                value={countdownDate}
                onChange={(e) => setCountdownDate(e.target.value)}
                className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <ModalFieldLabel>Label (optional)</ModalFieldLabel>
              <input
                value={countdownLabel}
                onChange={(e) => setCountdownLabel(e.target.value)}
                placeholder="e.g. Product launch"
                className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-600"
              />
            </div>
          </div>
        )}

        {/* Weather config */}
        {type === "WIDGET" && widgetType === "weather" && (
          <div>
            <ModalFieldLabel>Location (optional)</ModalFieldLabel>
            <input
              value={weatherLocation}
              onChange={(e) => setWeatherLocation(e.target.value)}
              placeholder="e.g. New York, NY"
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-600"
            />
          </div>
        )}

        {/* Color picker (not shown for widgets) */}
        {type !== "WIDGET" && (
          <div>
            <label className="block text-sm text-zinc-400">Accent color</label>
            <div className="mt-1.5 flex gap-2.5">
              {SECTION_COLOR_OPTIONS.map((c) => (
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
        )}

        <ModalFooter
          submitLabel={type === "WIDGET" ? "Add Widget" : "Create Section"}
          pendingLabel="Creating…"
          isPending={isPending}
          onCancel={onClose}
        />
      </form>
    </Modal>
  );
}
