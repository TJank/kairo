import { prisma } from "@/lib/prisma";

export async function ensureSeed() {
  const count = await prisma.section.count();
  if (count > 0) return;

  await prisma.section.create({
    data: {
      title: "Yearly Goals",
      order: 1,
      items: {
        create: [
          { order: 1, text: "Run 360 miles" },
          { order: 2, text: "Host personal website live" },
        ],
      },
    },
  });

  await prisma.section.create({
    data: {
      title: "Q1 Goals",
      order: 2,
      items: {
        create: [
          { order: 1, text: "Implement home hydroponic system" },
          { order: 2, text: "Work: FE demo complete for Brad" },
          { order: 3, text: "Work: 200 QA automation tests created!" },
        ],
      },
    },
  });

  await prisma.section.create({
    data: {
      title: "Notes / Quotes",
      order: 3,
      items: {
        create: [
          {
            order: 1,
            text: "Discipline beats motivation.",
          },
        ],
      },
    },
  });
}

export async function getDashboard() {
  return prisma.section.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
}
