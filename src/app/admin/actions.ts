"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function toggleItem(id: string) {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return;
  await prisma.item.update({ where: { id }, data: { done: !item.done } });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteItem(id: string) {
  await prisma.item.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function addItem(sectionId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const maxOrder = await prisma.item.aggregate({
    where: { sectionId },
    _max: { order: true },
  });

  await prisma.item.create({
    data: {
      sectionId,
      text: trimmed,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateItemText(id: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await prisma.item.update({ where: { id }, data: { text: trimmed } });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateSectionTitle(id: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;
  await prisma.section.update({ where: { id }, data: { title: trimmed } });
  revalidatePath("/");
  revalidatePath("/admin");
}
