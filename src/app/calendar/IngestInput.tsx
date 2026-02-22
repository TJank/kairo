"use client";

import { useState, useTransition } from "react";

export default function IngestInput({ onRefresh }: { onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();

        if (!res.ok) {
          setResult(`Error: ${data.error ?? "Unknown error"}`);
          return;
        }

        const created = (data.created ?? []) as { type: string; title?: string; text?: string }[];
        if (created.length === 0) {
          setResult("Nothing created.");
        } else {
          setResult(
            `Created ${created.length} item(s): ` +
              created.map((c) => `${c.type} "${c.title ?? c.text}"`).join(", ")
          );
          setText("");
          onRefresh();
        }
      } catch (err: unknown) {
        setResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  }

  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium text-zinc-300">Quick Add (text ingest)</span>
        <span className="text-zinc-500 text-sm">{open ? "▲ Hide" : "▼ Show"}</span>
      </button>

      {open && (
        <div className="border-t border-white/8 px-5 pb-5 pt-4">
          <p className="mb-3 text-xs text-zinc-500">
            Try: <span className="font-mono">work: standup 9-930am mon-fri</span> or{" "}
            <span className="font-mono">todo: finish report by Friday</span>
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => { setText(e.target.value); setResult(null); }}
              placeholder="Describe an event or task…"
              className="flex-1 rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              disabled={isPending || !text.trim()}
              className="rounded-xl bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              {isPending ? "…" : "Add"}
            </button>
          </form>
          {result && (
            <p className="mt-2 text-xs text-zinc-400">{result}</p>
          )}
        </div>
      )}
    </div>
  );
}
