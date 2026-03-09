"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

// ─── Project / Category Actions ──────────────────────────────────────────────

export async function createProject(key: string, name: string, color: string, scope?: string) {
  const k = key.trim().toUpperCase();
  const n = name.trim();
  if (!k || !n) return { error: "Key and name are required" };

  try {
    const project = await prisma.project.create({ data: { key: k, name: n, color, scope: scope ?? "calendar" } });
    revalidatePath("/calendar");
    revalidatePath("/tasks");
    return { id: project.id };
  } catch {
    return { error: `Key "${k}" is already in use` };
  }
}

export async function updateProject(id: string, name?: string, color?: string, scope?: string) {
  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    const n = name.trim();
    if (!n) return { error: "Name is required" };
    data.name = n;
  }
  if (color !== undefined) data.color = color;
  if (scope !== undefined) data.scope = scope;

  await prisma.project.update({ where: { id }, data });
  revalidatePath("/calendar");
  revalidatePath("/tasks");
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/tasks");
}

// ─── Event Actions ────────────────────────────────────────────────────────────

export async function createEvent(
  title: string,
  startAt: string,
  endAt: string,
  projectId?: string | null,
  recurrenceDays?: number[],
  notes?: string | null
) {
  const t = title.trim();
  if (!t) return { error: "Title is required" };

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: "Invalid times" };
  if (end <= start) return { error: "End must be after start" };

  const category = projectId ? "WORK" : "PERSONAL";

  if (recurrenceDays && recurrenceDays.length > 0) {
    // Create recurring event
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();

    await prisma.recurringEvent.create({
      data: {
        title: t,
        notes: notes ?? null,
        category,
        projectId: projectId ?? null,
        startDate,
        startMin,
        endMin,
        days: { create: recurrenceDays.map((day) => ({ day })) },
      },
    });
  } else {
    await prisma.event.create({
      data: {
        title: t,
        notes: notes ?? null,
        category,
        projectId: projectId ?? null,
        startAt: start,
        endAt: end,
      },
    });
  }

  revalidatePath("/calendar");
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  revalidatePath("/calendar");
}

export async function updateEvent(
  id: string,
  title: string,
  startAt: string,
  endAt: string,
  projectId?: string | null,
  notes?: string | null
) {
  const t = title.trim();
  if (!t) return { error: "Title is required" };
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: "Invalid times" };
  if (end <= start) return { error: "End must be after start" };
  const category = projectId ? "WORK" : "PERSONAL";
  await prisma.event.update({
    where: { id },
    data: { title: t, startAt: start, endAt: end, projectId: projectId ?? null, category, notes: notes ?? null },
  });
  revalidatePath("/calendar");
}

export async function deleteRecurringEvent(id: string) {
  await prisma.recurringEvent.delete({ where: { id } });
  revalidatePath("/calendar");
}

export async function updateRecurringEvent(
  id: string,
  title: string,
  startMin: number,
  endMin: number,
  days: number[],
  projectId?: string | null,
  notes?: string | null
) {
  const t = title.trim();
  if (!t) return { error: "Title is required" };
  if (days.length === 0) return { error: "Select at least one day" };
  const category = projectId ? "WORK" : "PERSONAL";
  await prisma.recurringEventDay.deleteMany({ where: { recurringEventId: id } });
  await prisma.recurringEvent.update({
    where: { id },
    data: {
      title: t,
      notes: notes ?? null,
      startMin,
      endMin,
      category,
      projectId: projectId ?? null,
      days: { create: days.map((day) => ({ day })) },
    },
  });
  revalidatePath("/calendar");
}

export async function getRecurringEventData(id: string) {
  const r = await prisma.recurringEvent.findUnique({
    where: { id },
    include: { days: true },
  });
  if (!r) return null;
  return {
    title: r.title,
    notes: r.notes,
    startMin: r.startMin,
    endMin: r.endMin,
    projectId: r.projectId,
    days: r.days.map((d) => d.day),
  };
}

export async function cancelRecurringOccurrence(recurringEventId: string, date: Date) {
  await prisma.recurringEventException.create({
    data: {
      recurringEventId,
      date: startOfDay(date),
    },
  });
  revalidatePath("/calendar");
}
