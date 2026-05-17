"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CornerDownLeft } from "lucide-react";
import { format } from "date-fns";
import { useTaskStore, type Tag } from "@/store/taskStore";
import { parseNL } from "@/lib/nlParser";

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickCapture({ open, onClose }: QuickCaptureProps) {
  const { addTask, tags, selectedDate } = useTaskStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setInput("");
    }
  }, [open]);

  // Parse on every keystroke
  const parsed = useMemo(
    () => parseNL(input, tags.map((t: Tag) => t.name)),
    [input, tags],
  );

  const saveDate   = parsed.date ?? today;
  const isToday    = saveDate === today;
  const isSelected = saveDate === selectedDate;

  function handleSubmit() {
    if (!input.trim()) return;
    const tagIds = parsed.matchedTagNames
      .map((name) => tags.find((t: Tag) => t.name.toLowerCase() === name.toLowerCase())?.id)
      .filter(Boolean) as string[];

    addTask({
      title:       parsed.title || input.trim(),
      description: "",
      date:        saveDate,
      deadline:    "",
      tags:        tagIds,
      priority:    parsed.priority ?? undefined,
    });
    setInput("");
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    if (e.key === "Escape") onClose();
  }

  const hasDetected = parsed.tokens.length > 0;

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
            className="fixed inset-0 bg-ink/20 backdrop-blur-md z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[61] w-[580px] bg-paper rounded-2xl shadow-2xl border border-binding/40 overflow-hidden"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-binding/30">
              <Zap className="w-4 h-4 text-accent flex-shrink-0" />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Try "submit report tomorrow urgent" or "call dentist friday #work"'
                className="flex-1 bg-transparent text-sm font-semibold text-ink placeholder:text-ink-faint/70 outline-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-accent text-white disabled:opacity-40 hover:bg-accent-dim transition-colors flex-shrink-0"
              >
                <CornerDownLeft className="w-3 h-3" />
                Save
              </button>
            </div>

            {/* NL parse preview */}
            <AnimatePresence>
              {hasDetected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 py-3 border-b border-binding/20 flex items-center gap-3 flex-wrap bg-accent-soft/40">
                    <span className="font-mono text-[9px] text-ink-faint uppercase tracking-widest flex-shrink-0">
                      detected
                    </span>
                    {parsed.tokens.map((tok) => (
                      <span
                        key={tok}
                        className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20"
                      >
                        {tok}
                      </span>
                    ))}
                    {parsed.title && (
                      <span className="ml-auto font-mono text-[10px] text-ink-muted truncate max-w-[180px]">
                        title: &ldquo;{parsed.title}&rdquo;
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date + hint row */}
            <div className="flex items-center gap-3 px-5 py-2.5 bg-parchment/50">
              {/* Resolved date pill */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] text-ink-faint">saving to</span>
                <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isToday ? "bg-accent text-white" : "bg-binding/60 text-ink"
                }`}>
                  {isToday
                    ? `Today (${format(new Date(), "MMM d")})`
                    : format(new Date(saveDate + "T12:00:00"), "EEE, MMM d")}
                </span>
                {!isToday && !isSelected && (
                  <span className="font-mono text-[9px] text-ink-faint">· from text</span>
                )}
              </div>

              {/* Keyboard hints */}
              <div className="ml-auto flex items-center gap-3">
                <span className="font-mono text-[9px] text-ink-faint">
                  <kbd className="bg-binding px-1 rounded">Enter</kbd> save
                </span>
                <span className="font-mono text-[9px] text-ink-faint">
                  <kbd className="bg-binding px-1 rounded">Esc</kbd> close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
