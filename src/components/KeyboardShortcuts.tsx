"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const groups = [
  {
    label: "Navigation",
    items: [
      { keys: ["1"], desc: "Go to Today" },
      { keys: ["2"], desc: "Go to Calendar" },
      { keys: ["3"], desc: "Go to Stats" },
      { keys: ["4"], desc: "Go to Review" },
    ],
  },
  {
    label: "Tasks",
    items: [
      { keys: ["N"], desc: "New task" },
      { keys: ["⌘", "K"], desc: "Quick Capture" },
      { keys: ["←", "→"], desc: "Previous / Next day" },
      { keys: ["⊙"], desc: "Focus — hover a task and click the target icon" },
    ],
  },
  {
    label: "General",
    items: [
      { keys: ["?"], desc: "Show shortcuts" },
      { keys: ["Esc"], desc: "Close any modal" },
    ],
  },
];

export default function KeyboardShortcuts({ open, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/20 backdrop-blur-md z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[420px] bg-paper rounded-2xl shadow-2xl border border-binding/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-binding/30">
              <Keyboard className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="font-mono text-sm font-semibold text-ink flex-1">Keyboard Shortcuts</span>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shortcut groups */}
            <div className="px-5 py-4 space-y-5">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-ink-faint mb-2">{group.label}</p>
                  <div className="space-y-1.5">
                    {group.items.map(({ keys, desc }) => (
                      <div key={desc} className="flex items-center justify-between">
                        <span className="text-sm text-ink-muted">{desc}</span>
                        <div className="flex items-center gap-1">
                          {keys.map((k) => (
                            <kbd key={k} className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-parchment border border-binding text-ink-muted shadow-sm">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-parchment/50 border-t border-binding/20">
              <p className="font-mono text-[9px] text-ink-faint">Press <kbd className="bg-binding px-1 rounded">Esc</kbd> to close</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
