import { getTasksGrouped } from "@/lib/tasks";
import TaskGroup from "./TaskGroup";
import TasksHeader from "./TasksHeader";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const { tasks, projects, byProject } = await getTasksGrouped();

  const serialize = (t: (typeof tasks)[number]) => ({
    id: t.id,
    text: t.text,
    done: t.done,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    priority: t.priority,
    subtasks: t.subtasks.map((s) => ({
      id: s.id,
      text: s.text,
      done: s.done,
      order: s.order,
    })),
  });

  const allProjects = projects.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    color: p.color,
  }));

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {tasks.filter((t) => !t.done).length} open ·{" "}
            completed tasks auto-archive after 7 days
          </p>
        </div>
        <TasksHeader projects={allProjects} />
      </div>

      {projects.length === 0 && (byProject.get(null) ?? []).length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-zinc-500">No tasks yet.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Use "+ Add Section" to create a project group, then add tasks.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {/* Project groups */}
          {projects.map((project) => {
            const projectTasks = (byProject.get(project.id) ?? []).map(serialize);
            return (
              <TaskGroup
                key={project.id}
                project={project}
                tasks={projectTasks}
                allProjects={allProjects}
              />
            );
          })}

          {/* Personal (no project) */}
          <TaskGroup
            project={null}
            tasks={(byProject.get(null) ?? []).map(serialize)}
            allProjects={allProjects}
          />
        </div>
      )}
    </div>
  );
}
