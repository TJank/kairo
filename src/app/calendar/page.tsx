import Link from "next/link";
import WeekGrid from "@/app/calendar/WeekGrid";
import ThemeToggle from "@/app/theme/ThemeToggle";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[1400px] px-8 py-10">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Calendar</h1>
            <p className="mt-2 text-lg text-zinc-400">TJ Cortana Calendar (Sun–Sat)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/15"
            >
              Dashboard →
            </Link>
            <Link
              href="/admin"
              className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/15"
            >
              Admin →
            </Link>
          </div>
        </header>

        <main className="mt-10">
          <WeekGrid />
        </main>

        <footer className="mt-10 text-sm text-zinc-500">
          Tip: open <span className="font-mono">/calendar</span> full-screen for TV mode.
        </footer>
      </div>
    </div>
  );
}
