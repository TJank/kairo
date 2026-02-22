"use client";

import { useState, useTransition, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createItem,
  updateItem,
  deleteItem,
  toggleItem,
  updateSection,
  deleteSection,
  reorderItems,
} from "@/app/actions/whiteboard";

type SectionType = "QUOTES" | "GOALS" | "DREAMBOARD" | "NOTES";

type Item = {
  id: string;
  text: string;
  done: boolean;
  completedAt: string | null;
  dueDate: string | null;
  order: number;
};

type Section = {
  id: string;
  title: string;
  type: SectionType;
  color: string | null;
  order: number;
  fullWidth: boolean;
  items: Item[];
};

const COLOR_STYLES: Record<string, { ring: string; accent: string; check: string }> = {
  blue: {
    ring: "ring-blue-500/30",
    accent: "text-blue-300",
    check: "border-blue-400 bg-blue-400/80",
  },
  emerald: {
    ring: "ring-emerald-500/30",
    accent: "text-emerald-300",
    check: "border-emerald-400 bg-emerald-400/80",
  },
  rose: {
    ring: "ring-rose-500/30",
    accent: "text-rose-300",
    check: "border-rose-400 bg-rose-400/80",
  },
  amber: {
    ring: "ring-amber-500/30",
    accent: "text-amber-300",
    check: "border-amber-400 bg-amber-400/80",
  },
  purple: {
    ring: "ring-purple-500/30",
    accent: "text-purple-300",
    check: "border-purple-400 bg-purple-400/80",
  },
  orange: {
    ring: "ring-orange-500/30",
    accent: "text-orange-300",
    check: "border-orange-400 bg-orange-400/80",
  },
};

function getColorStyle(color: string | null) {
  if (color && COLOR_STYLES[color]) return COLOR_STYLES[color];
  return {
    ring: "ring-white/10",
    accent: "text-zinc-100",
    check: "border-emerald-300 bg-emerald-400/80",
  };
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const hasCheckbox = (type: SectionType) =>
  type === "GOALS" || type === "DREAMBOARD";
const hasDueDate = (type: SectionType) => type === "GOALS";

// Sortable item wrapper
function SortableItem({
  item,
  children,
}: {
  item: Item;
  children: (dragHandleProps: React.HTMLAttributes<HTMLDivElement>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

export default function SectionCard({ section }: { section: Section }) {
  const cs = getColorStyle(section.color);
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(section.items);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(section.title);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleToggle(itemId: string) {
    startTransition(() => toggleItem(itemId));
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    startTransition(async () => {
      await createItem(section.id, newText, newDueDate || undefined);
      setNewText("");
      setNewDueDate("");
      setShowAdd(false);
    });
  }

  function startEdit(item: Item) {
    setEditingItemId(item.id);
    setEditText(item.text);
    setEditDueDate(
      item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : ""
    );
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItemId || !editText.trim()) return;
    startTransition(async () => {
      await updateItem(editingItemId, editText, editDueDate || null);
      setEditingItemId(null);
    });
  }

  function handleDeleteItem(itemId: string) {
    if (deleteConfirmId !== itemId) {
      setDeleteConfirmId(itemId);
      return;
    }
    startTransition(async () => {
      await deleteItem(itemId);
      setDeleteConfirmId(null);
    });
  }

  function handleTitleSave() {
    if (!titleVal.trim() || titleVal === section.title) {
      setEditingTitle(false);
      setTitleVal(section.title);
      return;
    }
    startTransition(async () => {
      await updateSection(section.id, titleVal);
      setEditingTitle(false);
    });
  }

  function handleDeleteSection() {
    if (!confirm(`Delete "${section.title}" and all its items?`)) return;
    startTransition(() => deleteSection(section.id));
  }

  function handleToggleFullWidth() {
    startTransition(async () => {
      await updateSection(section.id, undefined, undefined, !section.fullWidth);
    });
  }

  function handleItemDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    reorderItems(reordered.map((i) => i.id));
  }

  const isQuotes = section.type === "QUOTES";
  const isDreamboard = section.type === "DREAMBOARD";

  return (
    <div
      className={`rounded-3xl p-5 ring-1 ${cs.ring} ${
        isDreamboard ? "bg-purple-950/20" : "bg-white/5"
      } ${isPending ? "opacity-70 transition-opacity" : ""}`}
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        {editingTitle ? (
          <input
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") {
                setEditingTitle(false);
                setTitleVal(section.title);
              }
            }}
            className="flex-1 rounded-lg bg-black/40 px-2 py-1 text-lg font-semibold outline-none ring-1 ring-white/20 focus:ring-white/40"
            autoFocus
          />
        ) : (
          <h2
            className={`flex-1 text-lg font-semibold tracking-tight ${cs.accent} cursor-pointer`}
            onDoubleClick={() => setEditingTitle(true)}
            title="Double-click to edit title"
          >
            {isQuotes ? "❝ " : ""}
            {section.title}
          </h2>
        )}

        {!editingTitle && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100">
            <button
              onClick={() => {
                setShowAdd(true);
                setTimeout(() => newInputRef.current?.focus(), 50);
              }}
              className="rounded-lg bg-white/8 px-2 py-1 text-xs hover:bg-white/15 transition-colors"
              title="Add item"
            >
              +
            </button>
            {!isQuotes && (
              <button
                onClick={handleToggleFullWidth}
                className="rounded-lg bg-white/8 px-2 py-1 text-[10px] text-zinc-400 hover:bg-white/15 transition-colors"
                title={section.fullWidth ? "Switch to half-width" : "Switch to full-width"}
              >
                {section.fullWidth ? "⇔½" : "⇔"}
              </button>
            )}
            <button
              onClick={() => setEditingTitle(true)}
              className="rounded-lg bg-white/8 px-2 py-1 text-[10px] text-zinc-400 hover:bg-white/15 transition-colors"
              title="Edit title"
            >
              ✎
            </button>
            <button
              onClick={handleDeleteSection}
              className="rounded-lg bg-rose-500/10 px-2 py-1 text-[10px] text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Delete section"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      <div className={`mt-4 space-y-2 ${isQuotes ? "space-y-3" : ""}`}>
        {items.length === 0 && !showAdd && (
          <p className="text-sm text-zinc-500 italic">No items yet.</p>
        )}

        <DndContext
          id={`items-dnd-${section.id}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleItemDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <div key={item.id}>
                {editingItemId === item.id ? (
                  /* Inline edit form — not sortable while editing */
                  <form onSubmit={handleEditSubmit} className="space-y-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full rounded-lg bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
                      autoFocus
                    />
                    {hasDueDate(section.type) && (
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-full rounded-lg bg-black/40 px-2 py-1.5 text-sm text-zinc-400 outline-none ring-1 ring-white/20 focus:ring-white/40"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-white/15 px-3 py-1 text-xs hover:bg-white/20 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className="rounded-lg bg-black/30 px-3 py-1 text-xs text-zinc-400 hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <SortableItem item={item}>
                    {(dragHandleProps) => (
                      <div className="group flex items-start gap-2.5">
                        {/* Drag handle */}
                        <div
                          {...dragHandleProps}
                          className="mt-1 flex-shrink-0 cursor-grab text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing select-none px-0.5"
                          title="Drag to reorder"
                        >
                          ⠿
                        </div>

                        {hasCheckbox(section.type) && (
                          <button
                            onClick={() => handleToggle(item.id)}
                            className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border transition-colors ${
                              item.done
                                ? cs.check
                                : "border-white/25 bg-transparent hover:border-white/50"
                            }`}
                            title={item.done ? "Mark incomplete" : "Mark complete"}
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          {isQuotes ? (
                            <p className="text-sm italic text-zinc-300 leading-relaxed">
                              "{item.text}"
                            </p>
                          ) : (
                            <p
                              className={`text-sm leading-relaxed ${
                                item.done ? "text-zinc-500 line-through" : "text-zinc-200"
                              }`}
                            >
                              {item.text}
                            </p>
                          )}

                          {item.done && item.completedAt && (
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                              Completed {formatDate(item.completedAt)}
                            </p>
                          )}
                          {!item.done && item.dueDate && (
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                              Due {formatDate(item.dueDate)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 flex-shrink-0">
                          <button
                            onClick={() => startEdit(item)}
                            className="rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-white/10 transition-colors"
                          >
                            ✎
                          </button>
                          {deleteConfirmId === item.id ? (
                            <>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="rounded px-1.5 py-0.5 text-[10px] text-rose-300 hover:bg-rose-500/20 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-white/10 transition-colors"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </SortableItem>
                )}
              </div>
            ))}
          </SortableContext>
        </DndContext>

        {/* Add item inline form */}
        {showAdd ? (
          <form onSubmit={handleAddItem} className="mt-2 space-y-2">
            <input
              ref={newInputRef}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={isQuotes ? "Enter a quote…" : "Enter item…"}
              className="w-full rounded-lg bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/20 focus:ring-white/40"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowAdd(false);
                  setNewText("");
                  setNewDueDate("");
                }
              }}
            />
            {hasDueDate(section.type) && (
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full rounded-lg bg-black/40 px-2 py-1.5 text-sm text-zinc-400 outline-none ring-1 ring-white/20 focus:ring-white/40"
              />
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-white/15 px-3 py-1 text-xs hover:bg-white/20 transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setNewText(""); setNewDueDate(""); }}
                className="rounded-lg bg-black/30 px-3 py-1 text-xs text-zinc-400 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => {
              setShowAdd(true);
              setTimeout(() => newInputRef.current?.focus(), 50);
            }}
            className="mt-2 w-full rounded-lg py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors text-left px-1"
          >
            + Add item
          </button>
        )}
      </div>
    </div>
  );
}
