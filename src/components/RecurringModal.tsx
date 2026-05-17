"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Repeat, Plus, Trash2, Tag as TagIcon, ToggleLeft, ToggleRight } from "lucide-react";
import { useTaskStore, type RecurringTask, type RecurrenceType, type Tag } from "@/store/taskStore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; desc: string }[] = [
  { value: "daily",    label: "Every day",    desc: "Mon – Sun" },
  { value: "weekdays", label: "Weekdays",     desc: "Mon – Fri" },
  { value: "weekly",   label: "Once a week",  desc: "Pick a day" },
  { value: "custom",   label: "Custom days",  desc: "Pick multiple" },
];

interface RecurringModalProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  recurrence: "daily" as RecurrenceType,
  days: [] as number[],
  tags: [] as string[],
};

export default function RecurringModal({ open, onClose }: RecurringModalProps) {
  const { recurringTasks, addRecurringTask, updateRecurringTask, deleteRecurringTask, tags } = useTaskStore();
  const [form, setForm]         = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  function resetForm() { setForm(EMPTY_FORM); setShowForm(false); }

  function handleAdd() {
    if (!form.title.trim()) return;
    addRecurringTask({
      title: form.title.trim(),
      description: form.description.trim(),
      recurrence: form.recurrence,
      days: form.days,
      tags: form.tags,
      active: true,
    });
    resetForm();
  }

  function toggleDay(d: number) {
    setForm((f) => {
      if (f.recurrence === "weekly") return { ...f, days: [d] };
      return { ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] };
    });
  }

  function toggleTag(id: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(id) ? f.tags.filter((t) => t !== id) : [...f.tags, id],
    }));
  }

  const needsDayPicker = form.recurrence === "weekly" || form.recurrence === "custom";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/10 backdrop-blur-[2px] z-40"
          />

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-[420px] bg-paper border-l border-binding/60 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-binding/40 flex-shrink-0">
              <div>
                <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest mb-0.5">automation</p>
                <h2 className="font-semibold text-ink text-base flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-accent" />
                  Recurring Tasks
                </h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-binding/40 text-ink-muted hover:text-ink transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              {recurringTasks.length === 0 && !showForm && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Repeat className="w-8 h-8 text-ink-faint mb-3" />
                  <p className="font-mono text-xs text-ink-faint">No recurring tasks yet.</p>
                  <p className="font-mono text-[10px] text-ink-faint mt-1">Add habits, standups, and routines.</p>
                </div>
              )}

              {recurringTasks.map((rt) => (
                <RecurringRow
                  key={rt.id}
                  rt={rt}
                  allTags={tags}
                  onToggle={(v) => updateRecurringTask(rt.id, { active: v })}
                  onDelete={() => deleteRecurringTask(rt.id)}
                />
              ))}

              {/* Inline add form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="border border-binding/60 rounded-2xl p-4 bg-card flex flex-col gap-4"
                  >
                    <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">New recurring task</p>

                    {/* Title */}
                    <input
                      autoFocus
                      type="text"
                      placeholder="Task title *"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full bg-transparent border-b-2 border-ruled focus:border-accent outline-none text-sm font-semibold text-ink placeholder:text-ink-faint py-1.5 transition-colors"
                    />

                    {/* Description */}
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full bg-transparent border-b border-ruled focus:border-accent outline-none text-sm text-ink placeholder:text-ink-faint py-1.5 transition-colors"
                    />

                    {/* Recurrence */}
                    <div>
                      <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest mb-2">Repeat</p>
                      <div className="grid grid-cols-2 gap-2">
                        {RECURRENCE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, recurrence: opt.value, days: [] }))}
                            className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                              form.recurrence === opt.value
                                ? "border-accent bg-accent-soft text-accent"
                                : "border-binding text-ink-muted hover:border-ink-muted"
                            }`}
                          >
                            <p className="text-xs font-semibold">{opt.label}</p>
                            <p className="font-mono text-[9px] opacity-70 mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Day picker */}
                    {needsDayPicker && (
                      <div>
                        <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest mb-2">
                          {form.recurrence === "weekly" ? "Which day?" : "Which days?"}
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {DAYS.map((d, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => toggleDay(i)}
                              className={`font-mono text-[10px] font-semibold w-9 h-9 rounded-xl border transition-all ${
                                form.days.includes(i)
                                  ? "border-accent bg-accent text-white"
                                  : "border-binding text-ink-muted hover:border-ink-muted"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest mb-2 flex items-center gap-1">
                          <TagIcon className="w-3 h-3" /> Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag: Tag) => {
                            const active = form.tags.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded transition-all"
                                style={{
                                  backgroundColor: active ? tag.color + "20" : "transparent",
                                  color: active ? tag.color : "var(--color-ink-muted)",
                                  border: `1.5px solid ${active ? tag.color : "var(--color-ruled)"}`,
                                }}
                              >
                                #{tag.name.toLowerCase()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Form actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={resetForm}
                        className="flex-1 py-2 rounded-xl border border-binding text-ink-muted text-sm font-semibold hover:bg-binding/30 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAdd}
                        disabled={!form.title.trim() || (needsDayPicker && form.days.length === 0)}
                        className="flex-1 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!showForm && (
              <div className="px-6 py-4 border-t border-binding/40 flex-shrink-0">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dim transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Recurring Task
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function RecurringRow({
  rt, allTags, onToggle, onDelete,
}: {
  rt: RecurringTask;
  allTags: Tag[];
  onToggle: (v: boolean) => void;
  onDelete: () => void;
}) {
  const rtTags = allTags.filter((t) => rt.tags.includes(t.id));

  const recurrenceLabel =
    rt.recurrence === "daily"    ? "Every day" :
    rt.recurrence === "weekdays" ? "Weekdays" :
    rt.recurrence === "weekly"   ? `Every ${DAYS[rt.days[0]] ?? ""}` :
    rt.days.map((d) => DAYS[d]).join(", ");

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border transition-all ${
      rt.active ? "border-binding/60 bg-card" : "border-binding/30 bg-card/50 opacity-60"
    }`}>
      <Repeat className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${rt.active ? "text-ink" : "text-ink-muted line-through"}`}>
          {rt.title}
        </p>
        {rt.description && (
          <p className="text-xs text-ink-muted mt-0.5">{rt.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="font-mono text-[9px] text-ink-faint uppercase tracking-wide">{recurrenceLabel}</span>
          {rtTags.map((tag) => (
            <span
              key={tag.id}
              className="font-mono text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: tag.color + "18", color: tag.color }}
            >
              #{tag.name.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onToggle(!rt.active)}
          className="text-ink-muted hover:text-accent transition-colors"
          title={rt.active ? "Pause" : "Resume"}
        >
          {rt.active
            ? <ToggleRight className="w-5 h-5 text-accent" />
            : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-urgent-soft text-ink-faint hover:text-urgent transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
