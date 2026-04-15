import { prisma } from "@/lib/prisma";

export async function getDashboard() {
  return prisma.section.findMany({
    orderBy: [{ type: "asc" }, { order: "asc" }],
    include: { items: { orderBy: { order: "asc" } } },
  });
}
