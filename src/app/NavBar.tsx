"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/app/theme/ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Whiteboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-white/8 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-8 py-3">
        <span className="text-base font-semibold tracking-tight text-zinc-100">Kairo</span>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/15 text-zinc-100"
                    : "text-zinc-400 hover:bg-white/8 hover:text-zinc-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
