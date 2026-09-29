"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useTaskStore, type Task, STATUS_META } from "@/store/taskStore";
import TaskCard from "./TaskCard";
import EmptyState from "./EmptyState";
import { useUIStore } from "@/store/uiStore";
import { CATEGORIES, getCategory, type Category } from "@/lib/categories";

const GROUPS = [
  { key: "blocked",     statuses: ["blocked"] },
  { key: "active",      statuses: ["pending", "seen", "in-progress"] },
  { key: "completed",   statuses: ["completed"] },
  { key: "cancelled",   statuses: ["cancelled"] },
] as const;

const PRIORITY_WEIGHT = { urgent: 0, high: 1, undefined: 2 } as const;

function priorityWeight(t: Task) {
  return PRIORITY_WEIGHT[t.priority as keyof typeof PRIORITY_WEIGHT ?? "undefined"] ?? 2;
}

interface TaskListProps {
  onEdit?: (task: Task) => void;
}

type SectionId = Category | "other";

export default function TaskList({ onEdit }: TaskListProps) {
  const { tasks, selectedDate } = useTaskStore();
  const { openCategory, setOpenCategory } = useUIStore();

  const dateTasks = tasks
    .filter((t: Task) => t.date === selectedDate)
    .sort((a: Task, b: Task) => {
      const pw = priorityWeight(a) - priorityWeight(b);
      return pw !== 0 ? pw : a.order - b.order;
    });

  if (dateTasks.length === 0) return <EmptyState />;

  const uncategorised = dateTasks.filter((t) => getCategory(t) === null);
  const sections: { id: SectionId; name: string; color: string; tasks: Task[] }[] = [
    ...CATEGORIES.map((c) => ({ ...c, tasks: dateTasks.filter((t) => getCategory(t) === c.id) })),
    ...(uncategorised.length > 0
      ? [{ id: "other" as const, name: "Uncategorised", color: "#B8AFA2", tasks: uncategorised }]
      : []),
  ];

  return (
    <div className="flex flex-col divide-y divide-ruled/60 border-b border-ruled/60">
      {sections.map((section) => {
        const isOpen = openCategory === section.id;
        const done = section.tasks.filter((t) => t.status === "completed").length;
        return (
          <div key={section.id}>
            {/* Category header — click to open; opening one closes the others */}
            <button
              type="button"
              onClick={() => setOpenCategory(isOpen ? null : section.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center text-left hover:bg-binding/20 transition-colors"
              style={{ minHeight: "44px" }}
            >
              <div className="w-10 flex-shrink-0 flex items-center justify-center">
                <ChevronRight
                  className="w-3.5 h-3.5 text-ink-faint transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                />
              </div>
              <div className="w-px self-stretch bg-margin/30 flex-shrink-0" />
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }} />
                <span className="text-sm font-semibold text-ink">{section.name}</span>
                <span className="font-mono text-[10px] text-ink-faint">
                  {section.tasks.length === 0 ? "no tasks" : `${done}/${section.tasks.length} done`}
                </span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  {section.tasks.length === 0 ? (
                    <p className="font-mono text-[10px] text-ink-faint pl-14 pb-3">
                      Nothing here today. Add a task with this category to see it here.
                    </p>
                  ) : (
                    <SectionTasks tasks={section.tasks} allDateTasks={dateTasks} onEdit={onEdit} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function SectionTasks({ tasks, allDateTasks, onEdit }: { tasks: Task[]; allDateTasks: Task[]; onEdit?: (task: Task) => void }) {
  const { selectedDate, reorderTasks } = useTaskStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    // Reorder within this section; tasks in other sections keep their relative order
    const inSection = new Set(tasks.map((t) => t.id));
    const rest = allDateTasks.filter((t) => !inSection.has(t.id));
    reorderTasks(selectedDate, [...reordered, ...rest].map((t) => t.id));
  }

  let lineCounter = 1;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col divide-y divide-ruled/40">
          {GROUPS.map(({ key, statuses }) => {
            const group = tasks.filter((t) => (statuses as readonly string[]).includes(t.status));
            if (group.length === 0) return null;

            const isBlocked   = key === "blocked";
            const isCompleted = key === "completed";
            const isCancelled = key === "cancelled";

            const labelColor = isBlocked   ? "#E88C8C"
                             : isCompleted ? "#5BAD8A"
                             : isCancelled ? "#B8AFA2"
                             : "#8A8070";

            const labelText  = isBlocked   ? "blocked"
                             : isCompleted ? "completed"
                             : isCancelled ? "cancelled"
                             : "open tasks";

            return (
              <div key={key}>
                {/* Section label row */}
                <div className="flex items-center" style={{ minHeight: "36px" }}>
                  <div className="w-10 flex-shrink-0" />
                  <div className="w-px self-stretch bg-margin/30 flex-shrink-0" />
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <span
                      className="font-mono text-[9px] font-semibold uppercase tracking-widest"
                      style={{ color: labelColor }}
                    >
                      {labelText}
                    </span>
                    <span className="font-mono text-[9px] text-ink-faint">
                      [{group.length}]
                    </span>
                    {key === "active" && (
                      <div className="flex items-center gap-1 ml-1">
                        {(["pending", "seen", "in-progress"] as const).map((s) => {
                          const count = group.filter((t) => t.status === s).length;
                          if (!count) return null;
                          const m = STATUS_META[s];
                          return (
                            <span
                              key={s}
                              className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: m.bg, color: m.color }}
                            >
                              {m.icon} {count}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence mode="popLayout">
                  {group.map((task: Task) => (
                    <TaskCard key={task.id} task={task} lineNumber={lineCounter++} onEdit={onEdit} />
                  ))}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
