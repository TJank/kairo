import { prisma } from "@/lib/prisma";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });

  const serializedProjects = projects.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    color: p.color,
  }));

  return <CalendarClient projects={serializedProjects} />;
}
