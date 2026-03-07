"use client";

import { useState, useTransition } from "react";
import {
  cancelRecurringOccurrence,
  deleteEvent,
  deleteRecurringEvent,
} from "@/app/actions/calendar";
import EditEventModal from "./EditEventModal";

export type PopoverEntry = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  recurring?: boolean;
  projectKey?: string;
  projectLabel?: string;
  projectColor?: string;
};

type Project = { id: string; key: string; name: string; color: string };

export default function EventPopover({
  entry,
  x,
  y,
  projects,
  onDismiss,
  onRefresh,
}: {
  entry: PopoverEntry;
  x: number;
  y: number;
  projects: Project[];
  onDismiss: () => void;
  onRefresh: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isRecurring = !!entry.recurring;
  const [recurringEventId] = entry.id.split(/:(.+)/);

  function handleCancelOccurrence() {
    startTransition(async () => {
      await cancelRecurringOccurrence(recurringEventId, new Date(entry.startAt));
      onDismiss();
      onRefresh();
    });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => {
      if (isRecurring) {
        await deleteRecurringEvent(recurringEventId);
      } else {
        await deleteEvent(entry.id);
      }
      onDismiss();
      onRefresh();
    });
  }

  if (showEdit) {
    return (
      <EditEventModal
        entry={entry}
        projects={projects}
        onClose={() => { setShowEdit(false); onDismiss(); }}
        onSaved={() => { setShowEdit(false); onDismiss(); onRefresh(); }}
      />
    );
  }

  // Clamp to viewport
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const W = 288;
  const estimatedH = isRecurring ? 200 : 160;
  const left = Math.min(x + 8, vw - W - 12);
  const top = Math.min(y + 8, vh - estimatedH - 12);

  return (
    <div className="fixed inset-0 z-50" onClick={onDismiss}>
      <div
        className="absolute w-72 rounded-2xl bg-zinc-900 p-4 ring-1 ring-white/20 shadow-2xl"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Info */}
        <div className="mb-3 border-b border-white/8 pb-3">
          <p className="text-sm font-semibold text-zinc-100 truncate">{entry.title}</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {new Date(entry.startAt).toLocaleString(undefined, {
              weekday: "short", month: "short", day: "numeric",
              hour: "numeric", minute: "2-digit",
            })}
            {" – "}
            {new Date(entry.endAt).toLocaleTimeString(undefined, {
              hour: "numeric", minute: "2-digit",
            })}
          </p>
          {isRecurring && (
            <p className="mt-0.5 text-[10px] text-zinc-500">Recurring series</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-1.5">
          <button
            className="flex w-full items-center gap-2 rounded-xl bg-white/6 px-3 py-2 text-left text-xs font-medium text-zinc-200 ring-1 ring-white/10 hover:bg-white/10 transition-colors"
            onClick={() => setShowEdit(true)}
          >
            <span className="text-zinc-400">✎</span>
            Edit {isRecurring ? "series" : "event"}
          </button>

          {isRecurring && (
            <button
              disabled={isPending}
              className="flex w-full items-center gap-2 rounded-xl bg-white/6 px-3 py-2 text-left text-xs font-medium text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 transition-colors disabled:opacity-40"
              onClick={handleCancelOccurrence}
            >
              <span>✕</span>
              Cancel this occurrence
            </button>
          )}

          <button
            disabled={isPending}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium ring-1 transition-colors disabled:opacity-40 ${
              confirmDelete
                ? "bg-red-500/30 text-red-200 ring-red-500/40 hover:bg-red-500/40"
                : "bg-red-500/10 text-red-400 ring-red-500/20 hover:bg-red-500/20"
            }`}
            onClick={handleDelete}
          >
            <span>🗑</span>
            {confirmDelete
              ? `Confirm — delete ${isRecurring ? "entire series" : "event"}`
              : `Delete ${isRecurring ? "entire series" : "event"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
