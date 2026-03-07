"use client";

import { useState } from "react";
import AddTaskModal from "@/app/tasks/AddTaskModal";
import ManageTaskSectionsModal from "@/app/tasks/ManageTaskSectionsModal";

type Project = { id: string; key: string; name: string; color: string };

export default function TasksHeader({ projects }: { projects: Project[] }) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showManage, setShowManage] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAddTask(true)}
          className="rounded-2xl bg-white/15 px-5 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors"
        >
          + Add Task
        </button>
        <button
          onClick={() => setShowManage(true)}
          className="rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-colors"
        >
          Sections
        </button>
      </div>

      {showAddTask && (
        <AddTaskModal projects={projects} onClose={() => setShowAddTask(false)} />
      )}
      {showManage && (
        <ManageTaskSectionsModal projects={projects} onClose={() => setShowManage(false)} />
      )}
    </>
  );
}
