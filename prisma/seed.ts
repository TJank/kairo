import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sectionCount = await prisma.section.count();
  if (sectionCount === 0) {
    await prisma.section.create({
      data: {
        title: "Quotes",
        type: "QUOTES",
        order: 0,
        items: {
          create: [{ order: 1, text: "Discipline beats motivation." }],
        },
      },
    });

    await prisma.section.create({
      data: {
        title: "Yearly Goals",
        type: "GOALS",
        color: "emerald",
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
        type: "GOALS",
        color: "blue",
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
        title: "Dreamboard",
        type: "DREAMBOARD",
        color: "purple",
        order: 3,
        items: {
          create: [
            { order: 1, text: "Build a cabin in the woods" },
            { order: 2, text: "Travel to Japan" },
          ],
        },
      },
    });

    console.log("Seeded whiteboard sections.");
  } else {
    console.log("Sections already exist, skipping seed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
