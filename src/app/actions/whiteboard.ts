"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SectionType } from "@prisma/client";

export async function createSection(title: string, type: SectionType, color?: string) {
  const trimmed = title.trim();
  if (!trimmed) return { error: "Title is required" };

  const maxOrder = await prisma.section.aggregate({ _max: { order: true } });

  await prisma.section.create({
    data: {
      title: trimmed,
      type,
      color: color ?? null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  revalidatePath("/");
}

export async function updateSection(
  id: string,
  title?: string,
  color?: string | null,
  fullWidth?: boolean
) {
  const data: Record<string, unknown> = {};
  if (title !== undefined) {
    const trimmed = title.trim();
    if (!trimmed) return { error: "Title is required" };
    data.title = trimmed;
  }
  if (color !== undefined) data.color = color;
  if (fullWidth !== undefined) data.fullWidth = fullWidth;

  await prisma.section.update({ where: { id }, data });
  revalidatePath("/");
}

export async function deleteSection(id: string) {
  await prisma.section.delete({ where: { id } });
  revalidatePath("/");
}

export async function createItem(sectionId: string, text: string, dueDate?: string) {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Text is required" };

  const maxOrder = await prisma.item.aggregate({
    where: { sectionId },
    _max: { order: true },
  });

  await prisma.item.create({
    data: {
      sectionId,
      text: trimmed,
      order: (maxOrder._max.order ?? 0) + 1,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  revalidatePath("/");
}

export async function updateItem(id: string, text?: string, dueDate?: string | null) {
  const data: Record<string, unknown> = {};
  if (text !== undefined) {
    const trimmed = text.trim();
    if (!trimmed) return { error: "Text is required" };
    data.text = trimmed;
  }
  if (dueDate !== undefined) {
    data.dueDate = dueDate ? new Date(dueDate) : null;
  }

  await prisma.item.update({ where: { id }, data });
  revalidatePath("/");
}

export async function toggleItem(id: string) {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return;

  await prisma.item.update({
    where: { id },
    data: {
      done: !item.done,
      completedAt: !item.done ? new Date() : null,
    },
  });

  revalidatePath("/");
}

export async function deleteItem(id: string) {
  await prisma.item.delete({ where: { id } });
  revalidatePath("/");
}

export async function reorderSections(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.section.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/");
}

export async function reorderItems(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.item.update({ where: { id }, data: { order: index } })
    )
  );
  revalidatePath("/");
}
