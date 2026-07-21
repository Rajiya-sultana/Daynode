"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "@/store/taskStore";

export default function DailyJournal() {
  const { journals, selectedDate, setJournal } = useTaskStore();
  const text   = journals[selectedDate] ?? "";
  const [open, setOpen]   = useState(false);
  const [draft, setDraft] = useState(text);
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  // Sync draft when date changes
  useEffect(() => {
    setDraft(journals[selectedDate] ?? "");
    setSaved(true);
  }, [selectedDate, journals]);

  // Auto-save with debounce
  useEffect(() => {
    clearTimeout(timer.current);
    if (draft === (journals[selectedDate] ?? "")) { setSaved(true); return; }
    setSaved(false);
    timer.current = setTimeout(() => {
      setJournal(selectedDate, draft);
      setSaved(true);
    }, 800);
    return () => clearTimeout(timer.current);
  }, [draft, selectedDate]);

  const hasContent = text.trim().length > 0;

  return (
    <div className="border-b border-ruled/60">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-3 hover:bg-binding/10 transition-colors group"
      >
        <BookOpen className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint flex-1 text-left">
          daily note
        </span>
        {hasContent && !open && (
          <span className="font-mono text-[9px] text-ink-faint truncate max-w-[300px] text-right">
            {text.split("\n")[0].slice(0, 60)}{text.split("\n")[0].length > 60 ? "…" : ""}
          </span>
        )}
        {!hasContent && !open && (
          <span className="font-mono text-[9px] text-ink-faint/50 italic">click to write…</span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-faint transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>

      {/* Editor */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 pt-1 flex flex-col gap-1.5">
              <textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onFocus={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder={"What's on your mind today?\nCapture thoughts, ideas, reflections…"}
                rows={4}
                autoFocus
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint/50 outline-none resize-none leading-relaxed overflow-y-auto"
                style={{ maxHeight: "60vh" }}
              />
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] text-ink-faint">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
                <span className={`font-mono text-[9px] transition-colors ${saved ? "text-done" : "text-pending"}`}>
                  {saved ? "✓ saved" : "saving…"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
