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
import { AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import { useTaskStore, type Task, STATUS_META } from "@/store/taskStore";
import TaskCard from "./TaskCard";

const GROUPS = [
  { key: "blocked",   statuses: ["blocked"] },
  { key: "active",    statuses: ["pending", "seen", "in-progress"] },
  { key: "completed", statuses: ["completed"] },
  { key: "cancelled", statuses: ["cancelled"] },
] as const;

interface InboxListProps {
  onEdit?: (task: Task) => void;
}

export default function InboxList({ onEdit }: InboxListProps) {
  const { tasks, reorderTasks, scheduleTask } = useTaskStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const inboxTasks = tasks
    .filter((t: Task) => t.date === "")
    .sort((a: Task, b: Task) => a.order - b.order);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = inboxTasks.findIndex((t) => t.id === active.id);
    const newIndex = inboxTasks.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(inboxTasks, oldIndex, newIndex);
    reorderTasks("", reordered.map((t) => t.id));
  }

  if (inboxTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-ink-faint">
        <Inbox className="w-10 h-10 opacity-30" />
        <p className="font-mono text-sm">Inbox is empty</p>
        <p className="font-mono text-[10px] text-ink-faint/60">Tasks you add here have no date — schedule them when you're ready.</p>
      </div>
    );
  }

  let lineCounter = 1;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={inboxTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col divide-y divide-ruled/40">
          {GROUPS.map(({ key, statuses }) => {
            const group = inboxTasks.filter((t) => (statuses as readonly string[]).includes(t.status));
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
                             : "open";

            return (
              <div key={key}>
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
                    <TaskCard
                      key={task.id}
                      task={task}
                      lineNumber={lineCounter++}
                      onEdit={onEdit}
                      onSchedule={scheduleTask}
                    />
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
