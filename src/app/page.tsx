import { getDashboard } from "@/lib/dashboard";
import WhiteboardBoard from "./WhiteboardBoard";

export const dynamic = "force-dynamic";

export default async function WhiteboardPage() {
  const sections = await getDashboard();

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

  return <WhiteboardBoard sections={sorted} />;
}
