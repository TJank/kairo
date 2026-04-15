"use client";

import { useEffect, useState } from "react";

type CountdownConfig = {
  targetDate: string; // ISO date string "YYYY-MM-DD"
  label?: string;
};

function parseConfig(configStr: string | null): CountdownConfig | null {
  if (!configStr) return null;
  try {
    return JSON.parse(configStr);
  } catch {
    return null;
  }
}

function getDaysUntil(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate + "T00:00:00");
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CountdownWidget({ config }: { config: string | null }) {
  const parsed = parseConfig(config);
  const [daysLeft, setDaysLeft] = useState(() =>
    parsed ? getDaysUntil(parsed.targetDate) : 0
  );

  useEffect(() => {
    if (!parsed) return;
    const interval = setInterval(() => {
      setDaysLeft(getDaysUntil(parsed.targetDate));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [parsed]);

  if (!parsed) {
    return (
      <p className="text-sm text-zinc-500 italic">
        No target date configured.
      </p>
    );
  }

  const isPast = daysLeft < 0;
  const isToday = daysLeft === 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold ${
            isToday
              ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
              : isPast
              ? "bg-zinc-700/30 text-zinc-500 ring-1 ring-zinc-600/30"
              : "bg-white/10 text-white ring-1 ring-white/20"
          }`}
        >
          {isToday ? "!" : Math.abs(daysLeft)}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-200">
          {parsed.label || "Countdown"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {isToday
            ? "Today is the day!"
            : isPast
            ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} ago`
            : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-600">
          {new Date(parsed.targetDate + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
