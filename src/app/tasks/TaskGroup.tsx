"use client";

import { useState, useTransition } from "react";
import {
  createTask,
  toggleTask,
  deleteTask,
  updateTask,
  createSubTask,
  toggleSubTask,
  deleteSubTask,
} from "@/app/actions/tasks";

type Priority = "HIGH" | "MEDIUM" | "LOW";

type SubTask = {
  id: string;
  text: string;
  done: boolean;
  order: number;
};

type Task = {
  id: string;
  text: string;
  done: boolean;
  completedAt: string | null;
  dueDate: string | null;
  priority: Priority | null;
  subtasks: SubTask[];
};

type Project = {
  id: string;
  key: string;
  name: string;
  color: string;
} | null;

const PRIORITY_BADGE: Record<Priority, string> = {
  HIGH: "bg-rose-500/20 text-rose-300 ring-rose-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  LOW: "bg-zinc-500/20 text-zinc-400 ring-zinc-500/30",
};

const PROJECT_COLOR_MAP: Record<string, string> = {
  blue: "ring-blue-500/30 text-blue-300",
  emerald: "ring-emerald-500/30 text-emerald-300",
  rose: "ring-rose-500/30 text-rose-300",
  amber: "ring-amber-500/30 text-amber-300",
  purple: "ring-purple-500/30 text-purple-300",
  orange: "ring-orange-500/30 text-orange-300",
  green: "ring-green-500/30 text-green-300",
  indigo: "ring-indigo-500/30 text-indigo-300",
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function TaskRow({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editPriority, setEditPriority] = useState<Priority | "">("");
  const [showAddSub, setShowAddSub] = useState(false);
  const [subText, setSubText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const hasSubtasks = task.subtasks.length > 0;
  const doneSubCount = task.subtasks.filter((s) => s.done).length;

  function startEdit() {
    setEditingId(task.id);
    setEditText(task.text);
    setEditDue(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setEditPriority(task.priority ?? "");
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateTask(
        task.id,
        editText,
        (editPriority as Priority) || null,
        editDue || null
      );
      setEditingId(null);
    });
  }

  function handleAddSub(e: React.FormEvent) {
    e.preventDefault();
    if (!subText.trim()) return;
    startTransition(async () => {
      await createSubTask(task.id, subText);
      setSubText("");
      setShowAddSub(false);
    });
  }

  if (editingId) {
    return (
      <form
        onSubmit={handleEditSave}
        className="rounded-xl bg-black/40 p-3 ring-1 ring-white/15 space-y-2"
      >
        <input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full rounded-lg bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
          autoFocus
        />
        <div className="flex gap-2">
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as Priority | "")}
            className="rounded-lg bg-black/40 px-2 py-1.5 text-xs text-zinc-300 ring-1 ring-white/20 outline-none"
          >
            <option value="">No priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <input
            type="date"
            value={editDue}
            onChange={(e) => setEditDue(e.target.value)}
            className="rounded-lg bg-black/40 px-2 py-1.5 text-xs text-zinc-400 ring-1 ring-white/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-white/15 px-3 py-1 text-xs hover:bg-white/20"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="rounded-lg bg-black/30 px-3 py-1 text-xs text-zinc-400 hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`group rounded-xl p-3 ring-1 ring-white/10 transition-opacity ${task.done ? "bg-black/20 opacity-60" : "bg-black/30"} ${isPending ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => startTransition(() => toggleTask(task.id))}
          className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border transition-colors ${
            task.done
              ? "border-emerald-300 bg-emerald-400/80"
              : "border-white/25 hover:border-white/50"
          }`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm ${
                task.done ? "text-zinc-500 line-through" : "text-zinc-200"
              }`}
            >
              {task.text}
            </span>

            {task.priority && !task.done && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${PRIORITY_BADGE[task.priority]}`}
              >
                {task.priority}
              </span>
            )}
          </div>

          {task.done && task.completedAt && (
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Completed {formatDate(task.completedAt)}
            </p>
          )}
          {!task.done && task.dueDate && (
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Due {formatDate(task.dueDate)}
            </p>
          )}

          {hasSubtasks && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <span>{expanded ? "▾" : "▸"}</span>
              {doneSubCount}/{task.subtasks.length} subtasks
            </button>
          )}

          {expanded && (
            <div className="mt-2 space-y-1.5 pl-1">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group/sub">
                  <button
                    onClick={() => startTransition(() => toggleSubTask(sub.id))}
                    className={`h-4 w-4 flex-shrink-0 rounded border transition-colors ${
                      sub.done
                        ? "border-emerald-300 bg-emerald-400/80"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  />
                  <span
                    className={`flex-1 text-xs ${
                      sub.done ? "text-zinc-500 line-through" : "text-zinc-300"
                    }`}
                  >
                    {sub.text}
                  </span>
                  <button
                    onClick={() => startTransition(() => deleteSubTask(sub.id))}
                    className="opacity-0 group-hover/sub:opacity-100 rounded px-1 py-0.5 text-[10px] text-zinc-500 hover:text-rose-400 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {showAddSub ? (
                <form onSubmit={handleAddSub} className="flex gap-2">
                  <input
                    value={subText}
                    onChange={(e) => setSubText(e.target.value)}
                    placeholder="Subtask…"
                    className="flex-1 rounded-lg bg-black/40 px-2 py-1 text-xs outline-none ring-1 ring-white/20 focus:ring-white/40"
                    autoFocus
                    onKeyDown={(e) => e.key === "Escape" && setShowAddSub(false)}
                  />
                  <button type="submit" className="rounded-lg bg-white/15 px-2 py-1 text-xs">
                    Add
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddSub(true)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  + Add subtask
                </button>
              )}
            </div>
          )}

          {!expanded && !hasSubtasks && (
            <button
              onClick={() => { setExpanded(true); setShowAddSub(true); }}
              className="mt-1 text-[11px] text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              + Add subtask
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={startEdit}
            className="rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-white/10"
          >
            ✎
          </button>
          {deleteConfirm ? (
            <>
              <button
                onClick={() => startTransition(() => deleteTask(task.id))}
                className="rounded px-1.5 py-0.5 text-[10px] text-rose-300 hover:bg-rose-500/20"
              >
                Confirm
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded px-1.5 py-0.5 text-[10px] text-zinc-400"
              >
                ✕
              </button>
            </>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskGroup({
  project,
  tasks,
  allProjects,
}: {
  project: Project;
  tasks: Task[];
  allProjects: { id: string; key: string; name: string; color: string }[];
}) {
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState<Priority | "">("");
  const [newDue, setNewDue] = useState("");
  const [isPending, startTransition] = useTransition();

  const colorClass = project
    ? (PROJECT_COLOR_MAP[project.color] ?? "ring-white/10 text-zinc-100")
    : "ring-white/10 text-zinc-400";

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    startTransition(async () => {
      await createTask(
        newText,
        project?.id ?? null,
        (newPriority as Priority) || null,
        newDue || null
      );
      setNewText("");
      setNewPriority("");
      setNewDue("");
      setShowAdd(false);
    });
  }

  return (
    <div className={`rounded-2xl bg-white/5 ring-1 ${colorClass.split(" ")[0]} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-base font-semibold ${colorClass.split(" ")[1] ?? "text-zinc-100"}`}>
            {project ? project.name : "Personal"}
          </span>
          {project && (
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              {project.key}
            </span>
          )}
          <span className="text-xs text-zinc-500">
            {tasks.filter((t) => !t.done).length} open
          </span>
        </div>
        <span className="text-zinc-500">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="space-y-2 px-5 pb-5">
          {tasks.length === 0 && !showAdd && (
            <p className="text-sm text-zinc-500 italic py-2">No tasks.</p>
          )}

          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}

          {showAdd ? (
            <form onSubmit={handleAddTask} className="mt-2 space-y-2 rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
              <input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Task description…"
                className="w-full rounded-lg bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
                autoFocus
                onKeyDown={(e) => e.key === "Escape" && setShowAdd(false)}
              />
              <div className="flex gap-2">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority | "")}
                  className="rounded-lg bg-black/40 px-2 py-1.5 text-xs text-zinc-300 ring-1 ring-white/20 outline-none"
                >
                  <option value="">No priority</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="rounded-lg bg-black/40 px-2 py-1.5 text-xs text-zinc-400 ring-1 ring-white/20 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-white/15 px-4 py-1.5 text-xs hover:bg-white/20 disabled:opacity-50"
                >
                  {isPending ? "Adding…" : "Add task"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-xl bg-black/30 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-1 w-full rounded-xl py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors text-left px-2"
            >
              + Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
}
