"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, ChevronLeft, Check } from "lucide-react";
import { TEMPLATES, type TemplateDef, type SlotDef } from "@/data/visionTemplates";
import type { VisionItem } from "@/store/taskStore";

interface FilledSlot { type: "image" | "text" | "word"; content: string }
type FilledSlots = Record<string, FilledSlot>;

/* ═══ Public component ═══════════════════════════════════════════ */
export default function VisionTemplateEditor({
  onSave,
  onClose,
}: {
  onSave: (item: Omit<VisionItem, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [step, setStep]           = useState<"pick" | "fill">("pick");
  const [template, setTemplate]   = useState<TemplateDef | null>(null);
  const [filled, setFilled]       = useState<FilledSlots>({});
  const [editSlotId, setEditSlotId] = useState<string | null>(null);
  const [editText, setEditText]   = useState("");

  const fileRef        = useRef<HTMLInputElement>(null);
  const activeSlotId   = useRef<string | null>(null);

  /* ── pick template ── */
  function pickTemplate(t: TemplateDef) {
    setTemplate(t);
    // pre-fill text/word slots with their placeholder text
    const pre: FilledSlots = {};
    t.slots.forEach(s => {
      if (s.type !== "image" && s.placeholder) pre[s.id] = { type: s.type, content: s.placeholder };
    });
    setFilled(pre);
    setStep("fill");
  }

  /* ── image slot click ── */
  function triggerImageUpload(slotId: string) {
    activeSlotId.current = slotId;
    fileRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeSlotId.current) return;
    const id = activeSlotId.current;
    const r = new FileReader();
    r.onload = ev => setFilled(prev => ({ ...prev, [id]: { type: "image", content: ev.target?.result as string } }));
    r.readAsDataURL(file);
    e.target.value = "";
  }

  /* ── text slot edit ── */
  function openTextEdit(slot: SlotDef) {
    setEditSlotId(slot.id);
    setEditText(filled[slot.id]?.content ?? slot.placeholder ?? "");
  }

  function saveText() {
    if (!editSlotId) return;
    const slot = template!.slots.find(s => s.id === editSlotId)!;
    setFilled(prev => ({ ...prev, [editSlotId]: { type: slot.type, content: editText } }));
    setEditSlotId(null);
  }

  /* ── save to board ── */
  function handleSave() {
    if (!template) return;
    onSave({
      type: "text",
      content: JSON.stringify({ templateId: template.id, filled }),
      cardStyle: "template",
      color: template.bg,
    });
    onClose();
  }

  const filledImageCount = template?.slots.filter(s => s.type === "image" && filled[s.id]).length ?? 0;
  const totalImageSlots  = template?.slots.filter(s => s.type === "image").length ?? 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex flex-col"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            {step === "fill" && (
              <button onClick={() => setStep("pick")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold text-white">{step === "pick" ? "Choose a template" : template?.name}</h2>
              {step === "fill" && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{filledImageCount}/{totalImageSlots} images filled</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === "fill" && (
              <button
                onClick={handleSave}
                disabled={filledImageCount === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
                style={{ background: "#e60023", color: "white" }}
              >
                <Check className="w-3.5 h-3.5" /> Add to board
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {step === "pick" ? (
            <TemplatePicker onPick={pickTemplate} />
          ) : template ? (
            <TemplateFiller
              template={template}
              filled={filled}
              editSlotId={editSlotId}
              editText={editText}
              onEditText={setEditText}
              onImageClick={triggerImageUpload}
              onTextClick={openTextEdit}
              onTextSave={saveText}
              onTextCancel={() => setEditSlotId(null)}
            />
          ) : null}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══ Template picker (6 thumbnail cards) ═══════════════════════ */
function TemplatePicker({ onPick }: { onPick: (t: TemplateDef) => void }) {
  return (
    <div className="p-5 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
      {TEMPLATES.map(t => (
        <motion.button
          key={t.id}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPick(t)}
          className="flex flex-col gap-2 text-left"
        >
          {/* Thumbnail */}
          <div
            className="w-full rounded-xl overflow-hidden"
            style={{
              aspectRatio: "9/14",
              display: "grid",
              gridTemplateAreas: t.areas,
              gridTemplateColumns: `repeat(${t.cols}, 1fr)`,
              gridAutoRows: "1fr",
              gap: 2,
              background: t.bg,
              padding: 3,
            }}
          >
            {t.slots.map(s => (
              <div
                key={s.id}
                style={{
                  gridArea: s.id,
                  background: s.type === "image"
                    ? "rgba(255,255,255,0.12)"
                    : s.bg ?? "rgba(255,255,255,0.06)",
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.type === "image" && <ImagePlus style={{ width: 10, height: 10, color: "rgba(255,255,255,0.3)" }} />}
                {s.type !== "image" && (
                  <span style={{ fontSize: 5, color: s.textColor ?? "rgba(255,255,255,0.5)", textAlign: "center", padding: "2px 3px", lineHeight: 1.2 }}>
                    {(s.placeholder ?? "").slice(0, 18)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Label */}
          <div>
            <p className="text-xs font-semibold text-white flex items-center gap-1">{t.emoji} {t.name}</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{t.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

/* ═══ Template filler (fill the slots) ══════════════════════════ */
function TemplateFiller({
  template, filled, editSlotId, editText, onEditText,
  onImageClick, onTextClick, onTextSave, onTextCancel,
}: {
  template: TemplateDef;
  filled: FilledSlots;
  editSlotId: string | null;
  editText: string;
  onEditText: (v: string) => void;
  onImageClick: (id: string) => void;
  onTextClick: (slot: SlotDef) => void;
  onTextSave: () => void;
  onTextCancel: () => void;
}) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const maxW = isMobile ? "100%" : "340px";

  return (
    <div className="flex flex-col items-center justify-start py-6 px-4">
      {/* Instruction */}
      <p className="text-[11px] mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
        Tap image slots to upload · tap text slots to edit
      </p>

      {/* Template grid */}
      <div
        style={{
          width: maxW,
          display: "grid",
          gridTemplateAreas: template.areas,
          gridTemplateColumns: `repeat(${template.cols}, 1fr)`,
          gridAutoRows: `${template.rowH}px`,
          gap: 3,
          background: template.bg,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        {template.slots.map(slot => {
          const f = filled[slot.id];
          const isEditing = editSlotId === slot.id;

          return (
            <div
              key={slot.id}
              style={{ gridArea: slot.id, position: "relative", overflow: "hidden" }}
            >
              {slot.type === "image" ? (
                /* ── Image slot ── */
                <button
                  onClick={() => onImageClick(slot.id)}
                  className="w-full h-full flex flex-col items-center justify-center gap-1"
                  style={{
                    background: f ? "transparent" : "rgba(255,255,255,0.07)",
                    border: f ? "none" : "1.5px dashed rgba(255,255,255,0.2)",
                    cursor: "pointer",
                  }}
                >
                  {f ? (
                    <img src={f.content} alt="" className="w-full h-full object-cover" draggable={false} />
                  ) : (
                    <>
                      <ImagePlus style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)" }} />
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Tap to upload</span>
                    </>
                  )}
                  {/* Re-upload overlay */}
                  {f && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <ImagePlus style={{ width: 18, height: 18, color: "white" }} />
                    </div>
                  )}
                </button>
              ) : (
                /* ── Text / word slot ── */
                <div
                  className="w-full h-full"
                  style={{ background: slot.bg ?? template.bg, cursor: "pointer", position: "relative" }}
                >
                  {isEditing ? (
                    /* Editing state */
                    <div className="absolute inset-0 z-10 flex flex-col p-2" style={{ background: slot.bg ?? template.bg }}>
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={e => onEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onTextSave(); if (e.key === "Escape") onTextCancel(); }}
                        className="flex-1 bg-transparent outline-none resize-none text-xs leading-snug"
                        style={{ color: slot.textColor ?? template.textColor }}
                      />
                      <div className="flex gap-1.5 mt-1">
                        <button onClick={onTextSave} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                          <Check className="w-2.5 h-2.5" /> Save
                        </button>
                        <button onClick={onTextCancel} className="px-2 py-0.5 rounded text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* Display state */
                    <button
                      onClick={() => onTextClick(slot)}
                      className="w-full h-full flex items-center justify-center p-3"
                      style={{
                        border: !filled[slot.id] ? "1.5px dashed rgba(255,255,255,0.15)" : "none",
                        cursor: "text",
                      }}
                    >
                      <span style={{
                        fontFamily: slot.fontFamily ?? (slot.type === "word" ? "Georgia, serif" : "inherit"),
                        fontSize: slot.textSize ?? 13,
                        fontWeight: slot.textWeight ?? (slot.type === "word" ? 900 : 400),
                        color: slot.textColor ?? template.textColor,
                        textAlign: slot.textAlign ?? "center",
                        textTransform: slot.uppercase ? "uppercase" : "none",
                        letterSpacing: slot.letterSpacing ?? (slot.uppercase ? "-0.02em" : "normal"),
                        lineHeight: slot.lineHeight ?? 1.3,
                        fontStyle: slot.italic ? "italic" : "normal",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        width: "100%",
                        opacity: filled[slot.id] ? 1 : 0.45,
                      }}>
                        {filled[slot.id]?.content ?? slot.placeholder ?? "Tap to edit"}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
        ⌘+Enter to save text edits
      </p>
    </div>
  );
}

/* ═══ Template card renderer (in the board) ═════════════════════ */
export function TemplateCard({
  item, onDelete, onEdit,
}: {
  item: import("@/store/taskStore").VisionItem;
  onDelete: () => void;
  onEdit: () => void;
}) {
  let templateId = "mosaic";
  let filled: FilledSlots = {};
  try {
    const parsed = JSON.parse(item.content);
    templateId = parsed.templateId;
    filled = parsed.filled ?? {};
  } catch { /* ignore */ }

  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  return (
    <div className="relative group">
      {/* Rendered grid */}
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateAreas: template.areas,
          gridTemplateColumns: `repeat(${template.cols}, 1fr)`,
          gridAutoRows: `${template.rowH}px`,
          gap: 2,
          background: template.bg,
        }}
      >
        {template.slots.map(slot => {
          const f = filled[slot.id];
          return (
            <div key={slot.id} style={{ gridArea: slot.id, overflow: "hidden", position: "relative" }}>
              {slot.type === "image" ? (
                f ? (
                  <img src={f.content} alt="" className="w-full h-full object-cover block" draggable={false} />
                ) : (
                  <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                )
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-3"
                  style={{ background: slot.bg ?? template.bg }}
                >
                  <span style={{
                    fontFamily: slot.fontFamily ?? (slot.type === "word" ? "Georgia, serif" : "inherit"),
                    fontSize: slot.textSize ?? 13,
                    fontWeight: slot.textWeight ?? (slot.type === "word" ? 900 : 400),
                    color: slot.textColor ?? template.textColor,
                    textAlign: slot.textAlign ?? "center",
                    textTransform: slot.uppercase ? "uppercase" : "none",
                    letterSpacing: slot.letterSpacing ?? "normal",
                    lineHeight: slot.lineHeight ?? 1.3,
                    fontStyle: slot.italic ? "italic" : "normal",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    width: "100%",
                  }}>
                    {f?.content ?? slot.placeholder ?? ""}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
          title="Edit template"
        >
          <ImagePlus className="w-3.5 h-3.5" />
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
