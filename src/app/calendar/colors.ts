export function colorClasses(color?: string) {
  // Keep this small + opinionated. Add more as needed.
  switch ((color || "").toLowerCase()) {
    case "green":
      return "bg-emerald-400/10 text-emerald-100 ring-emerald-300/20";
    case "purple":
      return "bg-purple-400/10 text-purple-100 ring-purple-300/20";
    case "blue":
      return "bg-blue-400/10 text-blue-100 ring-blue-300/20";
    case "red":
      return "bg-red-400/10 text-red-100 ring-red-300/20";
    case "yellow":
      return "bg-yellow-400/10 text-yellow-100 ring-yellow-300/20";
    case "orange":
      return "bg-orange-400/10 text-orange-100 ring-orange-300/20";
    default:
      return "bg-emerald-400/10 text-emerald-100 ring-emerald-300/20";
  }
}
