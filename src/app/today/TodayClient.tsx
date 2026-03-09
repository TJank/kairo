"use client";

import { useState, useTransition } from "react";
import { toggleTask } from "@/app/actions/tasks";

type Event = {
  id: string;
  title: string;
  notes?: string | null;
  startAt: string;
  endAt: string;
  recurring?: boolean;
  projectKey?: string;
  projectLabel?: string;
  projectColor?: string;
};

type Task = {
  id: string;
  text: string;
  notes: string | null;
  done: boolean;
  priority: string | null;
  dueAt: string | null;
  dueDate: string | null;
  project: { id: string; key: string; name: string; color: string } | null;
};

const PROJECT_COLOR_CHIP: Record<string, string> = {
  blue:   "bg-blue-500",
  purple: "bg-purple-500",
  green:  "bg-emerald-500",
  red:    "bg-red-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  pink:   "bg-pink-500",
  teal:   "bg-teal-500",
  indigo: "bg-indigo-500",
  rose:   "bg-rose-500",
  lime:   "bg-lime-500",
  cyan:   "bg-cyan-500",
};

const PRIORITY_DOT: Record<string, string> = {
  HIGH:   "bg-rose-400",
  MEDIUM: "bg-amber-400",
  LOW:    "bg-zinc-500",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDuration(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function EventChip({ event }: { event: Event }) {
  const colorClass = event.projectColor
    ? (PROJECT_COLOR_CHIP[event.projectColor] ?? "bg-zinc-600")
    : "bg-zinc-600";

  return (
    <div className="flex items-start gap-3 rounded-xl bg-black/30 px-4 py-3 ring-1 ring-white/10">
      <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${colorClass}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-200">{event.title}</span>
          {event.projectLabel && (
            <span className="text-[10px] text-zinc-500">{event.projectLabel}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {formatTime(event.startAt)} – {formatTime(event.endAt)}
          <span className="ml-2 text-zinc-600">{formatDuration(event.startAt, event.endAt)}</span>
        </p>
        {event.notes && (
          <p className="mt-1 text-xs text-zinc-500 whitespace-pre-wrap">{event.notes}</p>
        )}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();

  const colorClass = task.project?.color
    ? (PROJECT_COLOR_CHIP[task.project.color] ?? "bg-zinc-600")
    : null;

  return (
    <div className={`flex items-start gap-3 rounded-xl bg-black/20 px-4 py-3 ring-1 ring-white/8 transition-opacity ${isPending ? "opacity-50" : ""}`}>
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
          <span className={`text-sm ${task.done ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
            {task.text}
          </span>
          {task.priority && !task.done && (
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] ?? "bg-zinc-500"}`} />
          )}
          {task.project && colorClass && (
            <span className="text-[10px] text-zinc-500">{task.project.name}</span>
          )}
        </div>
        {task.dueAt && (
          <p className="mt-0.5 text-[11px] text-zinc-500">
            at {formatTime(task.dueAt)}
          </p>
        )}
        {task.notes && (
          <p className="mt-1 text-xs text-zinc-500 whitespace-pre-wrap">{task.notes}</p>
        )}
      </div>
    </div>
  );
}

export default function TodayClient({
  date,
  events,
  tasks,
}: {
  date: string;
  events: Event[];
  tasks: Task[];
}) {
  const today = new Date(date);
  const dayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  // Split events into past, happening now, and upcoming
  const pastEvents = events.filter((e) => new Date(e.endAt) <= now);
  const currentEvents = events.filter(
    (e) => new Date(e.startAt) <= now && new Date(e.endAt) > now
  );
  const upcomingEvents = events.filter((e) => new Date(e.startAt) > now);

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-zinc-400">{dayLabel}</p>
      </div>

      {/* Current events */}
      {currentEvents.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Happening now
          </h2>
          <div className="space-y-2">
            {currentEvents.map((e) => (
              <EventChip key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {/* Tasks due today */}
      {tasks.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Tasks today
          </h2>
          <div className="space-y-2">
            {tasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcomingEvents.map((e) => (
              <EventChip key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {/* Past events */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Earlier today
          </h2>
          <div className="space-y-2 opacity-50">
            {pastEvents.map((e) => (
              <EventChip key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && tasks.length === 0 && (
        <div className="mt-20 text-center">
          <p className="text-zinc-500">Nothing scheduled for today.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Add events on the Calendar or tasks with a due date to see them here.
          </p>
        </div>
      )}
    </div>
  );
}
