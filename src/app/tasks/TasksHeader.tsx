"use client";

import { useState } from "react";
import ManageCategoriesModal from "@/app/calendar/ManageCategoriesModal";

type Project = { id: string; key: string; name: string; color: string };

export default function TasksHeader({ projects }: { projects: Project[] }) {
  const [showManage, setShowManage] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowManage(true)}
        className="rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-colors"
      >
        + Add Section
      </button>

      {showManage && (
        <ManageCategoriesModal
          projects={projects}
          onClose={() => setShowManage(false)}
        />
      )}
    </>
  );
}
