"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, type Theme } from "@/app/theme/ThemeProvider";

const THEMES: { id: Theme; label: string; description: string }[] = [
  { id: "midnight", label: "Midnight", description: "Near-black for deep focus & eye strain reduction" },
  { id: "nord", label: "Nord", description: "Arctic blue-gray; calming cool tones" },
  { id: "solarized", label: "Solarized", description: "Scientifically designed to reduce eye fatigue" },
  { id: "forest", label: "Forest", description: "Earthy greens; supports sustained attention" },
  { id: "dusk", label: "Dusk", description: "Deep purple; suited for evening low-light work" },
  { id: "light", label: "Light", description: "Clean slate-white for bright environments" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
      >
        Theme: {current.label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M6 8L1 3h10L6 8z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              className={`flex w-full flex-col px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/8 ${
                t.id === theme ? "text-zinc-100" : "text-zinc-400"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                {t.id === theme && (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-100" />
                )}
                {t.id !== theme && <span className="h-1.5 w-1.5" />}
                {t.label}
              </span>
              <span className="ml-3.5 text-xs text-zinc-500">{t.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
