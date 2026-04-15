import { prisma } from "@/lib/prisma";
import { startOfDay, addDays } from "date-fns";
import { getTimezone, parseDateInTz } from "@/lib/timezone";
import type { PlanEntryCategory, PlanEntryStatus } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SerializedPlanEntry = {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  category: PlanEntryCategory;
  status: PlanEntryStatus;
  order: number;
  startMin: number;
  endMin: number;
  actualStartMin: number | null;
  actualEndMin: number | null;
  completedAt: string | null;
  eventId: string | null;
};

export type SerializedDailyPlan = {
  id: string;
  date: string;
  notes: string | null;
  entries: SerializedPlanEntry[];
};

export type PlanAnalytics = {
  totalEntries: number;
  completed: number;
  skipped: number;
  cancelled: number;
  planned: number;
  completionRate: number;
  onTimeCount: number;
  onTimeRate: number;
  categoryBreakdown: { category: PlanEntryCategory; minutes: number }[];
  totalPlannedMin: number;
};

// ─── Data Fetching ──────────────────────────────────────────────────────────

export async function getDailyPlan(dateStr: string): Promise<SerializedDailyPlan | null> {
  const tz = await getTimezone();
  const date = parseDateInTz(dateStr, tz);

  const plan = await prisma.dailyPlan.findUnique({
    where: { date },
    include: {
      entries: { orderBy: [{ order: "asc" }, { startMin: "asc" }] },
    },
  });

  if (!plan) return null;

  return {
    id: plan.id,
    date: plan.date.toISOString(),
    notes: plan.notes,
    entries: plan.entries.map((e) => ({
      id: e.id,
      planId: e.planId,
      title: e.title,
      description: e.description,
      category: e.category,
      status: e.status,
      order: e.order,
      startMin: e.startMin,
      endMin: e.endMin,
      actualStartMin: e.actualStartMin,
      actualEndMin: e.actualEndMin,
      completedAt: e.completedAt?.toISOString() ?? null,
      eventId: e.eventId,
    })),
  };
}

export async function computeAnalytics(entries: SerializedPlanEntry[]): Promise<PlanAnalytics> {
  const total = entries.length;
  const completed = entries.filter((e) => e.status === "COMPLETED").length;
  const skipped = entries.filter((e) => e.status === "SKIPPED").length;
  const cancelled = entries.filter((e) => e.status === "CANCELLED").length;
  const planned = entries.filter((e) => e.status === "PLANNED").length;

  // On-time: entries with actualStartMin within 15 min of planned startMin
  const withActual = entries.filter((e) => e.actualStartMin !== null);
  const onTimeCount = withActual.filter(
    (e) => Math.abs(e.actualStartMin! - e.startMin) <= 15
  ).length;

  // Category breakdown (completed entries only)
  const catMap = new Map<PlanEntryCategory, number>();
  for (const e of entries.filter((e) => e.status === "COMPLETED")) {
    const mins = e.endMin - e.startMin;
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + mins);
  }

  const totalPlannedMin = entries.reduce((sum, e) => sum + (e.endMin - e.startMin), 0);

  return {
    totalEntries: total,
    completed,
    skipped,
    cancelled,
    planned,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    onTimeCount,
    onTimeRate: withActual.length > 0 ? Math.round((onTimeCount / withActual.length) * 100) : 0,
    categoryBreakdown: Array.from(catMap.entries())
      .map(([category, minutes]) => ({ category, minutes }))
      .sort((a, b) => b.minutes - a.minutes),
    totalPlannedMin,
  };
}
