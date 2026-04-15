"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "midnight" | "nord" | "solarized" | "forest" | "dusk" | "light";

const ALL_THEMES: Theme[] = ["midnight", "nord", "solarized", "forest", "dusk", "light"];

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("midnight");

  useEffect(() => {
    const saved = window.localStorage.getItem("kairo-theme") as Theme | null;
    if (saved && (ALL_THEMES as string[]).includes(saved)) setTheme(saved as Theme);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    ALL_THEMES.forEach((t) => html.classList.remove(`theme-${t}`));
    html.classList.add(`theme-${theme}`);
    html.classList.toggle("dark", theme !== "light");
    window.localStorage.setItem("kairo-theme", theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}
