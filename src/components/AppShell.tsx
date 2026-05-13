"use client";

import { useState, useEffect, useRef } from "react";
import QuickCapture from "./QuickCapture";
import KeyboardShortcuts from "./KeyboardShortcuts";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [quickOpen,     setQuickOpen]     = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      // Cmd/Ctrl+K — Quick Capture
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setQuickOpen((v) => !v);
        return;
      }

      // ? — Keyboard shortcuts (not in inputs)
      if (!inInput && e.key === "?") {
        setShortcutsOpen((v) => !v);
        return;
      }

      // Esc — close everything
      if (e.key === "Escape") {
        setQuickOpen(false);
        setShortcutsOpen(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {children}
      <QuickCapture    open={quickOpen}     onClose={() => setQuickOpen(false)} />
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
