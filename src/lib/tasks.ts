import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

const ARCHIVE_DAYS = 7;

export async function getTasksGrouped() {
  const archiveCutoff = subDays(new Date(), ARCHIVE_DAYS);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { done: false },
        { done: true, completedAt: { gte: archiveCutoff } },
      ],
    },
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    include: {
      project: true,
      subtasks: { orderBy: { order: "asc" } },
    },
  });

  const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });

  const byProject = new Map<string | null, typeof tasks>();
  byProject.set(null, []);
  for (const p of projects) byProject.set(p.id, []);

  for (const task of tasks) {
    const key = task.projectId ?? null;
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key)!.push(task);
  }

  return { tasks, projects, byProject };
}
