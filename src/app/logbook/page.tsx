import { getLogbookTasks, getLogbookProjects } from "@/lib/logbook";
import LogbookClient from "./LogbookClient";

export const dynamic = "force-dynamic";

export default async function LogbookPage({
  searchParams,
}: {
  searchParams: { section?: string };
}) {
  const projectId = searchParams.section ?? null;
  const [tasks, projects] = await Promise.all([
    getLogbookTasks(projectId),
    getLogbookProjects(),
  ]);

  return <LogbookClient tasks={tasks} projects={projects} activeProjectId={projectId} />;
}
