"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TIMEZONES } from "@/lib/timezone";

export async function updateTimezone(tz: string) {
  const valid = TIMEZONES.some((t) => t.value === tz);
  if (!valid) return { error: "Invalid timezone" };

  await prisma.setting.upsert({
    where: { key: "timezone" },
    update: { value: tz },
    create: { key: "timezone", value: tz },
  });

  revalidatePath("/", "layout");
}
