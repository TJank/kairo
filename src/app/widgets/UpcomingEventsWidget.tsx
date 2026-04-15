"use client";

type Event = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  projectKey?: string;
  projectLabel?: string;
  projectColor?: string;
};

const PROJECT_COLOR_DOT: Record<string, string> = {
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function UpcomingEventsWidget({ events }: { events: Event[] }) {
  const now = new Date();
  const upcoming = events
    .filter((e) => !e.allDay && new Date(e.endAt) > now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  const allDayEvents = events.filter((e) => e.allDay);

  if (upcoming.length === 0 && allDayEvents.length === 0) {
    return (
      <p className="text-sm text-zinc-500 italic">No events today.</p>
    );
  }

  return (
    <div className="space-y-2">
      {allDayEvents.length > 0 && (
        <div className="space-y-1.5">
          {allDayEvents.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2"
            >
              {e.projectColor && (
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${PROJECT_COLOR_DOT[e.projectColor] ?? "bg-zinc-500"}`} />
              )}
              <span className="text-sm text-zinc-200">
                {e.projectKey ? `${e.projectKey}: ` : ""}{e.title}
              </span>
              <span className="ml-auto text-[10px] text-zinc-500">All day</span>
            </div>
          ))}
        </div>
      )}

      {upcoming.map((e) => {
        const isNow = new Date(e.startAt) <= now && new Date(e.endAt) > now;
        return (
          <div
            key={e.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              isNow ? "bg-white/10 ring-1 ring-white/20" : "bg-black/20"
            }`}
          >
            {e.projectColor && (
              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${PROJECT_COLOR_DOT[e.projectColor] ?? "bg-zinc-500"}`} />
            )}
            <span className={`text-sm ${isNow ? "text-white font-medium" : "text-zinc-200"}`}>
              {e.projectKey ? `${e.projectKey}: ` : ""}{e.title}
            </span>
            <span className="ml-auto text-[11px] text-zinc-500">
              {formatTime(e.startAt)} – {formatTime(e.endAt)}
              {isNow && <span className="ml-1.5 text-emerald-400">now</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
