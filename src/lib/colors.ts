// ─── Shared Color Palette ────────────────────────────────────────────────────
// Single source of truth for all color definitions across the app.

export type ColorValue =
  | "blue" | "purple" | "green" | "red" | "yellow" | "orange"
  | "pink" | "teal" | "indigo" | "rose" | "lime" | "cyan"
  | "emerald" | "amber";

// ─── Badge / pill classes (project tags, calendar events) ────────────────────

export function colorClasses(color?: string) {
  switch ((color || "").toLowerCase()) {
    case "blue":    return "bg-blue-400/10 text-blue-100 ring-blue-300/20";
    case "purple":  return "bg-purple-400/10 text-purple-100 ring-purple-300/20";
    case "green":   return "bg-emerald-400/10 text-emerald-100 ring-emerald-300/20";
    case "emerald": return "bg-emerald-400/10 text-emerald-100 ring-emerald-300/20";
    case "red":     return "bg-red-400/10 text-red-100 ring-red-300/20";
    case "yellow":  return "bg-yellow-400/10 text-yellow-100 ring-yellow-300/20";
    case "orange":  return "bg-orange-400/10 text-orange-100 ring-orange-300/20";
    case "amber":   return "bg-amber-400/10 text-amber-100 ring-amber-300/20";
    case "pink":    return "bg-pink-400/10 text-pink-100 ring-pink-300/20";
    case "teal":    return "bg-teal-400/10 text-teal-100 ring-teal-300/20";
    case "indigo":  return "bg-indigo-400/10 text-indigo-100 ring-indigo-300/20";
    case "rose":    return "bg-rose-400/10 text-rose-100 ring-rose-300/20";
    case "lime":    return "bg-lime-400/10 text-lime-100 ring-lime-300/20";
    case "cyan":    return "bg-cyan-400/10 text-cyan-100 ring-cyan-300/20";
    default:        return "bg-zinc-400/10 text-zinc-100 ring-zinc-300/20";
  }
}

// ─── Color picker options (project/category creation) ────────────────────────

export const COLOR_OPTIONS: { value: string; swatch: string }[] = [
  { value: "blue",   swatch: "bg-blue-500" },
  { value: "purple", swatch: "bg-purple-500" },
  { value: "green",  swatch: "bg-emerald-500" },
  { value: "red",    swatch: "bg-red-500" },
  { value: "yellow", swatch: "bg-yellow-500" },
  { value: "orange", swatch: "bg-orange-500" },
  { value: "pink",   swatch: "bg-pink-500" },
  { value: "teal",   swatch: "bg-teal-500" },
  { value: "indigo", swatch: "bg-indigo-500" },
  { value: "rose",   swatch: "bg-rose-500" },
  { value: "lime",   swatch: "bg-lime-500" },
  { value: "cyan",   swatch: "bg-cyan-500" },
];

export const COLOR_SWATCH: Record<string, string> = Object.fromEntries(
  COLOR_OPTIONS.map((c) => [c.value, c.swatch])
);

// ─── Section accent colors (whiteboard sections) ────────────────────────────
// Subset palette for section accents — includes zinc default

export const SECTION_COLOR_OPTIONS: { value: string | undefined; swatch: string; label: string }[] = [
  { value: undefined, swatch: "bg-zinc-600",    label: "Zinc" },
  { value: "blue",    swatch: "bg-blue-500",    label: "Blue" },
  { value: "emerald", swatch: "bg-emerald-500", label: "Emerald" },
  { value: "rose",    swatch: "bg-rose-500",    label: "Rose" },
  { value: "amber",   swatch: "bg-amber-500",   label: "Amber" },
  { value: "purple",  swatch: "bg-purple-500",  label: "Purple" },
  { value: "orange",  swatch: "bg-orange-500",  label: "Orange" },
];

// ─── Section card styling (ring, accent text, checkbox) ─────────────────────

export const SECTION_COLOR_STYLES: Record<string, { ring: string; accent: string; check: string }> = {
  blue:    { ring: "ring-blue-500/30",    accent: "text-blue-300",    check: "border-blue-400 bg-blue-400/80" },
  emerald: { ring: "ring-emerald-500/30", accent: "text-emerald-300", check: "border-emerald-400 bg-emerald-400/80" },
  rose:    { ring: "ring-rose-500/30",    accent: "text-rose-300",    check: "border-rose-400 bg-rose-400/80" },
  amber:   { ring: "ring-amber-500/30",   accent: "text-amber-300",   check: "border-amber-400 bg-amber-400/80" },
  purple:  { ring: "ring-purple-500/30",  accent: "text-purple-300",  check: "border-purple-400 bg-purple-400/80" },
  orange:  { ring: "ring-orange-500/30",  accent: "text-orange-300",  check: "border-orange-400 bg-orange-400/80" },
};

export function getSectionColorStyle(color: string | null) {
  if (color && SECTION_COLOR_STYLES[color]) return SECTION_COLOR_STYLES[color];
  return {
    ring: "ring-white/10",
    accent: "text-zinc-100",
    check: "border-emerald-300 bg-emerald-400/80",
  };
}
