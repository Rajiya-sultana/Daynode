"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type TaskStatus, STATUS_META, STATUS_ORDER } from "@/store/taskStore";

interface StatusPickerProps {
  status: TaskStatus;
  onChange: (s: TaskStatus) => void;
}

export default function StatusPicker({ status, onChange }: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = STATUS_META[status];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1 font-mono text-[9px] font-semibold px-2 py-1 rounded-lg transition-all hover:opacity-80 border"
        style={{
          backgroundColor: meta.bg,
          color: meta.color,
          borderColor: meta.color + "40",
        }}
      >
        <span>{meta.icon}</span>
        <span className="hidden sm:inline">{meta.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 z-50 bg-paper border border-binding/60 rounded-2xl shadow-xl overflow-hidden min-w-[160px]"
          >
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink-faint px-3 pt-2.5 pb-1.5 border-b border-binding/30">
              Set status
            </p>
            {STATUS_ORDER.map((s) => {
              const m = STATUS_META[s];
              const active = s === status;
              return (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-binding/30 ${active ? "bg-binding/20" : ""}`}
                >
                  <span className="font-mono text-sm" style={{ color: m.color }}>{m.icon}</span>
                  <span className="text-xs font-semibold text-ink">{m.label}</span>
                  {active && (
                    <span className="ml-auto font-mono text-[9px] text-ink-faint">current</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
