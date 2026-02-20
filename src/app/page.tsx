import Link from "next/link";
import { ensureSeed, getDashboard } from "@/lib/dashboard";
import ThemeToggle from "@/app/theme/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureSeed();
  const sections = await getDashboard();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Master Chief Board</h1>
            <p className="mt-2 text-lg text-zinc-400">
              Simple, local, and always visible.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ThemeToggle />
            <Link
              href="/calendar"
              className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/15"
            >
              Calendar →
            </Link>
            <Link
              href="/admin"
              className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/15"
            >
              Edit →
            </Link>
          </div>
        </header>

        <main className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {sections.map((section) => (
            <section
              key={section.id}
              className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10"
            >
              <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
              <div className="mt-5 grid gap-3">
                {section.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className={`mt-1.5 h-5 w-5 rounded border ${
                        item.done
                          ? "border-emerald-300 bg-emerald-400/80"
                          : "border-white/25 bg-transparent"
                      }`}
                    />
                    <div
                      className={`text-lg leading-7 ${
                        item.done ? "text-zinc-400 line-through" : "text-zinc-100"
                      }`}
                    >
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>

        <footer className="mt-10 text-sm text-zinc-500">
          <span className="font-mono">/admin</span> to edit. Full-screen this tab for TV mode.
        </footer>
      </div>
    </div>
  );
}
