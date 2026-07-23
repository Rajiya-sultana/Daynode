"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { X, Plus, ImagePlus, Quote, ZoomIn, PenLine, Check, Type, LayoutTemplate, Layers } from "lucide-react";
import { useTaskStore, type VisionItem } from "@/store/taskStore";
import { TEMPLATES, type TemplateDef } from "@/data/visionTemplates";
import VisionCanvasEditor, { CanvasCard, type CanvasItem } from "@/components/VisionCanvasEditor";

/* ─── Life categories ────────────────────────────────────────────── */
export const CATEGORIES = [
  { id: "career",        label: "Career",        emoji: "💼" },
  { id: "finance",       label: "Finance",        emoji: "💰" },
  { id: "travel",        label: "Travel",         emoji: "✈️" },
  { id: "health",        label: "Health",         emoji: "💪" },
  { id: "relationships", label: "Relationships",  emoji: "❤️" },
  { id: "growth",        label: "Growth",         emoji: "🌱" },
  { id: "lifestyle",     label: "Lifestyle",      emoji: "✨" },
  { id: "experiences",   label: "Experiences",    emoji: "🎯" },
];

/* ─── Quote / word colour themes ─────────────────────────────────── */
const THEMES = [
  { bg: "#0f0c29", text: "#FFE066", accent: "#FFE066" },
  { bg: "#1a0533", text: "#e8b4f8", accent: "#c77dff" },
  { bg: "#0d1f0d", text: "#a8f0b4", accent: "#69e87c" },
  { bg: "#1f0d0d", text: "#f9b7b7", accent: "#f87171" },
  { bg: "#f5f0e8", text: "#1a1a1a", accent: "#1a1a1a" },
  { bg: "#0a1628", text: "#93c5fd", accent: "#60a5fa" },
];

type AddMode = "quote" | "word" | null;

/* ═══════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════ */
export default function VisionBoard() {
  const { visionBoard, addVisionItem, deleteVisionItem, updateVisionItem } = useTaskStore();

  /* Filter */
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  /* FAB */
  const [fabOpen, setFabOpen] = useState(false);

  /* Unified canvas/template editor state */
  const [pickerOpen,       setPickerOpen]       = useState(false);
  const [editorOpen,       setEditorOpen]       = useState(false);
  const [editorLayoutId,   setEditorLayoutId]   = useState<string | undefined>();
  const [editorInitItems,  setEditorInitItems]  = useState<CanvasItem[] | undefined>();
  const [editorInitBg,     setEditorInitBg]     = useState<string | undefined>();
  const [editingBoardId,   setEditingBoardId]   = useState<string | null>(null);

  /* Quote / word add */
  const [addMode,   setAddMode]   = useState<AddMode>(null);
  const [formText,  setFormText]  = useState("");
  const [formTheme, setFormTheme] = useState(0);
  const [formCat,   setFormCat]   = useState<string | undefined>();

  /* Note-on-image */
  const [noteId,   setNoteId]   = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  /* Category picker */
  const [catPickId, setCatPickId] = useState<string | null>(null);

  /* Lightbox */
  const [zoom, setZoom] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── derived ── */
  const displayed  = activeCategory ? visionBoard.filter(i => i.category === activeCategory) : visionBoard;
  const catCounts  = CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c.id] = visionBoard.filter(i => i.category === c.id).length;
    return acc;
  }, {});

  /* ── editor open helpers ── */
  function openPicker() {
    setPickerOpen(true);
    setFabOpen(false);
  }

  function openEditorFromTemplate(t: TemplateDef) {
    const freshItems = t.starterItems.map(i => ({ ...i }));
    setEditorInitItems(freshItems);
    setEditorInitBg(t.bg);
    setEditorLayoutId(`tmpl-card-${t.id}`);
    setEditingBoardId(null);
    setPickerOpen(false);
    setEditorOpen(true);
  }

  function openEditorBlank(fromPicker = false) {
    setEditorInitItems(undefined);
    setEditorInitBg(undefined);
    setEditorLayoutId(fromPicker ? "tmpl-card-blank" : undefined);
    setEditingBoardId(null);
    setPickerOpen(false);
    setEditorOpen(true);
  }

  function openEditorForEdit(boardItem: VisionItem) {
    let initItems: CanvasItem[] | undefined;
    let initBg: string | undefined;
    try {
      const parsed = JSON.parse(boardItem.content ?? "{}");
      initItems = parsed.items;
      initBg    = parsed.bg;
    } catch { /* ignore */ }
    setEditorInitItems(initItems);
    setEditorInitBg(initBg);
    setEditorLayoutId(undefined);
    setEditingBoardId(boardItem.id);
    setEditorOpen(true);
  }

  function handleEditorSave(item: Omit<VisionItem, "id" | "createdAt">) {
    if (editingBoardId) {
      updateVisionItem(editingBoardId, { content: item.content, color: item.color });
    } else {
      addVisionItem(item);
    }
    setEditorOpen(false);
    setEditingBoardId(null);
  }

  /* ── image upload ── */
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(file => {
      const r = new FileReader();
      r.onload = ev => addVisionItem({ type: "image", content: ev.target?.result as string, cardStyle: "polaroid" });
      r.readAsDataURL(file);
    });
    e.target.value = "";
    setFabOpen(false);
  }

  /* ── text / word ── */
  function handleAddText() {
    if (!formText.trim()) return;
    const t = THEMES[formTheme];
    addVisionItem({
      type: "text", content: formText.trim(),
      color: JSON.stringify(t),
      cardStyle: addMode === "word" ? "word" : "clipping",
      category: formCat,
    });
    setFormText(""); setFormTheme(0); setFormCat(undefined); setAddMode(null);
  }

  function saveNote(id: string) {
    updateVisionItem(id, { label: noteText.trim() || undefined });
    setNoteId(null);
  }

  function toggleAchieved(item: VisionItem) {
    updateVisionItem(item.id, { achieved: !item.achieved });
  }

  /* ── empty state ── */
  if (visionBoard.length === 0 && !addMode) {
    return (
      <LayoutGroup>
        <div className="flex flex-col items-center justify-center gap-5" style={{ minHeight: "calc(100vh - 64px)", background: "#141414" }}>
          <p className="text-3xl font-bold" style={{ color: "rgba(255,255,255,0.06)", fontFamily: "Georgia, serif", letterSpacing: "-0.02em" }}>
            your vision starts here
          </p>
          <div className="flex gap-3">
            <Btn icon={<ImagePlus className="w-4 h-4" />} label="Add images"  onClick={() => fileRef.current?.click()} style={{ background: "#2a2a2a", color: "white" }} />
            <Btn icon={<Quote     className="w-4 h-4" />} label="Add quote"   onClick={() => setAddMode("quote")} style={{ background: "rgba(255,224,102,0.1)", color: "#FFE066", border: "1px solid rgba(255,224,102,0.2)" }} />
            <Btn icon={<Type      className="w-4 h-4" />} label="Add word"    onClick={() => setAddMode("word")}  style={{ background: "rgba(168,216,168,0.1)", color: "#a8f0b4", border: "1px solid rgba(168,216,168,0.2)" }} />
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <TextModal mode={addMode} text={formText} onText={setFormText} theme={formTheme} onTheme={setFormTheme} cat={formCat} onCat={setFormCat} onAdd={handleAddText} onClose={() => setAddMode(null)} />
        </div>

        {/* Picker / editor can also be opened from empty state FAB */}
        <AnimatePresence>
          {pickerOpen && (
            <TemplatePicker
              onTemplate={openEditorFromTemplate}
              onBlank={() => openEditorBlank(true)}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </AnimatePresence>
        {editorOpen && (
          <VisionCanvasEditor
            layoutId={editorLayoutId}
            initialItems={editorInitItems}
            initialBg={editorInitBg}
            onSave={handleEditorSave}
            onClose={() => { setEditorOpen(false); setEditingBoardId(null); }}
          />
        )}
      </LayoutGroup>
    );
  }

  return (
    <LayoutGroup>
      <div className="relative" style={{ background: "#141414", minHeight: "calc(100vh - 64px)" }}>

        {/* ── Category filter bar ── */}
        <div className="sticky top-0 z-30 flex items-center gap-2 px-4 py-3 overflow-x-auto"
          style={{ background: "rgba(20,20,20,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setActiveCategory(null)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{ background: activeCategory === null ? "white" : "rgba(255,255,255,0.08)", color: activeCategory === null ? "#141414" : "rgba(255,255,255,0.5)" }}>
            All
            <span className="text-[10px] opacity-60">{visionBoard.length}</span>
          </button>
          {CATEGORIES.map(c => {
            const count  = catCounts[c.id] ?? 0;
            const active = activeCategory === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCategory(active ? null : c.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: active ? "white" : "rgba(255,255,255,0.08)",
                  color: active ? "#141414" : "rgba(255,255,255,0.45)",
                  opacity: count === 0 && !active ? 0.4 : 1,
                }}>
                {c.emoji} {c.label}
                {count > 0 && <span className="text-[10px] opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* ── Masonry grid ── */}
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>
              No cards in {CATEGORIES.find(c => c.id === activeCategory)?.emoji} {CATEGORIES.find(c => c.id === activeCategory)?.label} yet
            </p>
            <button onClick={() => setActiveCategory(null)} className="text-xs underline" style={{ color: "rgba(255,255,255,0.3)" }}>Show all</button>
          </div>
        ) : (
          <div className="p-4 pb-28" style={{ columns: "3 260px", columnGap: "12px" }}>
            <AnimatePresence>
              {displayed.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  className="group relative mb-3 rounded-2xl overflow-hidden"
                  style={{ breakInside: "avoid" }}
                >
                  {item.cardStyle === "canvas"
                    ? <CanvasCard item={item} onDelete={() => deleteVisionItem(item.id)} onEdit={() => openEditorForEdit(item)} />
                    : item.cardStyle === "word"
                    ? <WordCard  item={item} onDelete={() => deleteVisionItem(item.id)} onToggleAchieved={() => toggleAchieved(item)} onCategoryPick={() => setCatPickId(item.id)} />
                    : item.type === "image"
                    ? <ImageCard
                        item={item}
                        onDelete={() => deleteVisionItem(item.id)}
                        onZoom={() => setZoom(item.content)}
                        onEditNote={() => { setNoteId(item.id); setNoteText(item.label ?? ""); }}
                        onToggleAchieved={() => toggleAchieved(item)}
                        onCategoryPick={() => setCatPickId(item.id)}
                        isEditingNote={noteId === item.id}
                        noteText={noteText}
                        onNoteChange={setNoteText}
                        onNoteSave={() => saveNote(item.id)}
                        onNoteCancel={() => setNoteId(null)}
                      />
                    : <QuoteCard item={item} onDelete={() => deleteVisionItem(item.id)} onToggleAchieved={() => toggleAchieved(item)} onCategoryPick={() => setCatPickId(item.id)} />
                  }
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── FAB backdrop ── */}
        {fabOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setFabOpen(false)} />
        )}

        {/* ── FAB ── */}
        <div className="fixed bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-2.5">
          <AnimatePresence>
            {fabOpen && (
              <>
                <FabItem key="img"      label="Add image"   color="#2a2a2a"  textColor="white"    icon={<ImagePlus      className="w-4 h-4" />} delay={0}    onClick={() => { fileRef.current?.click(); setFabOpen(false); }} />
                <FabItem key="quote"    label="Add quote"   color="#FFE066"  textColor="#141414"  icon={<Quote          className="w-4 h-4" />} delay={0.07} onClick={() => { setAddMode("quote"); setFabOpen(false); }} />
                <FabItem key="word"     label="Power word"  color="#a8f0b4"  textColor="#0d1f0d"  icon={<Type           className="w-4 h-4" />} delay={0.14} onClick={() => { setAddMode("word");  setFabOpen(false); }} />
                <FabItem key="template" label="Template"    color="#c084fc"  textColor="#1a0533"  icon={<LayoutTemplate className="w-4 h-4" />} delay={0.21} onClick={openPicker} />
                <FabItem key="canvas"   label="Free canvas" color="#38bdf8"  textColor="#0c1a2e"  icon={<Layers         className="w-4 h-4" />} delay={0.28} onClick={() => { openEditorBlank(false); setFabOpen(false); }} />
              </>
            )}
          </AnimatePresence>
          <motion.button
            onClick={() => setFabOpen(v => !v)}
            whileTap={{ scale: 0.92 }}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: "#e60023", color: "white" }}
          >
            <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.18 }}>
              <Plus className="w-5 h-5" />
            </motion.div>
          </motion.button>
        </div>

        {/* ── Add text/word modal ── */}
        <TextModal mode={addMode} text={formText} onText={setFormText} theme={formTheme} onTheme={setFormTheme} cat={formCat} onCat={setFormCat} onAdd={handleAddText} onClose={() => setAddMode(null)} />

        {/* ── Category picker modal ── */}
        <CategoryPickerModal
          open={catPickId !== null}
          current={visionBoard.find(i => i.id === catPickId)?.category}
          onPick={cat => { if (catPickId) updateVisionItem(catPickId, { category: cat }); setCatPickId(null); }}
          onClose={() => setCatPickId(null)}
        />

        {/* ── Lightbox ── */}
        <AnimatePresence>
          {zoom && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-8"
              style={{ background: "rgba(0,0,0,0.93)" }}
              onClick={() => setZoom(null)}
            >
              <motion.img src={zoom} initial={{ scale: 0.88 }} animate={{ scale: 1 }} exit={{ scale: 0.88 }}
                className="max-w-full max-h-full rounded-2xl" style={{ boxShadow: "0 0 80px rgba(0,0,0,0.9)" }} draggable={false} />
              <button className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)", color: "white" }} onClick={() => setZoom(null)}>
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      {/* ── Template picker (full-screen) ── */}
      <AnimatePresence>
        {pickerOpen && (
          <TemplatePicker
            onTemplate={openEditorFromTemplate}
            onBlank={() => openEditorBlank(true)}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Canvas/template editor ── */}
      {editorOpen && (
        <VisionCanvasEditor
          layoutId={editorLayoutId}
          initialItems={editorInitItems}
          initialBg={editorInitBg}
          onSave={handleEditorSave}
          onClose={() => { setEditorOpen(false); setEditingBoardId(null); }}
        />
      )}
    </LayoutGroup>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Template Picker
═══════════════════════════════════════════════════════════════════ */
function TemplatePicker({
  onTemplate, onBlank, onClose,
}: {
  onTemplate: (t: TemplateDef) => void;
  onBlank: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      key="picker"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex flex-col"
      style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(8px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <h2 style={{ color: "white", fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 700 }}>Choose a template</h2>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 2 }}>Every element is fully editable after you pick</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>

          {/* Blank canvas tile */}
          <motion.button
            layoutId="tmpl-card-blank"
            onClick={onBlank}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              aspectRatio: "3/4", background: "#181818",
              borderRadius: 12, overflow: "hidden", position: "relative",
              border: "1px dashed rgba(255,255,255,0.14)", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Plus style={{ width: 20, height: 20, color: "rgba(255,255,255,0.2)" }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600 }}>Blank canvas</span>
          </motion.button>

          {/* Template tiles */}
          {TEMPLATES.map(t => (
            <motion.button
              key={t.id}
              layoutId={`tmpl-card-${t.id}`}
              onClick={() => onTemplate(t)}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                aspectRatio: "3/4", background: t.bg,
                borderRadius: 12, overflow: "hidden", position: "relative",
                cursor: "pointer", display: "block", padding: 0, border: "none",
              }}
            >
              {/* Mini canvas preview */}
              {t.starterItems.map(ci => (
                <div key={ci.id} style={{
                  position: "absolute",
                  left: `${ci.x}%`, top: `${ci.y}%`,
                  width: `${ci.w}%`, height: `${ci.h}%`,
                  background: ci.type === "image"
                    ? "rgba(255,255,255,0.11)"
                    : (ci.bg && ci.bg !== "transparent" ? ci.bg : "rgba(255,255,255,0.07)"),
                  borderRadius: 3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {ci.type === "text" && ci.content && (
                    <span style={{
                      fontSize: Math.min((ci.fontSize ?? 12) * 0.22, 5.5),
                      color: ci.color, fontWeight: ci.bold ? 700 : 400,
                      textAlign: "center", padding: "1px 2px",
                      lineHeight: 1.2, display: "block", width: "100%",
                    }}>
                      {ci.content.substring(0, 18)}
                    </span>
                  )}
                </div>
              ))}

              {/* Label */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "8px 7px 7px",
                background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
              }}>
                <p style={{ color: "white", fontSize: 10, fontWeight: 700, textAlign: "left" }}>{t.emoji} {t.name}</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, marginTop: 1 }}>{t.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card components
═══════════════════════════════════════════════════════════════════ */

function AchievedOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: "rgba(0,0,0,0.42)", zIndex: 5 }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.92)", boxShadow: "0 0 0 5px rgba(34,197,94,0.25)" }}>
        <Check className="w-7 h-7 text-white" strokeWidth={3} />
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category?: string }) {
  const cat = CATEGORIES.find(c => c.id === category);
  if (!cat) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)" }}>
      {cat.emoji} {cat.label}
    </span>
  );
}

function CardBtn({ onClick, title, children, style }: { onClick: () => void; title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} title={title}
      className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ background: "rgba(0,0,0,0.55)", color: "white", ...style }}>
      {children}
    </button>
  );
}

/* ─── Image card ─────────────────────────────────────────────────── */
function ImageCard({ item, onDelete, onZoom, onEditNote, onToggleAchieved, onCategoryPick, isEditingNote, noteText, onNoteChange, onNoteSave, onNoteCancel }: {
  item: VisionItem; onDelete: () => void; onZoom: () => void; onEditNote: () => void;
  onToggleAchieved: () => void; onCategoryPick: () => void;
  isEditingNote: boolean; noteText: string; onNoteChange: (v: string) => void;
  onNoteSave: () => void; onNoteCancel: () => void;
}) {
  return (
    <div className="relative select-none">
      <img src={item.content} alt="" className="w-full h-auto block" draggable={false} onDoubleClick={onZoom}
        style={{ filter: item.achieved ? "brightness(0.6)" : "none", transition: "filter 0.3s" }} />

      {item.achieved && <AchievedOverlay />}

      {!isEditingNote && item.label && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }}>
          <p className="text-white text-sm leading-snug">{item.label}</p>
        </div>
      )}

      {isEditingNote && (
        <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)" }}>
          <textarea autoFocus value={noteText} onChange={e => onNoteChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onNoteSave(); } if (e.key === "Escape") onNoteCancel(); }}
            placeholder="Write a note on this image…" rows={2}
            className="w-full bg-transparent text-white text-sm placeholder:text-white/35 outline-none resize-none leading-snug" />
          <div className="flex gap-2 mt-1.5">
            <button onClick={onNoteSave} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,255,255,0.18)", color: "white" }}>
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={onNoteCancel} className="px-2.5 py-1 rounded-lg text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
        <CardBtn onClick={onZoom}     title="Zoom">           <ZoomIn  className="w-3.5 h-3.5" /></CardBtn>
        <CardBtn onClick={onEditNote} title="Add note">       <PenLine className="w-3.5 h-3.5" /></CardBtn>
        <CardBtn onClick={onDelete}   title="Remove" style={{ background: "rgba(230,0,35,0.7)" }}><X className="w-3.5 h-3.5" /></CardBtn>
      </div>

      <div className="absolute bottom-2.5 left-2.5 flex gap-1.5">
        <CardBtn onClick={onCategoryPick} title="Set category" style={{ background: "rgba(0,0,0,0.5)" }}>
          <span className="text-xs">{CATEGORIES.find(c => c.id === item.category)?.emoji ?? "📂"}</span>
        </CardBtn>
        <CardBtn onClick={onToggleAchieved} title={item.achieved ? "Mark as not achieved" : "Mark as achieved"}
          style={{ background: item.achieved ? "rgba(34,197,94,0.7)" : "rgba(0,0,0,0.5)" }}>
          <Check className="w-3.5 h-3.5" />
        </CardBtn>
      </div>

      {item.category && !isEditingNote && (
        <div className="absolute top-2.5 left-2.5">
          <CategoryBadge category={item.category} />
        </div>
      )}
    </div>
  );
}

/* ─── Quote card ─────────────────────────────────────────────────── */
function QuoteCard({ item, onDelete, onToggleAchieved, onCategoryPick }: {
  item: VisionItem; onDelete: () => void; onToggleAchieved: () => void; onCategoryPick: () => void;
}) {
  let theme = THEMES[0];
  try { if (item.color) theme = JSON.parse(item.color); } catch { /* default */ }

  return (
    <div className="relative px-6 py-8 min-h-[140px] flex flex-col justify-center"
      style={{ background: theme.bg, filter: item.achieved ? "brightness(0.65)" : "none", transition: "filter 0.3s" }}>
      {item.achieved && <AchievedOverlay />}
      <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full" style={{ background: theme.accent, opacity: 0.6 }} />
      <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: item.content.length > 60 ? 18 : item.content.length > 30 ? 22 : 28, fontWeight: 700, lineHeight: 1.3, color: theme.text, letterSpacing: "-0.01em" }}>
        {item.content}
      </p>
      {item.label && (
        <p className="mt-3 text-xs italic" style={{ color: theme.accent, opacity: 0.65, fontFamily: "Georgia, serif" }}>— {item.label}</p>
      )}
      {item.category && <div className="mt-3"><CategoryBadge category={item.category} /></div>}
      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
        <CardBtn onClick={onCategoryPick} title="Set category" style={{ background: "rgba(255,255,255,0.1)" }}>
          <span className="text-xs">{CATEGORIES.find(c => c.id === item.category)?.emoji ?? "📂"}</span>
        </CardBtn>
        <CardBtn onClick={onToggleAchieved} title={item.achieved ? "Mark not achieved" : "Mark achieved"} style={{ background: item.achieved ? "rgba(34,197,94,0.6)" : "rgba(255,255,255,0.1)" }}>
          <Check className="w-3.5 h-3.5" />
        </CardBtn>
        <CardBtn onClick={onDelete} title="Remove" style={{ background: "rgba(230,0,35,0.6)" }}>
          <X className="w-3.5 h-3.5" />
        </CardBtn>
      </div>
    </div>
  );
}

/* ─── Word card ──────────────────────────────────────────────────── */
function WordCard({ item, onDelete, onToggleAchieved, onCategoryPick }: {
  item: VisionItem; onDelete: () => void; onToggleAchieved: () => void; onCategoryPick: () => void;
}) {
  let theme = THEMES[0];
  try { if (item.color) theme = JSON.parse(item.color); } catch { /* default */ }
  const words    = item.content.trim().split(/\s+/).length;
  const fontSize = words === 1 ? 64 : words === 2 ? 44 : 32;

  return (
    <div className="relative flex flex-col items-center justify-center py-10 px-6 min-h-[160px]"
      style={{ background: theme.bg, filter: item.achieved ? "brightness(0.65)" : "none", transition: "filter 0.3s" }}>
      {item.achieved && <AchievedOverlay />}
      <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", textTransform: "uppercase", textAlign: "center", color: theme.text }}>
        {item.content}
      </p>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${theme.accent}18 0%, transparent 70%)` }} />
      {item.category && <div className="mt-4 relative z-10"><CategoryBadge category={item.category} /></div>}
      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
        <CardBtn onClick={onCategoryPick} title="Set category" style={{ background: "rgba(255,255,255,0.1)" }}>
          <span className="text-xs">{CATEGORIES.find(c => c.id === item.category)?.emoji ?? "📂"}</span>
        </CardBtn>
        <CardBtn onClick={onToggleAchieved} title={item.achieved ? "Mark not achieved" : "Mark achieved"} style={{ background: item.achieved ? "rgba(34,197,94,0.6)" : "rgba(255,255,255,0.1)" }}>
          <Check className="w-3.5 h-3.5" />
        </CardBtn>
        <CardBtn onClick={onDelete} title="Remove" style={{ background: "rgba(230,0,35,0.6)" }}>
          <X className="w-3.5 h-3.5" />
        </CardBtn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Modals
═══════════════════════════════════════════════════════════════════ */

function TextModal({ mode, text, onText, theme, onTheme, cat, onCat, onAdd, onClose }: {
  mode: AddMode; text: string; onText: (v: string) => void;
  theme: number; onTheme: (i: number) => void;
  cat: string | undefined; onCat: (v: string | undefined) => void;
  onAdd: () => void; onClose: () => void;
}) {
  const t       = THEMES[theme];
  const isWord  = mode === "word";
  const words   = text.trim().split(/\s+/).length;
  const previewSize = isWord ? (words === 1 ? 52 : words === 2 ? 36 : 26) : (text.length > 60 ? 18 : text.length > 30 ? 22 : 28);

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.3 }}
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center py-10 px-8 min-h-[140px] transition-colors duration-200" style={{ background: t.bg }}>
              {!isWord && <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full" style={{ background: t.accent, opacity: 0.6 }} />}
              {isWord && <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${t.accent}18 0%, transparent 70%)` }} />}
              <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: previewSize, fontWeight: isWord ? 900 : 700, lineHeight: isWord ? 1.05 : 1.3, letterSpacing: isWord ? "-0.03em" : "-0.01em", textTransform: isWord ? "uppercase" : "none", textAlign: isWord ? "center" : "left", color: t.text, width: "100%" }}>
                {text || <span style={{ opacity: 0.2 }}>{isWord ? "WORD" : "your quote…"}</span>}
              </p>
            </div>
            <div className="p-5" style={{ background: "#1a1a1a" }}>
              <textarea
                autoFocus value={text} onChange={e => onText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onAdd(); }}
                placeholder={isWord ? "One word or short phrase (e.g. FREEDOM)" : "Write your quote or affirmation…"}
                rows={isWord ? 1 : 3}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/22 outline-none resize-none leading-relaxed border-b pb-1"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
              <div className="flex items-center gap-3 mt-4">
                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Theme</span>
                <div className="flex gap-2">
                  {THEMES.map((th, i) => (
                    <button key={i} onClick={() => onTheme(i)} style={{ width: 20, height: 20, background: th.bg, borderRadius: "50%", border: theme === i ? `2px solid ${th.accent}` : "2px solid rgba(255,255,255,0.1)", transform: theme === i ? "scale(1.3)" : "scale(1)", transition: "transform 0.15s" }} />
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-mono uppercase tracking-widest block mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Life category (optional)</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => onCat(cat === c.id ? undefined : c.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all"
                      style={{ background: cat === c.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)", color: cat === c.id ? "white" : "rgba(255,255,255,0.38)", border: cat === c.id ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent" }}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)" }}>Cancel</button>
                <button onClick={onAdd} disabled={!text.trim()} className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30" style={{ background: "#e60023", color: "white" }}>Add to board</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CategoryPickerModal({ open, current, onPick, onClose }: {
  open: boolean; current?: string; onPick: (cat: string | undefined) => void; onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.93, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 12 }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.25 }}
            className="rounded-2xl p-5 w-72 shadow-2xl"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>Assign to category</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => onPick(current === c.id ? undefined : c.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
                  style={{ background: current === c.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)", color: current === c.id ? "white" : "rgba(255,255,255,0.5)", border: current === c.id ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent" }}>
                  <span className="text-base">{c.emoji}</span>
                  <span className="text-xs">{c.label}</span>
                  {current === c.id && <Check className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
            {current && (
              <button onClick={() => onPick(undefined)} className="w-full mt-3 py-2 rounded-xl text-xs" style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)" }}>
                Remove category
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Tiny helpers ───────────────────────────────────────────────── */
function Btn({ icon, label, onClick, style }: { icon: React.ReactNode; label: string; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all" style={style}>
      {icon} {label}
    </button>
  );
}

function FabItem({ label, color, textColor, icon, delay, onClick }: { label: string; color: string; textColor: string; icon: React.ReactNode; delay: number; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}
      transition={{ delay, duration: 0.15 }}
      onClick={onClick} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 pl-3 pr-4 h-10 rounded-full text-sm font-semibold shadow-xl"
      style={{ background: color, color: textColor, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
    >
      {icon} {label}
    </motion.button>
  );
}
