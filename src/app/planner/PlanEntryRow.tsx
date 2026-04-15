"use client";

import { useState } from "react";
import { Check, Circle, X, MinusCircle, Trash2, Pencil, Clock } from "lucide-react";
import type { SerializedPlanEntry } from "@/lib/plannerData";
import {
  formatMin,
  formatDuration,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  ALL_CATEGORIES,
} from "@/lib/planParser";
import type { PlanEntryCategory, PlanEntryStatus } from "@prisma/client";

const STATUS_ICONS: Record<PlanEntryStatus, { icon: React.ReactNode; classes: string }> = {
  PLANNED: {
    icon: <Circle size={18} />,
    classes: "text-zinc-500 hover:text-zinc-300",
  },
  COMPLETED: {
    icon: <Check size={18} />,
    classes: "text-emerald-400",
  },
  SKIPPED: {
    icon: <MinusCircle size={18} />,
    classes: "text-amber-400",
  },
  CANCELLED: {
    icon: <X size={18} />,
    classes: "text-red-400",
  },
};

export default function PlanEntryRow({
  entry,
  onStatusCycle,
  onStatusSet,
  onDelete,
  onUpdate,
  onActualTime,
}: {
  entry: SerializedPlanEntry;
  onStatusCycle: (id: string, current: PlanEntryStatus) => void;
  onStatusSet: (id: string, status: PlanEntryStatus) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, startMin: number, endMin: number, category: PlanEntryCategory, description?: string) => void;
  onActualTime: (id: string, actualStartMin: number, actualEndMin: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editCategory, setEditCategory] = useState<PlanEntryCategory>(entry.category);
  const [editStartH, setEditStartH] = useState(Math.floor(entry.startMin / 60).toString());
  const [editStartM, setEditStartM] = useState((entry.startMin % 60).toString().padStart(2, "0"));
  const [editEndH, setEditEndH] = useState(Math.floor(entry.endMin / 60).toString());
  const [editEndM, setEditEndM] = useState((entry.endMin % 60).toString().padStart(2, "0"));

  const [showActualTime, setShowActualTime] = useState(false);
  const [actualStartH, setActualStartH] = useState(
    entry.actualStartMin !== null ? Math.floor(entry.actualStartMin / 60).toString() : Math.floor(entry.startMin / 60).toString(),
  );
  const [actualStartM, setActualStartM] = useState(
    entry.actualStartMin !== null ? (entry.actualStartMin % 60).toString().padStart(2, "0") : (entry.startMin % 60).toString().padStart(2, "0"),
  );
  const [actualEndH, setActualEndH] = useState(
    entry.actualEndMin !== null ? Math.floor(entry.actualEndMin / 60).toString() : Math.floor(entry.endMin / 60).toString(),
  );
  const [actualEndM, setActualEndM] = useState(
    entry.actualEndMin !== null ? (entry.actualEndMin % 60).toString().padStart(2, "0") : (entry.endMin % 60).toString().padStart(2, "0"),
  );

  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusInfo = STATUS_ICONS[entry.status];
  const isStrikethrough = entry.status === "SKIPPED" || entry.status === "CANCELLED";
  const isDimmed = entry.status === "CANCELLED";
  const duration = formatDuration(entry.startMin, entry.endMin);

  function handleEditSave() {
    const startMin = parseInt(editStartH) * 60 + parseInt(editStartM);
    const endMin = parseInt(editEndH) * 60 + parseInt(editEndM);
    onUpdate(entry.id, editTitle, startMin, endMin, editCategory);
    setIsEditing(false);
  }

  function handleActualTimeSave() {
    const startMin = parseInt(actualStartH) * 60 + parseInt(actualStartM);
    const endMin = parseInt(actualEndH) * 60 + parseInt(actualEndM);
    onActualTime(entry.id, startMin, endMin);
    setShowActualTime(false);
  }

  if (isEditing) {
    return (
      <div className="rounded-xl bg-black/40 px-4 py-3 ring-1 ring-white/15 space-y-3">
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/25"
          autoFocus
        />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Start:</span>
          <input type="number" min="0" max="23" value={editStartH} onChange={(e) => setEditStartH(e.target.value)} className="w-12 rounded bg-black/30 px-2 py-1 text-center ring-1 ring-white/10 outline-none" />
          <span className="text-zinc-600">:</span>
          <input type="number" min="0" max="59" step="5" value={editStartM} onChange={(e) => setEditStartM(e.target.value)} className="w-12 rounded bg-black/30 px-2 py-1 text-center ring-1 ring-white/10 outline-none" />
          <span className="text-zinc-500 ml-3">End:</span>
          <input type="number" min="0" max="23" value={editEndH} onChange={(e) => setEditEndH(e.target.value)} className="w-12 rounded bg-black/30 px-2 py-1 text-center ring-1 ring-white/10 outline-none" />
          <span className="text-zinc-600">:</span>
          <input type="number" min="0" max="59" step="5" value={editEndM} onChange={(e) => setEditEndM(e.target.value)} className="w-12 rounded bg-black/30 px-2 py-1 text-center ring-1 ring-white/10 outline-none" />
        </div>
        <select
          value={editCategory}
          onChange={(e) => setEditCategory(e.target.value as PlanEntryCategory)}
          className="rounded-lg bg-black/40 px-2 py-1.5 text-xs text-zinc-400 ring-1 ring-white/10 outline-none"
        >
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={handleEditSave} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors">Save</button>
          <button onClick={() => setIsEditing(false)} className="rounded-lg bg-black/30 px-3 py-1.5 text-xs text-zinc-400 ring-1 ring-white/10 hover:bg-white/8 transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  const isSkipped = entry.status === "SKIPPED";

  function handleCheckClick() {
    // Toggle between PLANNED ↔ COMPLETED
    if (entry.status === "COMPLETED") {
      onStatusSet(entry.id, "PLANNED");
    } else {
      onStatusSet(entry.id, "COMPLETED");
    }
  }

  function handleSkipClick() {
    // Toggle between current ↔ SKIPPED
    if (isSkipped) {
      onStatusSet(entry.id, "PLANNED");
    } else {
      onStatusSet(entry.id, "SKIPPED");
    }
  }

  return (
    <div className={`group flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-white/6 hover:ring-white/12 transition-all ${isDimmed ? "opacity-40" : ""} ${entry.status === "COMPLETED" ? "bg-emerald-500/5" : isSkipped ? "bg-amber-500/5" : "bg-black/20"}`}>
      {/* Status buttons: check + skip */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Complete / check button */}
        <button
          onClick={handleCheckClick}
          title={entry.status === "COMPLETED" ? "Mark as planned" : "Mark as done"}
          className={`transition-colors ${statusInfo.classes}`}
        >
          {statusInfo.icon}
        </button>

        {/* Skip / miss button */}
        <button
          onClick={handleSkipClick}
          title={isSkipped ? "Un-skip" : "Mark as skipped / missed"}
          className={`transition-colors ${
            isSkipped
              ? "text-amber-400 hover:text-amber-300"
              : "text-zinc-600 hover:text-amber-400"
          }`}
        >
          <MinusCircle size={16} />
        </button>
      </div>

      {/* Time column */}
      <div className="w-20 flex-shrink-0">
        <span className="text-xs font-mono text-zinc-500">{formatMin(entry.startMin)}</span>
        {duration && (
          <span className="ml-1 text-[10px] text-zinc-600">{duration}</span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isStrikethrough ? "line-through text-zinc-500" : "text-zinc-200"}`}>
            {entry.title}
          </span>
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] ring-1 ${CATEGORY_COLORS[entry.category]}`}>
            {CATEGORY_LABELS[entry.category]}
          </span>
        </div>

        {entry.description && (
          <p className="mt-0.5 text-xs text-zinc-500">{entry.description}</p>
        )}

        {/* Actual time display */}
        {entry.actualStartMin !== null && entry.actualEndMin !== null && !showActualTime && (
          <p className="mt-1 text-[11px] text-zinc-500">
            Actual: {formatMin(entry.actualStartMin)} – {formatMin(entry.actualEndMin)}
          </p>
        )}

        {/* Actual time editor */}
        {showActualTime && (
          <div className="mt-2 rounded-xl bg-black/40 px-4 py-3 ring-1 ring-white/10">
            <p className="mb-2 text-[11px] font-medium text-zinc-400">Set actual time</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={actualStartH}
                  onChange={(e) => setActualStartH(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-10 rounded-lg bg-black/50 px-2 py-1.5 text-center text-xs text-zinc-200 outline-none ring-1 ring-white/15 focus:ring-white/30 transition-colors"
                />
                <span className="text-zinc-600 text-xs">:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={actualStartM}
                  onChange={(e) => setActualStartM(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-10 rounded-lg bg-black/50 px-2 py-1.5 text-center text-xs text-zinc-200 outline-none ring-1 ring-white/15 focus:ring-white/30 transition-colors"
                />
              </div>

              <span className="text-zinc-600 text-xs">–</span>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={actualEndH}
                  onChange={(e) => setActualEndH(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-10 rounded-lg bg-black/50 px-2 py-1.5 text-center text-xs text-zinc-200 outline-none ring-1 ring-white/15 focus:ring-white/30 transition-colors"
                />
                <span className="text-zinc-600 text-xs">:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={actualEndM}
                  onChange={(e) => setActualEndM(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-10 rounded-lg bg-black/50 px-2 py-1.5 text-center text-xs text-zinc-200 outline-none ring-1 ring-white/15 focus:ring-white/30 transition-colors"
                />
              </div>

              <button
                onClick={handleActualTimeSave}
                className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/20 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowActualTime(false)}
                className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/8 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowActualTime(!showActualTime)}
          title="Set actual time"
          className="rounded p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/8 transition-colors"
        >
          <Clock size={14} />
        </button>
        <button
          onClick={() => setIsEditing(true)}
          title="Edit"
          className="rounded p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/8 transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => {
            if (confirmDelete) {
              onDelete(entry.id);
            } else {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 3000);
            }
          }}
          title={confirmDelete ? "Click again to confirm" : "Delete"}
          className={`rounded p-1 transition-colors ${
            confirmDelete
              ? "text-red-400 bg-red-400/10"
              : "text-zinc-600 hover:text-red-400 hover:bg-white/8"
          }`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
