"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, ChevronDown, Bold, Italic, List, Eye, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "@/store/taskStore";

/* ── Markdown renderer ───────────────────────────────────────────── */

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function processInline(raw: string) {
  return escapeHtml(raw)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /(https?:\/\/[^\s<"]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 hover:opacity-75 transition-opacity break-all">$1</a>',
    );
}

function renderMarkdown(text: string) {
  const lines   = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (!listItems.length) return;
    nodes.push(
      <ul key={key++} className="list-disc list-inside my-1 space-y-0.5">
        {listItems.map((item, i) => (
          <li
            key={i}
            className="text-sm text-ink leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processInline(item) }}
          />
        ))}
      </ul>,
    );
    listItems = [];
  }

  for (const line of lines) {
    if (/^[-*]\s/.test(line)) {
      listItems.push(line.slice(2));
    } else {
      flushList();
      if (line.trim()) {
        nodes.push(
          <p
            key={key++}
            className="text-sm text-ink leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processInline(line) }}
          />,
        );
      } else {
        nodes.push(<div key={key++} className="h-2" />);
      }
    }
  }
  flushList();
  return nodes;
}

/* ── Component ───────────────────────────────────────────────────── */

export default function DailyJournal() {
  const { journals, selectedDate, setJournal } = useTaskStore();
  const text = journals[selectedDate] ?? "";

  const [open, setOpen]       = useState(false);
  const [draft, setDraft]     = useState(text);
  const [saved, setSaved]     = useState(true);
  const [preview, setPreview] = useState(false);

  const timer       = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wordCount   = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  useEffect(() => {
    setDraft(journals[selectedDate] ?? "");
    setSaved(true);
    setPreview(false);
  }, [selectedDate, journals]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (draft === (journals[selectedDate] ?? "")) { setSaved(true); return; }
    setSaved(false);
    timer.current = setTimeout(() => { setJournal(selectedDate, draft); setSaved(true); }, 800);
    return () => clearTimeout(timer.current);
  }, [draft, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function wrapSelection(before: string, after = before) {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const selected = draft.slice(s, e);
    setDraft(draft.slice(0, s) + before + selected + after + draft.slice(e));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, e + before.length);
      autoGrow(el);
    }, 0);
  }

  function insertBullet() {
    const el = textareaRef.current;
    if (!el) return;
    const pos       = el.selectionStart;
    const lineStart = draft.lastIndexOf("\n", pos - 1) + 1;
    if (draft.slice(lineStart, lineStart + 2) === "- ") {
      const next = draft.slice(0, lineStart) + draft.slice(lineStart + 2);
      setDraft(next);
      setTimeout(() => { el.focus(); el.setSelectionRange(Math.max(lineStart, pos - 2), Math.max(lineStart, pos - 2)); autoGrow(el); }, 0);
    } else {
      const next = draft.slice(0, lineStart) + "- " + draft.slice(lineStart);
      setDraft(next);
      setTimeout(() => { el.focus(); el.setSelectionRange(pos + 2, pos + 2); autoGrow(el); }, 0);
    }
  }

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
            <div className="px-6 pb-4 pt-1 flex flex-col gap-2">

              {/* Toolbar */}
              <div className="flex items-center gap-0.5 border-b border-ruled/40 pb-2">
                <AnimatePresence initial={false}>
                  {!preview && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-0.5 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => wrapSelection("**")}
                        className="p-1.5 rounded hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors"
                        title="Bold — wrap selection in **"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => wrapSelection("_")}
                        className="p-1.5 rounded hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors"
                        title="Italic — wrap selection in _"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={insertBullet}
                        className="p-1.5 rounded hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors"
                        title="Bullet point — toggle on current line"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-4 bg-ruled/60 mx-1 flex-shrink-0" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => setPreview((v) => !v)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors font-mono text-[10px]"
                  title={preview ? "Back to editing" : "Preview rendered output"}
                >
                  {preview
                    ? <><Pencil className="w-3 h-3" /> Edit</>
                    : <><Eye className="w-3 h-3" /> Preview</>
                  }
                </button>
              </div>

              {/* Content */}
              {!preview ? (
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); autoGrow(e.target); }}
                  onFocus={(e) => autoGrow(e.target)}
                  placeholder={"What's on your mind today?\n\nTip: **bold**  _italic_  - bullet point  paste any URL"}
                  rows={4}
                  autoFocus
                  className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint/50 outline-none resize-none leading-relaxed overflow-y-auto"
                  style={{ maxHeight: "60vh" }}
                />
              ) : (
                <div className="min-h-[96px] max-h-[60vh] overflow-y-auto py-0.5 flex flex-col gap-0.5">
                  {draft.trim()
                    ? renderMarkdown(draft)
                    : <p className="text-sm text-ink-faint/50 italic">Nothing written yet.</p>
                  }
                </div>
              )}

              {/* Footer */}
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
