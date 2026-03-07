"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Priority } from "@prisma/client";

export async function createTask(
  text: string,
  projectId?: string | null,
  priority?: Priority | null,
  dueDate?: string | null
) {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Text is required" };

  await prisma.task.create({
    data: {
      text: trimmed,
      projectId: projectId ?? null,
      priority: priority ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      category: projectId ? "WORK" : "PERSONAL",
    },
  });

  revalidatePath("/tasks");
}

export async function updateTask(
  id: string,
  text?: string,
  priority?: Priority | null,
  dueDate?: string | null
) {
  const data: Record<string, unknown> = {};
  if (text !== undefined) {
    const trimmed = text.trim();
    if (!trimmed) return { error: "Text is required" };
    data.text = trimmed;
  }
  if (priority !== undefined) data.priority = priority;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

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

export async function createTaskSection(key: string, name: string, color: string) {
  const k = key.trim().toUpperCase();
  const n = name.trim();
  if (!k || !n) return { error: "Key and name are required" };

  try {
    const project = await prisma.project.create({
      data: { key: k, name: n, color, scope: "tasks" },
    });
    revalidatePath("/tasks");
    return { id: project.id };
  } catch {
    return { error: `Key "${k}" is already in use` };
  }
}

export async function updateTaskSection(id: string, name: string, color: string) {
  const n = name.trim();
  if (!n) return { error: "Name is required" };
  await prisma.project.update({ where: { id }, data: { name: n, color } });
  revalidatePath("/tasks");
}

export async function deleteTaskSection(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/tasks");
}
