"use client";

import { useState } from "react";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SectionCard from "./SectionCard";
import AddSectionModal from "./AddSectionModal";
import { reorderSections } from "@/app/actions/whiteboard";

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

export default function WhiteboardBoard({ sections: initialSections }: { sections: Section[] }) {
  const [showModal, setShowModal] = useState(false);
  const [sections, setSections] = useState(initialSections);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const quoteSections = sections.filter((s) => s.type === "QUOTES");
  const otherSections = sections.filter((s) => s.type !== "QUOTES");

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = otherSections.findIndex((s) => s.id === active.id);
    const newIndex = otherSections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedOther = arrayMove(otherSections, oldIndex, newIndex);
    const nextSections = [...quoteSections, ...reorderedOther];
    setSections(nextSections);
    reorderSections(nextSections.map((s) => s.id));
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Whiteboard</h1>
          <p className="mt-1 text-sm text-zinc-400">Your command center.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-colors"
        >
          + Add Section
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="mt-20 flex flex-col items-center gap-4 text-center">
          <p className="text-zinc-500">No sections yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/15 transition-colors"
          >
            + Add your first section
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {/* Quotes sections — always full width, not draggable */}
          {quoteSections.map((section) => (
            <div key={section.id}>
              <SectionCard section={section} />
            </div>
          ))}

          {/* Other sections — draggable, 2-col grid with fullWidth toggle */}
          {otherSections.length > 0 && (
            <DndContext
              id="sections-dnd"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={otherSections.map((s) => s.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-4">
                  {otherSections.map((section) => (
                    <div
                      key={section.id}
                      className={section.fullWidth ? "col-span-2" : ""}
                    >
                      <SectionCard section={section} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {showModal && <AddSectionModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
