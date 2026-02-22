"use client";

import { useState, useCallback } from "react";
import WeekGrid from "./WeekGrid";
import DayGrid from "./DayGrid";
import MonthGrid from "./MonthGrid";
import ManageCategoriesModal from "./ManageCategoriesModal";
import IngestInput from "./IngestInput";

type Project = { id: string; key: string; name: string; color: string };
type View = "week" | "day" | "month";

export default function CalendarClient({ projects }: { projects: Project[] }) {
  const [showManage, setShowManage] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<View>("week");
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  function handleDayClick(d: Date) {
    setSelectedDay(d);
    setView("day");
  }

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {view === "week" ? "Sun – Sat week view." : view === "day" ? "Single day view." : "Monthly overview."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View tabs */}
          <div className="flex rounded-xl ring-1 ring-white/10 overflow-hidden">
            {(["week", "day", "month"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  view === v
                    ? "bg-white/15 text-white"
                    : "bg-transparent text-zinc-400 hover:bg-white/8 hover:text-zinc-200"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowManage(true)}
            className="rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-colors"
          >
            Manage Categories
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <IngestInput onRefresh={handleRefresh} />
        {view === "week" && (
          <WeekGrid
            key={refreshKey}
            projects={projects}
            onRefresh={handleRefresh}
            onDayClick={handleDayClick}
          />
        )}
        {view === "day" && (
          <DayGrid
            key={`day-${refreshKey}`}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            projects={projects}
            onRefresh={handleRefresh}
          />
        )}
        {view === "month" && (
          <MonthGrid
            key={`month-${refreshKey}`}
            onDayClick={handleDayClick}
          />
        )}
      </div>

      {showManage && (
        <ManageCategoriesModal
          projects={projects}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  );
}
