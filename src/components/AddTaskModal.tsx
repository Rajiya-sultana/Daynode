"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag as TagIcon, CornerDownLeft, Loader2, AlertTriangle, CheckCheck, Timer, Sparkles } from "lucide-react";
import { useTaskStore, type Tag, type Task } from "@/store/taskStore";
import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import { parseNL } from "@/lib/nlParser";
import type { LTMatch } from "@/lib/languageTool";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task;
  inboxMode?: boolean;
}

export default function AddTaskModal({ open, onClose, task, inboxMode }: AddTaskModalProps) {
  const { addTask, updateTask, tags, selectedDate } = useTaskStore();
  const isEditing = !!task;

  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [deadline, setDeadline]         = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | "">("");
  const [priority, setPriority] = useState<"urgent" | "high" | undefined>(undefined);
  const titleRef = useRef<HTMLInputElement>(null);

  const { matches, checking, applyFix, applyAllFixes, ignoreWord } = useGrammarCheck(title);

  // NL parse on the title — only when not editing (don't mess with existing data)
  const nlParsed = useMemo(
    () => (!isEditing && title.length > 3 ? parseNL(title, tags.map((t: Tag) => t.name)) : null),
    [title, isEditing, tags],
  );
  const hasNL = !!nlParsed && nlParsed.tokens.length > 0;

  function applyNL() {
    if (!nlParsed) return;
    if (nlParsed.title)    setTitle(nlParsed.title);
    if (nlParsed.date)     setDeadline(nlParsed.date);
    if (nlParsed.priority) setPriority(nlParsed.priority);
    if (nlParsed.matchedTagNames.length > 0) {
      const ids = nlParsed.matchedTagNames
        .map((n) => tags.find((t: Tag) => t.name.toLowerCase() === n.toLowerCase())?.id)
        .filter(Boolean) as string[];
      setSelectedTags((prev) => [...new Set([...prev, ...ids])]);
    }
  }

  // Populate fields when opening (edit) or reset when opening (add)
  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDeadline(task.deadline);
      setSelectedTags(task.tags);
      setEstimatedMinutes(task.estimatedMinutes ?? "");
      setPriority(task.priority);
    } else {
      reset();
    }
    setTimeout(() => titleRef.current?.focus(), 80);
  }, [open, task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const estMins = estimatedMinutes === "" ? undefined : Number(estimatedMinutes);
    if (isEditing && task) {
      updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        deadline,
        tags: selectedTags,
        estimatedMinutes: estMins,
        priority,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim(),
        date: inboxMode ? "" : selectedDate,
        deadline,
        tags: selectedTags,
        estimatedMinutes: estMins,
        priority,
      });
    }
    reset();
    onClose();
  }

  function reset() {
    setTitle(""); setDescription(""); setDeadline(""); setSelectedTags([]); setEstimatedMinutes(""); setPriority(undefined);
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handleSingleFix(match: LTMatch, replacement: string) {
    setTitle((prev) => applyFix(match, replacement, prev));
  }

  function handleFixAll() {
    setTitle((prev) => applyAllFixes(prev));
  }

  const hasFixable = matches.some((m) => m.replacements.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/10 backdrop-blur-[2px] z-40"
          />

          {/* Side panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-[420px] bg-paper border-l border-binding/60 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-binding/40">
              <div>
                <p className="font-mono text-[10px] text-ink-faint uppercase tracking-widest mb-0.5">
                  {isEditing ? "edit entry" : inboxMode ? "inbox" : "new entry"}
                </p>
                <h2 className="font-semibold text-ink text-base">
                  {isEditing ? "Edit Task" : inboxMode ? "Add to Inbox" : "Add Task"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-binding/40 text-ink-muted hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col gap-5 px-6 py-5 overflow-y-auto"
            >
              {/* ── Title field ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">
                    task title *
                  </label>
                  {/* Checking indicator */}
                  {checking && (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-ink-faint">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      checking…
                    </span>
                  )}
                  {!checking && matches.length === 0 && title.length > 3 && (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-done">
                      <CheckCheck className="w-3 h-3" />
                      looks good
                    </span>
                  )}
                </div>

                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-transparent border-0 border-b-2 border-ruled focus:border-accent outline-none text-sm font-semibold text-ink placeholder:text-ink-faint py-2 transition-colors"
                />

                {/* ── Grammar suggestion panel ── */}
                <AnimatePresence>
                  {matches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="mt-2.5 rounded-xl border border-urgent/20 bg-urgent-soft overflow-hidden"
                    >
                      {/* Panel header */}
                      <div className="flex items-center justify-between px-3.5 py-2 border-b border-urgent/10">
                        <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-urgent uppercase tracking-wide">
                          <AlertTriangle className="w-3 h-3" />
                          {matches.length} issue{matches.length > 1 ? "s" : ""} found
                        </span>
                        {hasFixable && matches.length > 1 && (
                          <button
                            type="button"
                            onClick={handleFixAll}
                            className="font-mono text-[9px] font-semibold text-accent hover:text-accent-dim underline underline-offset-2 transition-colors"
                          >
                            Fix all
                          </button>
                        )}
                      </div>

                      {/* Each issue */}
                      <div className="divide-y divide-urgent/10">
                        {matches.map((match, i) => {
                          const wrong = title.slice(match.offset, match.offset + match.length);
                          const topSuggestion = match.replacements[0]?.value;

                          return (
                            <div key={i} className="px-3.5 py-2.5 flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                {/* Wrong word → suggestion */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[11px] font-semibold text-urgent bg-urgent/10 px-1.5 py-0.5 rounded line-through">
                                    {wrong}
                                  </span>
                                  {topSuggestion && (
                                    <>
                                      <span className="font-mono text-[10px] text-ink-faint">→</span>
                                      <span className="font-mono text-[11px] font-semibold text-done bg-done/10 px-1.5 py-0.5 rounded">
                                        {topSuggestion}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {/* Reason */}
                                <p className="text-[10px] text-ink-muted mt-0.5 leading-relaxed">
                                  {match.message}
                                </p>
                              </div>

                              {/* Fix + Ignore buttons */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {topSuggestion && (
                                  <button
                                    type="button"
                                    onClick={() => handleSingleFix(match, topSuggestion)}
                                    className="font-mono text-[9px] font-semibold px-2.5 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-dim transition-colors"
                                  >
                                    Fix
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => ignoreWord(wrong)}
                                  title={`Always ignore "${wrong}"`}
                                  className="font-mono text-[9px] font-semibold px-2.5 py-1.5 rounded-lg border border-binding text-ink-muted hover:bg-binding/40 hover:text-ink transition-colors"
                                >
                                  Ignore
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── NL detection chips ── */}
                <AnimatePresence>
                  {hasNL && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="mt-2.5 flex items-center gap-2 flex-wrap"
                    >
                      <Sparkles className="w-3 h-3 text-accent flex-shrink-0" />
                      {nlParsed!.tokens.map((tok) => (
                        <span
                          key={tok}
                          className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20"
                        >
                          {tok}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={applyNL}
                        className="ml-auto font-mono text-[9px] font-semibold px-2.5 py-1 rounded-lg bg-accent text-white hover:bg-accent-dim transition-colors flex-shrink-0"
                      >
                        Apply
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Description ── */}
              <div>
                <label className="font-mono text-[10px] text-ink-faint uppercase tracking-widest block mb-1.5">
                  note
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full bg-transparent border-0 border-b border-ruled focus:border-accent outline-none text-sm text-ink placeholder:text-ink-faint py-1.5 resize-none transition-colors leading-relaxed"
                />
              </div>

              {/* ── Deadline ── */}
              <div>
                <label className="font-mono text-[10px] text-ink-faint uppercase tracking-widest block mb-1.5">
                  deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-ruled focus:border-accent outline-none font-mono text-sm text-ink py-2 transition-colors"
                />
              </div>

              {/* ── Estimate ── */}
              <div>
                <label className="font-mono text-[10px] text-ink-faint uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <Timer className="w-3 h-3" />
                  estimate
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[15, 30, 60, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEstimatedMinutes(estimatedMinutes === m ? "" : m)}
                      className={`font-mono text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                        estimatedMinutes === m
                          ? "bg-accent text-white border-accent"
                          : "border-ruled text-ink-muted hover:border-accent hover:text-accent"
                      }`}
                    >
                      {m < 60 ? `${m}m` : `${m / 60}h`}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    placeholder="custom min"
                    value={typeof estimatedMinutes === "number" && ![15,30,60,120].includes(estimatedMinutes) ? estimatedMinutes : ""}
                    onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : "")}
                    className="w-24 bg-transparent border-b border-ruled focus:border-accent outline-none font-mono text-xs text-ink placeholder:text-ink-faint py-1 transition-colors"
                  />
                </div>
              </div>

              {/* ── Priority ── */}
              <div>
                <label className="font-mono text-[10px] text-ink-faint uppercase tracking-widest block mb-2">
                  priority
                </label>
                <div className="flex items-center gap-2">
                  {([
                    { value: undefined,  label: "Normal", color: "var(--color-ink-muted)", bg: "transparent", border: "var(--color-ruled)" },
                    { value: "high",     label: "▲ High",   color: "#F0A057", bg: "#FEF3EA", border: "#F0A057" },
                    { value: "urgent",   label: "⚡ Urgent", color: "#E88C8C", bg: "#FDEAEA", border: "#E88C8C" },
                  ] as const).map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className="font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg border-2 transition-all"
                      style={{
                        color: priority === opt.value ? opt.color : "var(--color-ink-muted)",
                        backgroundColor: priority === opt.value ? opt.bg : "transparent",
                        borderColor: priority === opt.value ? opt.border : "var(--color-ruled)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Tags ── */}
              <div>
                <label className="font-mono text-[10px] text-ink-faint uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <TagIcon className="w-3 h-3" />
                  tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: Tag) => {
                    const active = selectedTags.includes(tag.id);
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
                          ...(active
                            ? { boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${tag.color}40` }
                            : {}),
                        }}
                      >
                        #{tag.name.toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-binding/40 flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-binding text-ink-muted text-sm font-semibold hover:bg-binding/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
                {isEditing ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
