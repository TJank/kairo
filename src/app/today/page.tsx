import { getWeekEntries } from "@/lib/planner";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import TodayClient from "./TodayClient";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);

  const [entries, todayTasks] = await Promise.all([
    getWeekEntries(from, to),
    prisma.task.findMany({
      where: {
        done: false,
        OR: [
          { dueDate: { gte: from, lte: to } },
          { dueAt: { gte: from, lte: to } },
        ],
      },
      orderBy: [{ dueAt: "asc" }, { dueDate: "asc" }, { priority: "asc" }],
      include: { project: true },
    }),
  ]);

  const serializedTasks = todayTasks.map((t) => ({
    id: t.id,
    text: t.text,
    notes: t.notes,
    done: t.done,
    priority: t.priority,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    project: t.project
      ? { id: t.project.id, key: t.project.key, name: t.project.name, color: t.project.color }
      : null,
  }));

  // Only include calendar events (not task entries) for the timeline
  const calendarEvents = entries.filter((e) => e.kind === "event");

  return (
    <TodayClient
      date={now.toISOString()}
      events={calendarEvents as any[]}
      tasks={serializedTasks}
    />
  );
}
