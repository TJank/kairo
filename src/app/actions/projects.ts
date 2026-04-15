"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ─── Project / Category Actions ──────────────────────────────────────────────
// Shared by both Calendar and Tasks pages.

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

// ─── Task Section Aliases ────────────────────────────────────────────────────
// Convenience wrappers that default scope to "tasks" instead of "calendar".

export async function createTaskSection(key: string, name: string, color: string, scope?: string) {
  return createProject(key, name, color, scope ?? "tasks");
}

export async function updateTaskSection(id: string, name: string, color: string, scope?: string) {
  return updateProject(id, name, color, scope);
}

export async function deleteTaskSection(id: string) {
  return deleteProject(id);
}
