"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ─── Project / Category Actions ──────────────────────────────────────────────

export async function createProject(key: string, name: string, color: string) {
  const k = key.trim().toUpperCase();
  const n = name.trim();
  if (!k || !n) return { error: "Key and name are required" };

  try {
    await prisma.project.create({ data: { key: k, name: n, color } });
    revalidatePath("/calendar");
    revalidatePath("/tasks");
  } catch {
    return { error: `Key "${k}" is already in use` };
  }
}

export async function updateProject(id: string, name?: string, color?: string) {
  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    const n = name.trim();
    if (!n) return { error: "Name is required" };
    data.name = n;
  }
  if (color !== undefined) data.color = color;

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
  recurrenceDays?: number[]
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
