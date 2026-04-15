"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTimezone, parseDateInTz } from "@/lib/timezone";
import type { PlanEntryCategory, PlanEntryStatus } from "@prisma/client";

// ─── Sorting Helper ────────────────────────────────────────────────────────

/** Re-sort all entries in a plan by startMin asc, endMin asc, title asc. */
async function resortPlanEntries(planId: string) {
  const entries = await prisma.planEntry.findMany({
    where: { planId },
    select: { id: true, startMin: true, endMin: true, title: true },
    orderBy: [{ startMin: "asc" }, { endMin: "asc" }, { title: "asc" }],
  });

  if (entries.length === 0) return;

  await prisma.$transaction(
    entries.map((entry, i) =>
      prisma.planEntry.update({ where: { id: entry.id }, data: { order: i } }),
    ),
  );
}

// ─── Plan CRUD ──────────────────────────────────────────────────────────────

export async function ensureDailyPlan(dateStr: string): Promise<string> {
  const tz = await getTimezone();
  const date = parseDateInTz(dateStr, tz);

  const existing = await prisma.dailyPlan.findUnique({ where: { date } });
  if (existing) return existing.id;

  const plan = await prisma.dailyPlan.create({ data: { date } });
  revalidatePath("/planner");
  return plan.id;
}

// ─── Entry CRUD ─────────────────────────────────────────────────────────────

export async function createPlanEntry(
  planId: string,
  title: string,
  startMin: number,
  endMin: number,
  category: PlanEntryCategory = "OTHER",
  description?: string,
) {
  await prisma.planEntry.create({
    data: {
      planId,
      title,
      startMin,
      endMin,
      category,
      description: description || undefined,
      order: 0, // will be corrected by reorder below
    },
  });

  // Re-sort all entries: startMin asc, endMin asc, title asc
  await resortPlanEntries(planId);
  revalidatePath("/planner");
}

export async function bulkCreatePlanEntries(
  planId: string,
  entries: {
    title: string;
    startMin: number;
    endMin: number;
    category: PlanEntryCategory;
    description?: string;
  }[],
) {
  // Delete existing entries for this plan before bulk insert
  await prisma.planEntry.deleteMany({ where: { planId } });

  await prisma.planEntry.createMany({
    data: entries.map((e, i) => ({
      planId,
      title: e.title,
      startMin: e.startMin,
      endMin: e.endMin,
      category: e.category,
      description: e.description || undefined,
      order: i,
    })),
  });

  // Re-sort by time
  await resortPlanEntries(planId);
  revalidatePath("/planner");
}

export async function updatePlanEntryStatus(
  id: string,
  status: PlanEntryStatus,
) {
  await prisma.planEntry.update({
    where: { id },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  revalidatePath("/planner");
}

export async function updatePlanEntryActualTime(
  id: string,
  actualStartMin: number,
  actualEndMin: number,
) {
  await prisma.planEntry.update({
    where: { id },
    data: { actualStartMin, actualEndMin },
  });

  revalidatePath("/planner");
}

export async function updatePlanEntry(
  id: string,
  title?: string,
  startMin?: number,
  endMin?: number,
  category?: PlanEntryCategory,
  description?: string,
) {
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (startMin !== undefined) data.startMin = startMin;
  if (endMin !== undefined) data.endMin = endMin;
  if (category !== undefined) data.category = category;
  if (description !== undefined) data.description = description || null;

  const entry = await prisma.planEntry.update({ where: { id }, data });

  // Re-sort if time changed
  if (startMin !== undefined || endMin !== undefined) {
    await resortPlanEntries(entry.planId);
  }

  revalidatePath("/planner");
}

export async function deletePlanEntry(id: string) {
  await prisma.planEntry.delete({ where: { id } });
  revalidatePath("/planner");
}

export async function updatePlanNotes(planId: string, notes: string) {
  await prisma.dailyPlan.update({
    where: { id: planId },
    data: { notes: notes || null },
  });
  revalidatePath("/planner");
}

export async function deleteDailyPlan(planId: string) {
  // Entries cascade-delete via the relation
  await prisma.dailyPlan.delete({ where: { id: planId } });
  revalidatePath("/planner");
}

export async function reorderPlanEntries(orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.planEntry.update({ where: { id }, data: { order: i } })
    ),
  );
  revalidatePath("/planner");
}

// ─── Calendar Cross-Check ──────────────────────────────────────────────────

export type CalendarEventForPlan = {
  id: string;
  title: string;
  startMin: number;
  endMin: number;
  category: string;
  recurring: boolean;
};

export async function getDayCalendarEvents(
  dateStr: string,
): Promise<CalendarEventForPlan[]> {
  const tz = await getTimezone();
  const dayStart = parseDateInTz(dateStr, tz);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  // One-off events
  const events = await prisma.event.findMany({
    where: {
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
      allDay: false,
    },
    orderBy: { startAt: "asc" },
  });

  const results: CalendarEventForPlan[] = events.map((e) => {
    const start = new Date(e.startAt);
    const end = new Date(e.endAt);
    return {
      id: e.id,
      title: e.title,
      startMin: start.getHours() * 60 + start.getMinutes(),
      endMin: end.getHours() * 60 + end.getMinutes(),
      category: e.category,
      recurring: false,
    };
  });

  // Recurring events for this day of week
  const { addDays, differenceInCalendarDays, startOfDay } = await import("date-fns");
  const dayOfWeek = dayStart.getDay();

  const recurring = await prisma.recurringEvent.findMany({
    where: {
      startDate: { lte: dayEnd },
      allDay: false,
    },
    include: { days: true, exceptions: true },
  });

  for (const r of recurring) {
    const days = new Set(r.days.map((d) => d.day));
    if (!days.has(dayOfWeek)) continue;

    // Check exceptions
    const exceptionDates = new Set(
      r.exceptions.map((e) => startOfDay(e.date).toISOString()),
    );
    if (exceptionDates.has(startOfDay(dayStart).toISOString())) continue;

    // Biweekly check
    if (r.biweekly) {
      const weeksSinceStart = Math.floor(
        differenceInCalendarDays(dayStart, startOfDay(r.startDate)) / 7,
      );
      if (weeksSinceStart % 2 !== 0) continue;
    }

    results.push({
      id: r.id,
      title: r.title,
      startMin: r.startMin,
      endMin: r.endMin,
      category: r.category,
      recurring: true,
    });
  }

  results.sort((a, b) => a.startMin - b.startMin);
  return results;
}

export async function createCalendarEvent(
  dateStr: string,
  title: string,
  startMin: number,
  endMin: number,
  category: string,
) {
  const tz = await getTimezone();
  const dayStart = parseDateInTz(dateStr, tz);

  const startAt = new Date(dayStart.getTime() + startMin * 60 * 1000);
  const endAt = new Date(dayStart.getTime() + endMin * 60 * 1000);

  await prisma.event.create({
    data: {
      title,
      startAt,
      endAt,
      category: category as "WORK" | "PERSONAL" | "FAMILY",
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/planner");
}
