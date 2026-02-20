import Link from "next/link";
import { ensureSeed, getDashboard } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
import {
  addItem,
  deleteItem,
  toggleItem,
  updateItemText,
  updateSectionTitle,
} from "@/app/admin/actions";

export default async function AdminPage() {
  await ensureSeed();
  const sections = await getDashboard();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard Admin</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Edit your sections and checklist items. No auth for now—keep it local.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            View dashboard →
          </Link>
        </div>

        <div className="mt-8 grid gap-6">
          {sections.map((section) => (
            <div key={section.id} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <form
                action={async (formData) => {
                  "use server";
                  await updateSectionTitle(section.id, String(formData.get("title") ?? ""));
                }}
                className="flex items-center gap-3"
              >
                <input
                  name="title"
                  defaultValue={section.title}
                  className="w-full rounded-xl bg-black/40 px-3 py-2 text-lg font-semibold outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
                />
                <button className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
                  Save
                </button>
              </form>

              <div className="mt-4 grid gap-3">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-black/30 p-3 ring-1 ring-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <form action={toggleItem.bind(null, item.id)}>
                        <button
                          className={`mt-1 h-6 w-6 rounded border ring-1 ring-white/10 ${
                            item.done
                              ? "bg-emerald-400/80 border-emerald-300"
                              : "bg-transparent border-white/20 hover:border-white/40"
                          }`}
                          title="Toggle done"
                        />
                      </form>

                      <form
                        action={async (formData) => {
                          "use server";
                          await updateItemText(item.id, String(formData.get("text") ?? ""));
                        }}
                        className="flex w-full items-center gap-2"
                      >
                        <input
                          name="text"
                          defaultValue={item.text}
                          className={`w-full rounded-lg bg-transparent px-2 py-1 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30 ${
                            item.done ? "text-zinc-400 line-through" : "text-zinc-100"
                          }`}
                        />
                        <button className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15">
                          Save
                        </button>
                      </form>

                      <form action={deleteItem.bind(null, item.id)}>
                        <button
                          className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                          title="Delete item"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}

                <form
                  action={async (formData) => {
                    "use server";
                    await addItem(section.id, String(formData.get("text") ?? ""));
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="text"
                    placeholder="Add an item…"
                    className="w-full rounded-xl bg-black/40 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
                  />
                  <button className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
                    Add
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-zinc-500">
          Tip: keep <span className="font-mono">/admin</span> bookmarked on this PC.
        </p>
      </div>
    </div>
  );
}
