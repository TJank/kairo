"use client";

import { useTheme } from "@/app/theme/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
      title="Toggle light/dark"
    >
      {theme === "dark" ? "Light" : "Dark"} mode
    </button>
  );
}
