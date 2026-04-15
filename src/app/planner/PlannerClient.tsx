"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, subDays, parse, startOfYear, differenceInDays, isLeapYear } from "date-fns";
import { ChevronLeft, ChevronRight, ClipboardPaste, Plus, Trash2 } from "lucide-react";
import type { SerializedDailyPlan } from "@/lib/plannerData";
import { computeAnalytics } from "@/lib/plannerData";
import PlanEntryRow from "./PlanEntryRow";
import PasteModal from "./PasteModal";
import AddEntryModal from "./AddEntryModal";
import {
  ensureDailyPlan,
  createPlanEntry,
  updatePlanEntryStatus,
  deletePlanEntry,
  deleteDailyPlan,
  updatePlanEntry,
  updatePlanEntryActualTime,
} from "@/app/actions/planner";
import {
  formatMin,
  formatDuration,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/planParser";
import type { PlanEntryCategory, PlanEntryStatus } from "@prisma/client";

const STATUS_CYCLE: PlanEntryStatus[] = ["PLANNED", "COMPLETED", "SKIPPED", "CANCELLED"];

export default function PlannerClient({
  dateStr,
  plan,
}: {
  dateStr: string;
  plan: SerializedDailyPlan | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPaste, setShowPaste] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(false);

  const dateObj = parse(dateStr, "yyyy-MM-dd", new Date());
  const dayLabel = format(dateObj, "EEEE, MMMM d, yyyy");
  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

  // Day of year counter
  const dayOfYear = differenceInDays(dateObj, startOfYear(dateObj)) + 1;
  const totalDays = isLeapYear(dateObj) ? 366 : 365;
  const daysRemaining = totalDays - dayOfYear;

  const entries = plan?.entries ?? [];

  function navigateDate(offset: number) {
    const newDate = offset > 0 ? addDays(dateObj, offset) : subDays(dateObj, Math.abs(offset));
    router.push(`/planner?date=${format(newDate, "yyyy-MM-dd")}`);
  }

  function goToday() {
    router.push(`/planner?date=${format(new Date(), "yyyy-MM-dd")}`);
  }

  const handleStatusCycle = useCallback(
    (entryId: string, currentStatus: PlanEntryStatus) => {
      const idx = STATUS_CYCLE.indexOf(currentStatus);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      startTransition(() => updatePlanEntryStatus(entryId, next));
    },
    [startTransition],
  );

  const handleStatusSet = useCallback(
    (entryId: string, status: PlanEntryStatus) => {
      startTransition(() => updatePlanEntryStatus(entryId, status));
    },
    [startTransition],
  );

  const handleDelete = useCallback(
    (entryId: string) => {
      startTransition(() => deletePlanEntry(entryId));
    },
    [startTransition],
  );

  const handleUpdate = useCallback(
    (entryId: string, title: string, startMin: number, endMin: number, category: PlanEntryCategory, description?: string) => {
      startTransition(() => updatePlanEntry(entryId, title, startMin, endMin, category, description));
    },
    [startTransition],
  );

  const handleActualTime = useCallback(
    (entryId: string, actualStartMin: number, actualEndMin: number) => {
      startTransition(() => updatePlanEntryActualTime(entryId, actualStartMin, actualEndMin));
    },
    [startTransition],
  );

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickAddText.trim()) return;

    const planId = plan?.id ?? (await ensureDailyPlan(dateStr));
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const roundedMin = Math.round(currentMin / 15) * 15;

    startTransition(async () => {
      await createPlanEntry(planId, quickAddText.trim(), roundedMin, roundedMin + 30);
      setQuickAddText("");
    });
  }

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Compute inline analytics
  const completed = entries.filter((e) => e.status === "COMPLETED").length;
  const skipped = entries.filter((e) => e.status === "SKIPPED").length;
  const cancelled = entries.filter((e) => e.status === "CANCELLED").length;
  const total = entries.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Category time breakdown for completed entries
  const catTimes = new Map<PlanEntryCategory, number>();
  for (const e of entries.filter((e) => e.status === "COMPLETED")) {
    const mins = e.endMin - e.startMin;
    catTimes.set(e.category, (catTimes.get(e.category) ?? 0) + mins);
  }
  const totalCompletedMin = Array.from(catTimes.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Daily Planner</h1>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-sm text-zinc-400">{dayLabel}</p>
            <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11px] font-mono text-zinc-500 ring-1 ring-white/8">
              Day {dayOfYear} ({daysRemaining} remaining)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateDate(-1)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/8 hover:text-zinc-200 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToday}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isToday
                ? "bg-white/15 text-white"
                : "text-zinc-400 hover:bg-white/8 hover:text-zinc-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => navigateDate(1)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/8 hover:text-zinc-200 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Action bar */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setShowPaste(true)}
          className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 ring-1 ring-white/10 hover:bg-white/15 transition-colors"
        >
          <ClipboardPaste size={15} />
          Paste Plan
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-black/30 px-4 py-2.5 text-sm font-medium text-zinc-400 ring-1 ring-white/10 hover:bg-white/8 hover:text-zinc-200 transition-colors"
        >
          <Plus size={15} />
          Add Entry
        </button>

        {plan && (
          <button
            onClick={() => {
              if (confirmDeletePlan) {
                startTransition(async () => {
                  await deleteDailyPlan(plan.id);
                  setConfirmDeletePlan(false);
                });
              } else {
                setConfirmDeletePlan(true);
                setTimeout(() => setConfirmDeletePlan(false), 3000);
              }
            }}
            title={confirmDeletePlan ? "Click again to confirm" : "Delete entire plan"}
            className={`ml-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              confirmDeletePlan
                ? "bg-red-500/15 text-red-400 ring-1 ring-red-400/30"
                : "bg-black/30 text-zinc-500 ring-1 ring-white/10 hover:bg-white/8 hover:text-red-400"
            }`}
          >
            <Trash2 size={15} />
            {confirmDeletePlan ? "Confirm Delete" : "Delete Plan"}
          </button>
        )}
      </div>

      {/* Timeline */}
      {entries.length > 0 ? (
        <div className={`space-y-1.5 transition-opacity ${isPending ? "opacity-60" : ""}`}>
          {entries.map((entry) => (
            <PlanEntryRow
              key={entry.id}
              entry={entry}
              onStatusCycle={handleStatusCycle}
              onStatusSet={handleStatusSet}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onActualTime={handleActualTime}
            />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-zinc-500">No plan for this day yet.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Paste your plan from an LLM or add entries manually.
          </p>
        </div>
      )}

      {/* Quick add */}
      {(plan || entries.length > 0) && (
        <form onSubmit={handleQuickAdd} className="mt-4">
          <input
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            placeholder="+ Quick add unplanned item..."
            className="w-full rounded-xl bg-black/20 px-4 py-3 text-sm outline-none ring-1 ring-white/8 placeholder:text-zinc-600 focus:ring-white/20 transition-colors"
          />
        </form>
      )}

      {/* Inline Analytics */}
      {entries.length > 0 && (
        <div className="mt-8 rounded-2xl bg-black/30 px-5 py-4 ring-1 ring-white/8">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Summary
          </h3>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-300">
              <span className="font-semibold text-emerald-400">{completed}</span>
              <span className="text-zinc-500">/{total} completed</span>
            </span>
            {skipped > 0 && (
              <span className="text-amber-400/80">{skipped} skipped</span>
            )}
            {cancelled > 0 && (
              <span className="text-red-400/80">{cancelled} cancelled</span>
            )}
            <span className="ml-auto text-zinc-400">
              {completionRate}%
            </span>
          </div>

          {/* Category bar */}
          {totalCompletedMin > 0 && (
            <div className="mt-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
                {Array.from(catTimes.entries()).map(([cat, mins]) => {
                  const pct = (mins / totalCompletedMin) * 100;
                  return (
                    <div
                      key={cat}
                      title={`${CATEGORY_LABELS[cat]}: ${formatDuration(0, mins)}`}
                      className={`${CATEGORY_BAR_COLORS[cat] ?? "bg-zinc-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {Array.from(catTimes.entries()).map(([cat, mins]) => (
                  <span key={cat} className="text-[11px] text-zinc-500">
                    {CATEGORY_LABELS[cat]}: {formatDuration(0, mins)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showPaste && (
        <PasteModal
          dateStr={dateStr}
          planId={plan?.id ?? null}
          onClose={() => setShowPaste(false)}
          onSaved={handleRefresh}
        />
      )}
      {showAdd && (
        <AddEntryModal
          dateStr={dateStr}
          planId={plan?.id ?? null}
          onClose={() => setShowAdd(false)}
          onSaved={handleRefresh}
        />
      )}
    </div>
  );
}

const CATEGORY_BAR_COLORS: Record<string, string> = {
  DEEP_WORK: "bg-blue-500",
  MEETING: "bg-purple-500",
  ADMIN: "bg-zinc-400",
  PERSONAL_CARE: "bg-teal-500",
  EXERCISE: "bg-green-500",
  MEAL: "bg-amber-500",
  COMMUTE: "bg-orange-500",
  SOCIAL: "bg-pink-500",
  LEARNING: "bg-indigo-500",
  BREAK: "bg-emerald-500",
  OTHER: "bg-zinc-500",
};
