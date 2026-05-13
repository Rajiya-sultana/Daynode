"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { useTaskStore, type Subtask } from "@/store/taskStore";

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
}

export default function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
  const { addSubtask, toggleSubtask, deleteSubtask } = useTaskStore();
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const done  = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;
  const pct   = total > 0 ? (done / total) * 100 : 0;

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  function handleAdd() {
    if (!draft.trim()) { setAdding(false); return; }
    addSubtask(taskId, draft.trim());
    setDraft("");
    // stay open for rapid adding
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") { setAdding(false); setDraft(""); }
  }

  return (
    <div className="mt-2 ml-0.5">
      {/* Trigger row */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="flex items-center gap-1.5 group"
        >
          <ChevronDown
            className={`w-3 h-3 text-ink-faint transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
          />
          <span className="font-mono text-[10px] text-ink-faint group-hover:text-ink-muted transition-colors">
            {total > 0 ? `${done}/${total} subtasks` : "subtasks"}
          </span>
        </button>

        {/* Mini progress bar */}
        {total > 0 && (
          <div className="flex-1 max-w-[80px] h-1 bg-ruling/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: done === total ? "#5BAD8A" : "#5B8DEF" }}
            />
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); setAdding(true); }}
          className="flex items-center gap-1 font-mono text-[9px] text-ink-faint hover:text-accent transition-colors"
        >
          <Plus className="w-3 h-3" />
          add
        </button>
      </div>

      {/* Expanded list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-col gap-1 pl-3 border-l-2 border-ruled ml-1">
              <AnimatePresence mode="popLayout">
                {subtasks.map((sub) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="flex items-center gap-2 group/sub py-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => toggleSubtask(taskId, sub.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                        sub.completed
                          ? "bg-done border-done text-white"
                          : "border-binding hover:border-accent"
                      }`}
                    >
                      {sub.completed && <span className="text-[8px] font-bold">✓</span>}
                    </button>
                    <span className={`text-xs flex-1 ${sub.completed ? "line-through text-ink-faint" : "text-ink"}`}>
                      {sub.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask(taskId, sub.id)}
                      className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-ink-faint hover:text-urgent"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add input */}
              {adding ? (
                <div className="flex items-center gap-2 py-0.5" onClick={(e) => e.stopPropagation()}>
                  <div className="w-4 h-4 rounded border border-dashed border-ink-faint flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => { handleAdd(); setAdding(false); }}
                    placeholder="Subtask title… (Enter to save)"
                    className="flex-1 text-xs bg-transparent outline-none text-ink placeholder:text-ink-faint"
                  />
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setAdding(true); }}
                  className="flex items-center gap-2 py-0.5 text-ink-faint hover:text-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-xs">Add subtask</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
