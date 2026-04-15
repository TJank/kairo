"use client";

import { useState, useTransition } from "react";
import { updateTimezone } from "@/app/actions/settings";

type Timezone = { label: string; value: string };

export default function SettingsClient({
  currentTz,
  timezones,
}: {
  currentTz: string;
  timezones: Timezone[];
}) {
  const [tz, setTz] = useState(currentTz);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateTimezone(tz);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold mb-1">Timezone</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Used for due dates, calendar events, and time display throughout Kairo.
        </p>
        <select
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className="rounded-xl bg-black/40 px-4 py-2.5 text-sm text-zinc-100 outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 w-full max-w-xs"
        >
          {timezones.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-xl bg-white/15 px-5 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400">Saved!</span>
        )}
      </div>
    </section>
  );
}
