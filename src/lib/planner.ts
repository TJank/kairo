import { prisma } from "@/lib/prisma";
import { addDays, startOfDay } from "date-fns";

export type CalendarEntry =
  | {
      kind: "event";
      id: string;
      title: string;
      startAt: string;
      endAt: string;
      category: string;
      projectKey?: string;
      projectLabel?: string;
      projectColor?: string;
    }
  | {
      kind: "task";
      id: string;
      title: string;
      allDay: boolean;
      startAt: string;
      endAt: string;
      category: string;
      done: boolean;
      projectKey?: string;
      projectLabel?: string;
      projectColor?: string;
    };

function minsToTime(date: Date, mins: number) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(mins);
  return d;
}

export async function getWeekEntries(from: Date, to: Date) {
  // One-off events in range
  const events = await prisma.event.findMany({
    where: {
      startAt: { lt: to },
      endAt: { gt: from },
    },
    orderBy: { startAt: "asc" },
    include: { project: true },
  });

  // Tasks due in range (time-based) OR all-day tasks with dueDate in range
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { dueAt: { gte: from, lt: to } },
        { dueDate: { gte: startOfDay(from), lt: startOfDay(to) } },
      ],
    },
    orderBy: [{ dueAt: "asc" }, { dueDate: "asc" }],
    include: { project: true },
  });

  // Recurring event occurrences (generated on the fly using junction table)
  const recurring = await prisma.recurringEvent.findMany({
    where: {
      startDate: { lte: to },
    },
    include: { project: true, days: true },
  });

  const recurringOccurrences: CalendarEntry[] = [];
  for (const r of recurring) {
    const days = new Set(r.days.map((d) => d.day));
    for (let d = startOfDay(from); d < to; d = addDays(d, 1)) {
      if (d < startOfDay(r.startDate)) continue;
      if (!days.has(d.getDay())) continue;
      const startAt = minsToTime(d, r.startMin);
      const endAt = minsToTime(d, r.endMin);
      if (startAt >= to || endAt <= from) continue;

      recurringOccurrences.push({
        kind: "event",
        id: r.id + ":" + startAt.toISOString(),
        title: r.title,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        category: r.category,
        projectKey: r.project?.key ?? undefined,
        projectLabel: r.project?.name ?? undefined,
        projectColor: r.project?.color ?? undefined,
      });
    }
  }

  const oneOffEntries: CalendarEntry[] = events.map((e) => ({
    kind: "event",
    id: e.id,
    title: e.title,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    category: e.category,
    projectKey: e.project?.key ?? undefined,
    projectLabel: e.project?.name ?? undefined,
    projectColor: e.project?.color ?? undefined,
  }));

  const taskEntries: CalendarEntry[] = tasks.map((t) => {
    if (t.dueAt) {
      const startAt = t.dueAt;
      const endAt = new Date(t.dueAt.getTime() + 30 * 60 * 1000);
      return {
        kind: "task",
        id: t.id,
        title: t.text,
        allDay: false,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        category: t.category,
        done: t.done,
        projectKey: t.project?.key ?? undefined,
        projectLabel: t.project?.name ?? undefined,
        projectColor: t.project?.color ?? undefined,
      };
    }

    const dueDate = t.dueDate ?? startOfDay(new Date());
    const startAt = startOfDay(dueDate);
    const endAt = addDays(startAt, 1);
    return {
      kind: "task",
      id: t.id,
      title: t.text,
      allDay: true,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      category: t.category,
      done: t.done,
      projectKey: t.project?.key ?? undefined,
      projectLabel: t.project?.name ?? undefined,
      projectColor: t.project?.color ?? undefined,
    };
  });

  const all = [...recurringOccurrences, ...oneOffEntries, ...taskEntries];
  all.sort((a, b) => a.startAt.localeCompare(b.startAt));
  return all;
}
