"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, ChevronDown, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "@/store/taskStore";

export default function DailyJournal() {
  const { journals, selectedDate, setJournal } = useTaskStore();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(true);

  const timer     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const editorRef = useRef<HTMLDivElement>(null);

  // Init editor content when opened or date changes
  useEffect(() => {
    if (open && editorRef.current) {
      editorRef.current.innerHTML = journals[selectedDate] ?? "";
    }
    setSaved(true);
  }, [open, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  function scheduleSave() {
    clearTimeout(timer.current);
    setSaved(false);
    timer.current = setTimeout(() => {
      const html = editorRef.current?.innerHTML ?? "";
      setJournal(selectedDate, html === "<br>" ? "" : html);
      setSaved(true);
    }, 800);
  }

  // onMouseDown + e.preventDefault() keeps the editor selection alive
  // so execCommand operates on the right text
  function cmd(command: string) {
    document.execCommand(command, false);
    editorRef.current?.focus();
    scheduleSave();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    // Auto-link any URLs in pasted content
    const html = text.replace(
      /(https?:\/\/[^\s]+)/g,
      `<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--color-accent);text-decoration:underline;text-underline-offset:2px;">$1</a>`,
    );
    document.execCommand("insertHTML", false, html);
  }

  const storedHtml = journals[selectedDate] ?? "";
  const plainText  = storedHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount  = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const hasContent = plainText.length > 0;

  return (
    <div className="border-b border-ruled/60">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-3 hover:bg-binding/10 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint flex-1 text-left">
          daily note
        </span>
        {hasContent && !open && (
          <span className="font-mono text-[9px] text-ink-faint truncate max-w-[300px] text-right">
            {plainText.slice(0, 60)}{plainText.length > 60 ? "…" : ""}
          </span>
        )}
        {!hasContent && !open && (
          <span className="font-mono text-[9px] text-ink-faint/50 italic">click to write…</span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-faint transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 pt-1 flex flex-col gap-2">

              {/* Toolbar */}
              <div className="flex items-center gap-0.5 border-b border-ruled/40 pb-2">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); cmd("bold"); }}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors font-bold text-sm"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); cmd("italic"); }}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors italic text-sm"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); cmd("insertUnorderedList"); }}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors"
                  title="Bullet list"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* WYSIWYG editor */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={scheduleSave}
                onPaste={handlePaste}
                data-placeholder="What's on your mind today? Paste a URL and it becomes a link."
                className={[
                  "min-h-[96px] max-h-[60vh] overflow-y-auto",
                  "text-sm text-ink leading-relaxed outline-none",
                  // Placeholder via CSS
                  "empty:before:content-[attr(data-placeholder)]",
                  "empty:before:text-ink-faint/50 empty:before:italic empty:before:pointer-events-none",
                  // Style child elements produced by execCommand
                  "[&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-0.5",
                  "[&_li]:leading-relaxed",
                  "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:opacity-75",
                ].join(" ")}
              />

              {/* Footer */}
              <div className="flex items-center gap-3 mt-1">
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
