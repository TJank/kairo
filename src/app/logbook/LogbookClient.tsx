"use client";

import { useRouter, usePathname } from "next/navigation";

type Task = {
  id: string;
  text: string;
  notes: string | null;
  completedAt: string;
  priority: string | null;
  project: { id: string; key: string; name: string; color: string } | null;
  weekLabel: string;
};

type Project = { id: string; key: string; name: string; color: string };

const PROJECT_COLOR_MAP: Record<string, string> = {
  blue:   "bg-blue-500/20 text-blue-300",
  purple: "bg-purple-500/20 text-purple-300",
  green:  "bg-emerald-500/20 text-emerald-300",
  red:    "bg-red-500/20 text-red-300",
  yellow: "bg-yellow-500/20 text-yellow-300",
  orange: "bg-orange-500/20 text-orange-300",
  pink:   "bg-pink-500/20 text-pink-300",
  teal:   "bg-teal-500/20 text-teal-300",
  indigo: "bg-indigo-500/20 text-indigo-300",
  rose:   "bg-rose-500/20 text-rose-300",
  lime:   "bg-lime-500/20 text-lime-300",
  cyan:   "bg-cyan-500/20 text-cyan-300",
};

const PRIORITY_BADGE: Record<string, string> = {
  HIGH:   "bg-rose-500/20 text-rose-300 ring-rose-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  LOW:    "bg-zinc-500/20 text-zinc-400 ring-zinc-500/30",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function LogbookTaskRow({ task }: { task: Task }) {
  const colorClass = task.project
    ? (PROJECT_COLOR_MAP[task.project.color] ?? "bg-zinc-500/20 text-zinc-300")
    : null;

  return (
    <div className="rounded-xl bg-black/20 px-4 py-3 ring-1 ring-white/8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-300 flex-1 min-w-0">{task.text}</span>
        {task.priority && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 flex-shrink-0 ${PRIORITY_BADGE[task.priority]}`}>
            {task.priority}
          </span>
        )}
        {task.project && colorClass && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0 ${colorClass}`}>
            {task.project.name}
          </span>
        )}
        <span className="text-[11px] text-zinc-500 flex-shrink-0">
          {formatDate(task.completedAt)}
        </span>
      </div>
      {task.notes && (
        <p className="mt-1.5 text-xs text-zinc-500 whitespace-pre-wrap">{task.notes}</p>
      )}
    </div>
  );
}

export default function LogbookClient({
  tasks,
  projects,
  activeProjectId,
}: {
  tasks: Task[];
  projects: Project[];
  activeProjectId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function setFilter(projectId: string | null) {
    const url = new URL(pathname, window.location.origin);
    if (projectId) {
      url.searchParams.set("section", projectId);
    } else {
      url.searchParams.delete("section");
    }
    router.push(url.pathname + url.search);
  }

  // Group tasks by week
  const byWeek: Map<string, Task[]> = new Map();
  for (const task of tasks) {
    const key = task.weekLabel;
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(task);
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Logbook</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {tasks.length} completed task{tasks.length !== 1 ? "s" : ""}
          {activeProjectId ? " in this section" : " total"}
        </p>
      </div>

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
            activeProjectId === null
              ? "bg-white/15 text-white ring-white/30"
              : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
          }`}
        >
          All sections
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setFilter(p.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
              activeProjectId === p.id
                ? "bg-white/15 text-white ring-white/30"
                : "bg-black/30 text-zinc-400 ring-white/10 hover:bg-white/8 hover:text-zinc-200"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-zinc-500">No completed tasks yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(byWeek.entries()).map(([week, weekTasks]) => (
            <div key={week}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {week}
              </h2>
              <div className="space-y-2">
                {weekTasks.map((task) => (
                  <LogbookTaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
