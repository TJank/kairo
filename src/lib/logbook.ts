import { prisma } from "@/lib/prisma";
import { startOfWeek, format } from "date-fns";

export type LogbookTask = {
  id: string;
  text: string;
  notes: string | null;
  completedAt: string;
  dueDate: string | null;
  priority: string | null;
  project: { id: string; key: string; name: string; color: string } | null;
  weekLabel: string;
};

export async function getLogbookTasks(projectId?: string | null) {
  const tasks = await prisma.task.findMany({
    where: {
      done: true,
      completedAt: { not: null },
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { completedAt: "desc" },
    include: { project: true },
  });

  return tasks.map((t) => {
    const completedAt = t.completedAt!;
    const weekStart = startOfWeek(completedAt, { weekStartsOn: 0 });
    return {
      id: t.id,
      text: t.text,
      notes: t.notes,
      completedAt: completedAt.toISOString(),
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      priority: t.priority,
      project: t.project
        ? { id: t.project.id, key: t.project.key, name: t.project.name, color: t.project.color }
        : null,
      weekLabel: `Week of ${format(weekStart, "MMM d")}`,
    };
  });
}

export async function getLogbookProjects() {
  return prisma.project.findMany({
    where: { scope: { in: ["tasks", "shared"] } },
    orderBy: { name: "asc" },
    select: { id: true, key: true, name: true, color: true },
  });
}
