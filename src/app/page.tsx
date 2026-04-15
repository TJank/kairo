import { getDashboard } from "@/lib/dashboard";
import { getWeekEntries } from "@/lib/planner";
import { startOfDay, endOfDay } from "date-fns";
import WhiteboardBoard from "./WhiteboardBoard";

export const dynamic = "force-dynamic";

export default async function WhiteboardPage() {
  const now = new Date();
  const [sections, todayEntries] = await Promise.all([
    getDashboard(),
    getWeekEntries(startOfDay(now), endOfDay(now)),
  ]);

  const serialized = sections.map((s) => ({
    ...s,
    items: s.items.map((item) => ({
      ...item,
      completedAt: item.completedAt ? item.completedAt.toISOString() : null,
      dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    })),
  }));

  // Sort: QUOTES always first, then by section order
  const sorted = [...serialized].sort((a, b) => {
    if (a.type === "QUOTES" && b.type !== "QUOTES") return -1;
    if (b.type === "QUOTES" && a.type !== "QUOTES") return 1;
    return a.order - b.order;
  });

  // Today's calendar events for the upcoming-events widget
  const todayEvents = todayEntries
    .filter((e) => e.kind === "event")
    .map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      endAt: e.endAt,
      allDay: e.allDay ?? false,
      projectKey: e.projectKey,
      projectLabel: e.projectLabel,
      projectColor: e.projectColor,
    }));

  return <WhiteboardBoard sections={sorted} todayEvents={todayEvents} />;
}
