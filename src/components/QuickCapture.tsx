"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Tag as TagIcon, Calendar, CornerDownLeft } from "lucide-react";
import { format } from "date-fns";
import { useTaskStore, type Tag } from "@/store/taskStore";

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickCapture({ open, onClose }: QuickCaptureProps) {
  const { addTask, tags, selectedDate } = useTaskStore();
  const [title, setTitle]           = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState<"today" | "selected">("today");
  const inputRef = useRef<HTMLInputElement>(null);

  const today   = format(new Date(), "yyyy-MM-dd");
  const saveDate = targetDate === "today" ? today : selectedDate;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setTitle(""); setSelectedTags([]); setTargetDate("today");
    }
  }, [open]);

  function handleSubmit() {
    if (!title.trim()) return;
    addTask({ title: title.trim(), description: "", date: saveDate, deadline: "", tags: selectedTags });
    setTitle(""); setSelectedTags([]);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    if (e.key === "Escape") onClose();
  }

  function toggleTag(id: string) {
    setSelectedTags((p) => p.includes(id) ? p.filter((t) => t !== id) : [...p, id]);
  }

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
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[61] w-[560px] bg-paper rounded-2xl shadow-2xl border border-binding/40 overflow-hidden"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-binding/30">
              <Zap className="w-4 h-4 text-accent flex-shrink-0" />
              <input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Capture a task… (Enter to save)"
                className="flex-1 bg-transparent text-base font-semibold text-ink placeholder:text-ink-faint outline-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-accent text-white disabled:opacity-40 hover:bg-accent-dim transition-colors flex-shrink-0"
              >
                <CornerDownLeft className="w-3 h-3" />
                Save
              </button>
            </div>

            {/* Options row */}
            <div className="flex items-center gap-4 px-5 py-3">
              {/* Date target */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-faint" />
                <div className="flex items-center gap-1">
                  {[
                    { key: "today", label: `Today (${format(new Date(), "MMM d")})` },
                    { key: "selected", label: `Selected day` },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setTargetDate(key as "today" | "selected")}
                      className={`font-mono text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        targetDate === key
                          ? "bg-accent text-white"
                          : "text-ink-muted hover:bg-binding/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-1">
                <TagIcon className="w-3.5 h-3.5 text-ink-faint" />
                <div className="flex items-center gap-1 flex-wrap">
                  {tags.map((tag: Tag) => {
                    const active = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full transition-all"
                        style={{
                          backgroundColor: active ? tag.color + "25" : "transparent",
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
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-5 py-2 bg-parchment/50 border-t border-binding/20">
              <span className="font-mono text-[9px] text-ink-faint"><kbd className="bg-binding px-1 rounded">Enter</kbd> save</span>
              <span className="font-mono text-[9px] text-ink-faint"><kbd className="bg-binding px-1 rounded">Esc</kbd> close</span>
              <span className="font-mono text-[9px] text-ink-faint ml-auto">Quick Capture</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
