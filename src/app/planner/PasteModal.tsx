"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { CalendarPlus, CalendarCheck, X } from "lucide-react";
import Modal from "@/components/Modal";
import { parsePlanText, CATEGORY_LABELS, ALL_CATEGORIES, formatMin, detectCategory } from "@/lib/planParser";
import type { ParsedPlanEntry, PlanEntryCategory } from "@/lib/planParser";
import {
  ensureDailyPlan,
  bulkCreatePlanEntries,
  getDayCalendarEvents,
  createCalendarEvent,
} from "@/app/actions/planner";
import type { CalendarEventForPlan } from "@/app/actions/planner";

const PLACEHOLDER = `Paste your plan here. The first line can be a date:

Monday April 7th 2026
4:30–5:15 Run
5:15–5:35 Yoga / mobility
7:15–7:45 Feed animals, breakfast
8:15–8:30 Prep for registration
9:00–9:30 FE Standup
11:00–12:30 FE deep work – Web CSR testing
12:30–1:00 Lunch / reset
9:00 Sleep

Date formats: 4/7/2026, April 7th 2026, Monday April 7 2026
If no date on first line, uses the currently selected date.

Calendar events for the day will be cross-checked automatically.`;

/** Check if a parsed entry "covers" a calendar event by fuzzy title match + time overlap. */
function entryMatchesEvent(entry: ParsedPlanEntry, event: CalendarEventForPlan): boolean {
  // Title similarity: check if either title contains a significant portion of the other
  const entryWords = entry.title.toLowerCase().split(/[\s\-–/]+/).filter((w) => w.length > 2);
  const eventWords = event.title.toLowerCase().split(/[\s\-–/]+/).filter((w) => w.length > 2);

  const titleMatch =
    entryWords.some((w) => event.title.toLowerCase().includes(w)) ||
    eventWords.some((w) => entry.title.toLowerCase().includes(w));

  // Time overlap: at least some overlap in time ranges
  const timeOverlap =
    entry.startMin < event.endMin && entry.endMin > event.startMin;

  return titleMatch && timeOverlap;
}

/** Map calendar Category to plan PlanEntryCategory. */
function calCategoryToPlanCategory(calCategory: string): PlanEntryCategory {
  switch (calCategory) {
    case "WORK":
      return "MEETING";
    case "PERSONAL":
      return "PERSONAL_CARE";
    case "FAMILY":
      return "SOCIAL";
    default:
      return "OTHER";
  }
}

/** Map PlanEntryCategory to calendar Category. */
function planCategoryToCalCategory(planCat: PlanEntryCategory): string {
  switch (planCat) {
    case "MEETING":
    case "DEEP_WORK":
    case "ADMIN":
      return "WORK";
    case "SOCIAL":
      return "FAMILY";
    default:
      return "PERSONAL";
  }
}

type PreviewEntry = ParsedPlanEntry & {
  source: "parsed" | "calendar"; // where this entry came from
  calendarEventId?: string; // linked calendar event ID if matched
  notOnCalendar?: boolean; // true if this is a meeting-type not found on calendar
  createOnCalendar?: boolean; // user toggled: create this on calendar when saving
};

export default function PasteModal({
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
  const router = useRouter();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<PreviewEntry[] | null>(null);
  const [targetDate, setTargetDate] = useState<string>(dateStr);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventForPlan[]>([]);

  async function handleParse() {
    const result = parsePlanText(text);
    if (result.entries.length === 0) {
      setError("Could not parse any entries. Check the format and try again.");
      return;
    }
    setError("");

    const effectiveDate = result.detectedDate ?? dateStr;
    if (result.detectedDate) {
      setTargetDate(result.detectedDate);
    }

    // Fetch calendar events for cross-check
    let events: CalendarEventForPlan[] = [];
    try {
      events = await getDayCalendarEvents(effectiveDate);
      setCalendarEvents(events);
    } catch {
      // If fetch fails, proceed without cross-check
    }

    // Build preview entries from parsed text
    const meetingCategories: PlanEntryCategory[] = ["MEETING", "DEEP_WORK", "ADMIN"];
    const preview: PreviewEntry[] = result.entries.map((entry) => {
      // Check if this entry matches a calendar event
      const matchedEvent = events.find((ev) => entryMatchesEvent(entry, ev));
      const isMeetingType = meetingCategories.includes(entry.category);

      return {
        ...entry,
        source: "parsed" as const,
        calendarEventId: matchedEvent?.id,
        notOnCalendar: isMeetingType && !matchedEvent,
        createOnCalendar: false,
      };
    });

    // Find calendar events NOT covered by any parsed entry → add as suggestions
    const unmatchedEvents = events.filter(
      (ev) => !result.entries.some((entry) => entryMatchesEvent(entry, ev)),
    );

    for (const ev of unmatchedEvents) {
      const category = calCategoryToPlanCategory(ev.category);
      preview.push({
        title: ev.title,
        startMin: ev.startMin,
        endMin: ev.endMin,
        category,
        source: "calendar",
        calendarEventId: ev.id,
      });
    }

    // Sort all entries by start time
    preview.sort((a, b) => a.startMin - b.startMin);
    setParsed(preview);
  }

  function updateParsedCategory(index: number, category: PlanEntryCategory) {
    if (!parsed) return;
    const updated = [...parsed];
    updated[index] = { ...updated[index], category };
    setParsed(updated);
  }

  function removeParsedEntry(index: number) {
    if (!parsed) return;
    setParsed(parsed.filter((_, i) => i !== index));
  }

  function toggleCreateOnCalendar(index: number) {
    if (!parsed) return;
    const updated = [...parsed];
    updated[index] = {
      ...updated[index],
      createOnCalendar: !updated[index].createOnCalendar,
    };
    setParsed(updated);
  }

  function handleSave() {
    if (!parsed || parsed.length === 0) return;

    startTransition(async () => {
      const id = await ensureDailyPlan(targetDate);
      await bulkCreatePlanEntries(
        id,
        parsed.map((e) => ({
          title: e.title,
          startMin: e.startMin,
          endMin: e.endMin,
          category: e.category,
          description: e.description,
        })),
      );

      // Create calendar events for entries toggled for creation
      const toCreate = parsed.filter((e) => e.createOnCalendar);
      for (const entry of toCreate) {
        await createCalendarEvent(
          targetDate,
          entry.title,
          entry.startMin,
          entry.endMin,
          planCategoryToCalCategory(entry.category),
        );
      }

      // Navigate to the target date if different from current
      if (targetDate !== dateStr) {
        router.push(`/planner?date=${targetDate}`);
      }
      onSaved();
      onClose();
    });
  }

  const targetDateLabel = format(parse(targetDate, "yyyy-MM-dd", new Date()), "EEEE, MMMM d, yyyy");
  const dateChanged = targetDate !== dateStr;

  const calendarSuggestions = parsed?.filter((e) => e.source === "calendar").length ?? 0;
  const unmatchedMeetings = parsed?.filter((e) => e.notOnCalendar).length ?? 0;

  return (
    <Modal title="Paste Plan" onClose={onClose} size="lg">
      {!parsed ? (
        /* Input state */
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            placeholder={PLACEHOLDER}
            autoFocus
            rows={14}
            className="w-full rounded-xl bg-black/40 px-4 py-3 text-sm font-mono outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-600 resize-y"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleParse}
              disabled={!text.trim()}
              className="flex-1 rounded-xl bg-white/15 py-2.5 text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              Parse
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-black/30 px-5 py-2.5 text-sm text-zinc-400 ring-1 ring-white/10 hover:bg-white/8 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Preview state */
        <div className="space-y-4">
          {/* Date indicator */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              {parsed.length} entries for:
            </p>
            <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              dateChanged
                ? "bg-blue-400/15 text-blue-300 ring-1 ring-blue-400/20"
                : "bg-white/8 text-zinc-400 ring-1 ring-white/10"
            }`}>
              {targetDateLabel}
              {dateChanged && " (from text)"}
            </span>
          </div>

          {/* Cross-check summary */}
          {(calendarSuggestions > 0 || unmatchedMeetings > 0) && (
            <div className="rounded-lg bg-blue-400/8 px-3 py-2 ring-1 ring-blue-400/15 text-xs text-blue-300 space-y-1">
              {calendarSuggestions > 0 && (
                <p>
                  <CalendarCheck size={12} className="inline mr-1.5 -mt-0.5" />
                  {calendarSuggestions} calendar event{calendarSuggestions > 1 ? "s" : ""} added from your calendar (not in pasted text)
                </p>
              )}
              {unmatchedMeetings > 0 && (
                <p>
                  <CalendarPlus size={12} className="inline mr-1.5 -mt-0.5" />
                  {unmatchedMeetings} meeting{unmatchedMeetings > 1 ? "s" : ""} not found on calendar — click <CalendarPlus size={10} className="inline -mt-0.5" /> to add
                </p>
              )}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {parsed.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ring-1 ${
                  entry.source === "calendar"
                    ? "bg-blue-400/5 ring-blue-400/15"
                    : "bg-black/30 ring-white/8"
                }`}
              >
                <span className="w-24 flex-shrink-0 text-xs text-zinc-500 font-mono">
                  {formatMin(entry.startMin)}
                </span>
                <span className="flex-1 min-w-0 text-sm text-zinc-200 truncate">
                  {entry.title}
                  {entry.source === "calendar" && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-blue-400/15 px-1.5 py-0.5 text-[10px] text-blue-300 ring-1 ring-blue-400/20">
                      <CalendarCheck size={10} />
                      From calendar
                    </span>
                  )}
                  {entry.notOnCalendar && (
                    <span className="ml-2 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-300 ring-1 ring-amber-400/20">
                      Not on calendar
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Add to calendar toggle for meetings not on calendar */}
                  {entry.notOnCalendar && (
                    <button
                      onClick={() => toggleCreateOnCalendar(i)}
                      title={entry.createOnCalendar ? "Won't add to calendar" : "Add to calendar on save"}
                      className={`rounded-md p-1 transition-colors ${
                        entry.createOnCalendar
                          ? "bg-emerald-400/15 text-emerald-400 ring-1 ring-emerald-400/20"
                          : "text-zinc-600 hover:text-blue-400 hover:bg-blue-400/10"
                      }`}
                    >
                      <CalendarPlus size={14} />
                    </button>
                  )}
                  <select
                    value={entry.category}
                    onChange={(e) => updateParsedCategory(i, e.target.value as PlanEntryCategory)}
                    className="rounded-lg bg-black/40 px-2 py-1 text-[11px] text-zinc-400 ring-1 ring-white/10 outline-none"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeParsedEntry(i)}
                    className="text-zinc-600 hover:text-red-400 transition-colors text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || parsed.length === 0}
              className="flex-1 rounded-xl bg-white/15 py-2.5 text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving..." : `Save ${parsed.length} entries`}
            </button>
            <button
              type="button"
              onClick={() => setParsed(null)}
              className="rounded-xl bg-black/30 px-5 py-2.5 text-sm text-zinc-400 ring-1 ring-white/10 hover:bg-white/8 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-black/30 px-5 py-2.5 text-sm text-zinc-400 ring-1 ring-white/10 hover:bg-white/8 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
