"use client";

import { useState, useTransition } from "react";
import { deleteSection, updateSection } from "@/app/actions/whiteboard";
import { getSectionColorStyle } from "@/lib/colors";
import CountdownWidget from "./CountdownWidget";
import WeatherWidget from "./WeatherWidget";
import UpcomingEventsWidget from "./UpcomingEventsWidget";

type Event = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  projectKey?: string;
  projectLabel?: string;
  projectColor?: string;
};

type WidgetSection = {
  id: string;
  title: string;
  color: string | null;
  fullWidth: boolean;
  widgetType: string | null;
  widgetConfig: string | null;
};

export default function WidgetCard({
  section,
  todayEvents,
}: {
  section: WidgetSection;
  todayEvents?: Event[];
}) {
  const cs = getSectionColorStyle(section.color);
  const [isPending, startTransition] = useTransition();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(section.title);

  function handleDeleteSection() {
    if (!confirm(`Delete widget "${section.title}"?`)) return;
    startTransition(() => deleteSection(section.id));
  }

  function handleTitleSave() {
    if (!titleVal.trim()) {
      setEditingTitle(false);
      setTitleVal(section.title);
      return;
    }
    if (titleVal === section.title) {
      setEditingTitle(false);
      return;
    }
    startTransition(async () => {
      await updateSection(section.id, titleVal);
      setEditingTitle(false);
    });
  }

  function renderWidget() {
    switch (section.widgetType) {
      case "upcoming-events":
        return <UpcomingEventsWidget events={todayEvents ?? []} />;
      case "countdown":
        return <CountdownWidget config={section.widgetConfig} />;
      case "weather":
        return <WeatherWidget config={section.widgetConfig} />;
      default:
        return (
          <p className="text-sm text-zinc-500 italic">
            Unknown widget type: {section.widgetType}
          </p>
        );
    }
  }

  return (
    <div
      className={`rounded-3xl p-5 ring-1 ${cs.ring} bg-white/5 ${
        isPending ? "opacity-70 transition-opacity" : ""
      }`}
    >
      {/* Header */}
      <div className="group flex items-center gap-2 mb-4">
        {editingTitle ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setEditingTitle(false);
                  setTitleVal(section.title);
                }
              }}
              className="flex-1 rounded-lg bg-black/40 px-2 py-1 text-lg font-semibold outline-none ring-1 ring-white/20 focus:ring-white/40"
              autoFocus
            />
            <button
              onClick={handleTitleSave}
              className="rounded-lg bg-white/15 px-2 py-0.5 text-xs hover:bg-white/20 transition-colors"
            >
              Save
            </button>
          </div>
        ) : (
          <h2
            className={`flex-1 text-lg font-semibold tracking-tight ${cs.accent} cursor-pointer`}
            onDoubleClick={() => setEditingTitle(true)}
            title="Double-click to edit title"
          >
            {section.title}
          </h2>
        )}

        {!editingTitle && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] text-zinc-600 uppercase tracking-wider">
              {section.widgetType}
            </span>
            <button
              onClick={() => setEditingTitle(true)}
              className="rounded-lg bg-white/8 px-2 py-1 text-[10px] text-zinc-400 hover:bg-white/15 transition-colors"
              title="Edit title"
            >
              ✎
            </button>
            <button
              onClick={handleDeleteSection}
              className="rounded-lg bg-rose-500/10 px-2 py-1 text-[10px] text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Delete widget"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Widget content */}
      {renderWidget()}
    </div>
  );
}
