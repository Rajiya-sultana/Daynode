"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ImagePlus, Quote, ZoomIn, PenLine, Check, ChevronDown } from "lucide-react";
import { useTaskStore, type VisionItem } from "@/store/taskStore";

/* ─── Quote card colour presets ─────────────────────────────────── */
const QUOTE_THEMES = [
  { bg: "#0f0c29", text: "#FFE066", accent: "#FFE066" },   // Dark + gold
  { bg: "#1a0533", text: "#e8b4f8", accent: "#c77dff" },   // Purple night
  { bg: "#0d1f0d", text: "#a8f0b4", accent: "#69e87c" },   // Forest
  { bg: "#1f0d0d", text: "#f9b7b7", accent: "#f87171" },   // Rose dark
  { bg: "#f5f0e8", text: "#1a1a1a", accent: "#1a1a1a" },   // Paper white
  { bg: "#0a1628", text: "#93c5fd", accent: "#60a5fa" },   // Ocean
];

export default function VisionBoard() {
  const { visionBoard, addVisionItem, deleteVisionItem, updateVisionItem } = useTaskStore();

  /* FAB */
  const [fabOpen, setFabOpen]     = useState(false);

  /* Add quote form */
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [quoteTheme, setQuoteTheme] = useState(0);

  /* Note-on-image editing */
  const [noteId, setNoteId]       = useState<string | null>(null);
  const [noteText, setNoteText]   = useState("");

  /* Lightbox */
  const [zoom, setZoom]           = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── handlers ── */
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(file => {
      const r = new FileReader();
      r.onload = ev => addVisionItem({ type: "image", content: ev.target?.result as string, cardStyle: "polaroid" });
      r.readAsDataURL(file);
    });
    e.target.value = "";
    setFabOpen(false);
  }

  function addQuote() {
    if (!quoteText.trim()) return;
    const t = QUOTE_THEMES[quoteTheme];
    addVisionItem({ type: "text", content: quoteText.trim(), color: JSON.stringify(t), cardStyle: "clipping" });
    setQuoteText(""); setQuoteOpen(false); setFabOpen(false);
  }

  function saveNote(id: string) {
    updateVisionItem(id, { label: noteText.trim() || undefined });
    setNoteId(null);
  }

  /* ── Empty state ── */
  if (visionBoard.length === 0 && !quoteOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4" style={{ background: "#141414" }}>
        <p className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.08)", fontFamily: "Georgia, serif" }}>your vision starts here</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: "#3d3d3d" }}
          >
            <ImagePlus className="w-4 h-4" /> Add images
          </button>
          <button
            onClick={() => setQuoteOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: "rgba(255,224,102,0.12)", color: "#FFE066", border: "1px solid rgba(255,224,102,0.25)" }}
          >
            <Quote className="w-4 h-4" /> Add quote
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        <QuoteModal open={quoteOpen} text={quoteText} onText={setQuoteText} theme={quoteTheme} onTheme={setQuoteTheme} onAdd={addQuote} onClose={() => setQuoteOpen(false)} />
      </div>
    );
  }

  return (
    <div className="relative" style={{ background: "#141414", minHeight: "calc(100vh - 64px)" }}>

      {/* ── Pinterest masonry grid ── */}
      <div className="p-4 pb-24" style={{ columns: "3 260px", columnGap: "12px" }}>
        <AnimatePresence>
          {visionBoard.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.22 }}
              className="group relative mb-3 rounded-2xl overflow-hidden"
              style={{ breakInside: "avoid" }}
            >
              {item.type === "image"
                ? <ImageCard
                    item={item}
                    onDelete={() => deleteVisionItem(item.id)}
                    onZoom={() => setZoom(item.content)}
                    onEditNote={() => { setNoteId(item.id); setNoteText(item.label ?? ""); }}
                    isEditingNote={noteId === item.id}
                    noteText={noteText}
                    onNoteChange={setNoteText}
                    onNoteSave={() => saveNote(item.id)}
                    onNoteCancel={() => setNoteId(null)}
                  />
                : <QuoteCard item={item} onDelete={() => deleteVisionItem(item.id)} />
              }
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-2.5">
        <AnimatePresence>
          {fabOpen && (
            <>
              <motion.button
                key="img"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ delay: 0, duration: 0.15 }}
                onClick={() => { fileRef.current?.click(); setFabOpen(false); }}
                className="flex items-center gap-2.5 pl-3 pr-4 h-10 rounded-full text-white text-sm font-semibold shadow-xl"
                style={{ background: "#3d3d3d", whiteSpace: "nowrap" }}
              >
                <ImagePlus className="w-4 h-4" /> Add image
              </motion.button>
              <motion.button
                key="quote"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ delay: 0.07, duration: 0.15 }}
                onClick={() => { setQuoteOpen(true); setFabOpen(false); }}
                className="flex items-center gap-2.5 pl-3 pr-4 h-10 rounded-full text-sm font-semibold shadow-xl"
                style={{ background: "#FFE066", color: "#1a1a1a", whiteSpace: "nowrap" }}
              >
                <Quote className="w-4 h-4" /> Add quote
              </motion.button>
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setFabOpen(v => !v)}
          whileTap={{ scale: 0.92 }}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl"
          style={{ background: "#e60023", color: "white" }} /* pinterest red */
        >
          <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.18 }}>
            <Plus className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </div>

      {/* ── Add quote modal ── */}
      <QuoteModal
        open={quoteOpen}
        text={quoteText} onText={setQuoteText}
        theme={quoteTheme} onTheme={setQuoteTheme}
        onAdd={addQuote}
        onClose={() => setQuoteOpen(false)}
      />

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-8"
            style={{ background: "rgba(0,0,0,0.92)" }}
            onClick={() => setZoom(null)}
          >
            <motion.img
              src={zoom}
              initial={{ scale: 0.88 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.88 }}
              className="max-w-full max-h-full rounded-2xl"
              style={{ boxShadow: "0 0 80px rgba(0,0,0,0.9)" }}
              draggable={false}
            />
            <button
              className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
              onClick={() => setZoom(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
    </div>
  );
}

/* ─── Image card ─────────────────────────────────────────────────── */
function ImageCard({
  item, onDelete, onZoom, onEditNote,
  isEditingNote, noteText, onNoteChange, onNoteSave, onNoteCancel,
}: {
  item: VisionItem;
  onDelete: () => void;
  onZoom: () => void;
  onEditNote: () => void;
  isEditingNote: boolean;
  noteText: string;
  onNoteChange: (v: string) => void;
  onNoteSave: () => void;
  onNoteCancel: () => void;
}) {
  return (
    <div className="relative select-none">
      {/* Image */}
      <img
        src={item.content}
        alt=""
        className="w-full h-auto block"
        draggable={false}
        onDoubleClick={onZoom}
      />

      {/* Note overlay — always visible if note exists, editable on demand */}
      {isEditingNote ? (
        <div
          className="absolute bottom-0 left-0 right-0 p-3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)" }}
        >
          <textarea
            autoFocus
            value={noteText}
            onChange={e => onNoteChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onNoteSave(); } if (e.key === "Escape") onNoteCancel(); }}
            placeholder="Add a note on this image…"
            rows={2}
            className="w-full bg-transparent text-white text-sm placeholder:text-white/40 outline-none resize-none leading-snug"
          />
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={onNoteSave}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.18)", color: "white" }}
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={onNoteCancel}
              className="px-2.5 py-1 rounded-lg text-xs"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : item.label ? (
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
        >
          <p className="text-white text-sm leading-snug">{item.label}</p>
        </div>
      ) : null}

      {/* Hover actions */}
      <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onZoom}
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
          title="Zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onEditNote}
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
          title="Add note"
        >
          <PenLine className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: "rgba(230,0,35,0.7)", color: "white" }}
          title="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Quote card ─────────────────────────────────────────────────── */
function QuoteCard({ item, onDelete }: { item: VisionItem; onDelete: () => void }) {
  let theme = QUOTE_THEMES[0];
  try { if (item.color) theme = JSON.parse(item.color); } catch { /* use default */ }

  return (
    <div
      className="relative px-6 py-8 min-h-[140px] flex flex-col justify-center"
      style={{ background: theme.bg }}
    >
      <p
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: item.content.length > 60 ? 18 : item.content.length > 30 ? 22 : 28,
          fontWeight: 700,
          lineHeight: 1.3,
          color: theme.text,
          letterSpacing: "-0.01em",
        }}
      >
        {item.content}
      </p>
      {item.label && (
        <p
          className="mt-3 text-xs italic"
          style={{ color: theme.accent, opacity: 0.7, fontFamily: "Georgia, serif" }}
        >
          — {item.label}
        </p>
      )}

      {/* Accent line */}
      <div
        className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full"
        style={{ background: theme.accent, opacity: 0.6 }}
      />

      <button
        onClick={onDelete}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.7)" }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ─── Add Quote modal ────────────────────────────────────────────── */
function QuoteModal({
  open, text, onText, theme, onTheme, onAdd, onClose,
}: {
  open: boolean; text: string; onText: (v: string) => void;
  theme: number; onTheme: (i: number) => void;
  onAdd: () => void; onClose: () => void;
}) {
  const t = QUOTE_THEMES[theme];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.93, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.93, y: 16 }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.3 }}
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Live preview */}
            <div
              className="relative px-8 py-10 min-h-[140px] flex flex-col justify-center transition-colors duration-300"
              style={{ background: t.bg }}
            >
              <div
                className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full"
                style={{ background: t.accent, opacity: 0.6 }}
              />
              <p
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: text.length > 60 ? 18 : text.length > 30 ? 22 : 28,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: t.text,
                  letterSpacing: "-0.01em",
                  minHeight: 36,
                }}
              >
                {text || <span style={{ opacity: 0.25 }}>your quote here…</span>}
              </p>
            </div>

            {/* Form */}
            <div className="p-5" style={{ background: "#1e1e1e" }}>
              <textarea
                autoFocus
                value={text}
                onChange={e => onText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onAdd(); }}
                placeholder="Write your quote or affirmation…"
                rows={3}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none resize-none leading-relaxed border-b pb-1"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />

              {/* Theme picker */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Theme</span>
                <div className="flex gap-2">
                  {QUOTE_THEMES.map((th, i) => (
                    <button
                      key={i}
                      onClick={() => onTheme(i)}
                      style={{
                        width: 22, height: 22,
                        background: th.bg,
                        border: theme === i ? `2px solid ${th.accent}` : "2px solid transparent",
                        borderRadius: "50%",
                        boxShadow: theme === i ? `0 0 0 2px rgba(255,255,255,0.15)` : "none",
                        transform: theme === i ? "scale(1.25)" : "scale(1)",
                        transition: "transform 0.15s",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={onAdd}
                  disabled={!text.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
                  style={{ background: "#e60023", color: "white" }}
                >
                  Add to board
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
