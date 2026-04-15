"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Priority } from "@prisma/client";
import { getTimezone, parseDateInTz, parseDateTimeInTz } from "@/lib/timezone";

export async function createTask(
  text: string,
  projectId?: string | null,
  priority?: Priority | null,
  dueDate?: string | null,
  notes?: string | null,
  dueTime?: string | null
) {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Text is required" };

  const tz = await getTimezone();

  let parsedDueDate: Date | null = null;
  let dueAllDay = true;

  if (dueDate && dueTime) {
    parsedDueDate = parseDateTimeInTz(`${dueDate}T${dueTime}`, tz);
    dueAllDay = false;
  } else if (dueDate) {
    parsedDueDate = parseDateInTz(dueDate, tz);
    dueAllDay = true;
  }

  await prisma.task.create({
    data: {
      text: trimmed,
      projectId: projectId ?? null,
      priority: priority ?? null,
      dueDate: parsedDueDate,
      dueAllDay,
      notes: notes ?? null,
      category: projectId ? "WORK" : "PERSONAL",
    },
  });

  revalidatePath("/tasks");
}

export async function updateTask(
  id: string,
  text?: string,
  priority?: Priority | null,
  dueDate?: string | null,
  notes?: string | null,
  dueTime?: string | null
) {
  const data: Record<string, unknown> = {};
  if (text !== undefined) {
    const trimmed = text.trim();
    if (!trimmed) return { error: "Text is required" };
    data.text = trimmed;
  }
  if (priority !== undefined) data.priority = priority;
  if (dueDate !== undefined) {
    const tz = await getTimezone();
    if (dueDate && dueTime) {
      data.dueDate = parseDateTimeInTz(`${dueDate}T${dueTime}`, tz);
      data.dueAllDay = false;
    } else if (dueDate) {
      data.dueDate = parseDateInTz(dueDate, tz);
      data.dueAllDay = true;
    } else {
      data.dueDate = null;
      data.dueAllDay = true;
    }
  }
  if (notes !== undefined) data.notes = notes;

  await prisma.task.update({ where: { id }, data });
  revalidatePath("/tasks");
}

export async function toggleTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  await prisma.task.update({
    where: { id },
    data: {
      done: !task.done,
      completedAt: !task.done ? new Date() : null,
    },
  });
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
}

export async function createSubTask(taskId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Text is required" };

  const maxOrder = await prisma.subTask.aggregate({
    where: { taskId },
    _max: { order: true },
  });

  await prisma.subTask.create({
    data: {
      taskId,
      text: trimmed,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });
  revalidatePath("/tasks");
}

export async function toggleSubTask(id: string) {
  const sub = await prisma.subTask.findUnique({ where: { id } });
  if (!sub) return;
  await prisma.subTask.update({ where: { id }, data: { done: !sub.done } });
  revalidatePath("/tasks");
}

export async function deleteSubTask(id: string) {
  await prisma.subTask.delete({ where: { id } });
  revalidatePath("/tasks");
}

// ─── Task Sections ────────────────────────────────────────────────────────────
// Delegate to projects module (can't use bare re-exports in "use server" files)

import {
  createTaskSection as _createTaskSection,
  updateTaskSection as _updateTaskSection,
  deleteTaskSection as _deleteTaskSection,
} from "./projects";

export async function createTaskSection(key: string, name: string, color: string, scope?: string) {
  return _createTaskSection(key, name, color, scope);
}

export async function updateTaskSection(id: string, name: string, color: string, scope?: string) {
  return _updateTaskSection(id, name, color, scope);
}

export async function deleteTaskSection(id: string) {
  return _deleteTaskSection(id);
}
