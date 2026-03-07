"use client";

import { useState, useTransition } from "react";
import { createTaskSection, updateTaskSection, deleteTaskSection } from "@/app/actions/tasks";
import { COLOR_OPTIONS, COLOR_SWATCH } from "@/app/calendar/colors";

type Project = { id: string; key: string; name: string; color: string };

export default function ManageTaskSectionsModal({
  projects,
  onClose,
}: {
  projects: Project[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function startEdit(p: Project) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditColor(p.color);
  }

  function handleEditSave() {
    if (!editingId) return;
    startTransition(async () => {
      await updateTaskSection(editingId, editName, editColor);
      setEditingId(null);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createTaskSection(newKey, newName, newColor);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setNewKey("");
      setNewName("");
      setNewColor("blue");
    });
  }

  function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    startTransition(async () => {
      await deleteTaskSection(id);
      setDeleteConfirm(null);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 p-6 ring-1 ring-white/10 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Manage Task Sections</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Existing sections */}
        <div className="mt-5 space-y-2">
          {projects.length === 0 && (
            <p className="text-sm text-zinc-500 italic">No task sections yet.</p>
          )}
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
              {editingId === p.id ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setEditColor(c.value)}
                        title={c.value}
                        className={`h-6 w-6 rounded-full ${c.swatch} transition-all ${
                          editColor === c.value
                            ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900"
                            : "opacity-60"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSave}
                      disabled={isPending}
                      className="rounded-lg bg-white/15 px-3 py-1 text-xs hover:bg-white/20"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg bg-black/30 px-3 py-1 text-xs text-zinc-400 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 flex-shrink-0 rounded-full ${COLOR_SWATCH[p.color] ?? "bg-zinc-500"}`} />
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-zinc-400">{p.key}</span>
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-white/10"
                  >
                    ✎
                  </button>
                  {deleteConfirm === p.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded px-1.5 py-0.5 text-[10px] text-rose-300 hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded px-1.5 py-0.5 text-[10px] text-zinc-400"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create new */}
        <div className="mt-5 rounded-xl bg-black/20 p-4 ring-1 ring-white/10">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Add new section</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                placeholder="KEY"
                maxLength={15}
                className="w-20 rounded-lg bg-black/40 px-2 py-1.5 text-sm font-mono outline-none ring-1 ring-white/20 focus:ring-white/40"
              />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Section name"
                className="flex-1 rounded-lg bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
              />
            </div>
            <div className="flex gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setNewColor(c.value)}
                  title={c.value}
                  className={`h-6 w-6 rounded-full ${c.swatch} transition-all ${
                    newColor === c.value
                      ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900"
                      : "opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-white/15 px-4 py-1.5 text-sm hover:bg-white/20 disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
