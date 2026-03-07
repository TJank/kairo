export function colorClasses(color?: string) {
  switch ((color || "").toLowerCase()) {
    case "blue":    return "bg-blue-400/10 text-blue-100 ring-blue-300/20";
    case "purple":  return "bg-purple-400/10 text-purple-100 ring-purple-300/20";
    case "green":   return "bg-emerald-400/10 text-emerald-100 ring-emerald-300/20";
    case "red":     return "bg-red-400/10 text-red-100 ring-red-300/20";
    case "yellow":  return "bg-yellow-400/10 text-yellow-100 ring-yellow-300/20";
    case "orange":  return "bg-orange-400/10 text-orange-100 ring-orange-300/20";
    case "pink":    return "bg-pink-400/10 text-pink-100 ring-pink-300/20";
    case "teal":    return "bg-teal-400/10 text-teal-100 ring-teal-300/20";
    case "indigo":  return "bg-indigo-400/10 text-indigo-100 ring-indigo-300/20";
    case "rose":    return "bg-rose-400/10 text-rose-100 ring-rose-300/20";
    case "lime":    return "bg-lime-400/10 text-lime-100 ring-lime-300/20";
    case "cyan":    return "bg-cyan-400/10 text-cyan-100 ring-cyan-300/20";
    default:        return "bg-zinc-400/10 text-zinc-100 ring-zinc-300/20";
  }
}

export const COLOR_OPTIONS = [
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
