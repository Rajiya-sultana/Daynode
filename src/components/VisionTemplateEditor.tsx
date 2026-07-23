"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, ChevronLeft, Check, Type } from "lucide-react";
import { nanoid } from "nanoid";
import { TEMPLATES, type TemplateDef, type SlotDef } from "@/data/visionTemplates";
import type { VisionItem } from "@/store/taskStore";

interface FilledSlot { type: "image" | "text" | "word"; content: string }
type FilledSlots = Record<string, FilledSlot>;

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // % of template width
  y: number; // % of template height
}

/* ═══ Public component ═══════════════════════════════════════════ */
export default function VisionTemplateEditor({
  onSave,
  onClose,
  initialTemplateId,
  initialFilled,
  initialOverlays,
}: {
  onSave: (item: Omit<VisionItem, "id" | "createdAt">) => void;
  onClose: () => void;
  initialTemplateId?: string;
  initialFilled?: FilledSlots;
  initialOverlays?: TextOverlay[];
}) {
  const initTemplate = initialTemplateId ? (TEMPLATES.find(t => t.id === initialTemplateId) ?? null) : null;
  const [step, setStep]         = useState<"pick" | "fill">(initTemplate ? "fill" : "pick");
  const [template, setTemplate] = useState<TemplateDef | null>(initTemplate);
  const [filled, setFilled]     = useState<FilledSlots>(initialFilled ?? {});
  const [overlays, setOverlays] = useState<TextOverlay[]>(initialOverlays ?? []);

  // slot editing
  const [editSlotId, setEditSlotId]   = useState<string | null>(null);
  const [editSlotText, setEditSlotText] = useState("");

  // overlay editing
  const [editOverlayId, setEditOverlayId]     = useState<string | null>(null);
  const [editOverlayText, setEditOverlayText] = useState("");

  const fileRef        = useRef<HTMLInputElement>(null);
  const activeSlotId   = useRef<string | null>(null);
  const templateRef    = useRef<HTMLDivElement>(null);
  const overlayDragRef = useRef<{
    id: string; startX: number; startY: number; origX: number; origY: number;
  } | null>(null);

  /* ── Pick template ── */
  function pickTemplate(t: TemplateDef) {
    setTemplate(t);
    if (!initialFilled) {
      const pre: FilledSlots = {};
      t.slots.forEach(s => {
        if (s.type !== "image" && s.placeholder) pre[s.id] = { type: s.type, content: s.placeholder };
      });
      setFilled(pre);
    }
    setStep("fill");
  }

  /* ── Image slot ── */
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

  /* ── Text slot ── */
  function openSlotEdit(slot: SlotDef) {
    setEditSlotId(slot.id);
    setEditSlotText(filled[slot.id]?.content ?? slot.placeholder ?? "");
  }

  function saveSlotText() {
    if (!editSlotId || !template) return;
    const slot = template.slots.find(s => s.id === editSlotId)!;
    setFilled(prev => ({ ...prev, [editSlotId]: { type: slot.type, content: editSlotText } }));
    setEditSlotId(null);
  }

  /* ── Overlays ── */
  function addOverlay() {
    setOverlays(prev => [...prev, { id: nanoid(6), text: "Double-tap to edit", x: 8, y: 8 }]);
  }

  function deleteOverlay(id: string) {
    setOverlays(prev => prev.filter(o => o.id !== id));
    if (editOverlayId === id) setEditOverlayId(null);
  }

  function onOverlayPointerDown(e: React.PointerEvent, overlay: TextOverlay) {
    if (editOverlayId === overlay.id) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    overlayDragRef.current = {
      id: overlay.id, startX: e.clientX, startY: e.clientY,
      origX: overlay.x, origY: overlay.y,
    };
  }

  function onOverlayPointerMove(e: React.PointerEvent) {
    const ds = overlayDragRef.current;
    if (!ds || !templateRef.current) return;
    const rect = templateRef.current.getBoundingClientRect();
    const dx = ((e.clientX - ds.startX) / rect.width) * 100;
    const dy = ((e.clientY - ds.startY) / rect.height) * 100;
    setOverlays(prev => prev.map(o => o.id !== ds.id ? o : {
      ...o,
      x: Math.max(0, Math.min(82, ds.origX + dx)),
      y: Math.max(0, Math.min(90, ds.origY + dy)),
    }));
  }

  function onOverlayPointerUp() { overlayDragRef.current = null; }

  function openOverlayEdit(overlay: TextOverlay) {
    setEditOverlayId(overlay.id);
    setEditOverlayText(overlay.text);
  }

  function saveOverlayEdit() {
    if (!editOverlayId) return;
    setOverlays(prev => prev.map(o => o.id === editOverlayId ? { ...o, text: editOverlayText } : o));
    setEditOverlayId(null);
  }

  /* ── Save ── */
  function handleSave() {
    if (!template) return;
    onSave({
      type: "text",
      content: JSON.stringify({ templateId: template.id, filled, overlays }),
      cardStyle: "template",
      color: template.bg,
    });
    onClose();
  }

  const filledImageCount = template?.slots.filter(s => s.type === "image" && filled[s.id]).length ?? 0;
  const totalImageSlots  = template?.slots.filter(s => s.type === "image").length ?? 0;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const templateW = isMobile ? "100%" : "340px";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex flex-col"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 flex-wrap gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            {step === "fill" && (
              <button onClick={() => setStep("pick")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold text-white">{step === "pick" ? "Choose a template" : template?.name}</h2>
              {step === "fill" && (
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {filledImageCount}/{totalImageSlots} images · {overlays.length} text {overlays.length === 1 ? "box" : "boxes"}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === "fill" && (
              <>
                <button
                  onClick={addOverlay}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                >
                  <Type className="w-3.5 h-3.5" /> Add text box
                </button>
                <button
                  onClick={handleSave}
                  disabled={filledImageCount === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
                  style={{ background: "#e60023", color: "white" }}
                >
                  <Check className="w-3.5 h-3.5" /> Add to board
                </button>
              </>
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
            <div
              className="flex flex-col items-center py-6 px-4"
              onPointerMove={onOverlayPointerMove}
              onPointerUp={onOverlayPointerUp}
            >
              <p className="text-[11px] mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                Tap image slots to upload · tap text slots to edit · drag text boxes anywhere
              </p>

              {/* Template grid + overlays */}
              <div
                ref={templateRef}
                style={{
                  position: "relative",
                  width: templateW,
                  display: "grid",
                  gridTemplateAreas: template.areas,
                  gridTemplateColumns: `repeat(${template.cols}, 1fr)`,
                  gridAutoRows: `${template.rowH}px`,
                  gap: 3,
                  background: template.bg,
                  borderRadius: 16,
                  overflow: "visible",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
                }}
              >
                {/* Clip inner content */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden", pointerEvents: "none", zIndex: 0,
                  boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)`,
                }} />

                {/* Slots */}
                {template.slots.map(slot => {
                  const f = filled[slot.id];
                  const isEditing = editSlotId === slot.id;
                  return (
                    <div key={slot.id} style={{ gridArea: slot.id, position: "relative", overflow: "hidden", zIndex: 1, borderRadius: slot.id === template.slots[0].id ? "13px 0 0 0" : undefined }}>
                      {slot.type === "image" ? (
                        <button
                          onClick={() => triggerImageUpload(slot.id)}
                          className="w-full h-full flex flex-col items-center justify-center gap-1"
                          style={{ background: f ? "transparent" : "rgba(255,255,255,0.07)", border: f ? "none" : "1.5px dashed rgba(255,255,255,0.2)", cursor: "pointer" }}
                        >
                          {f ? (
                            <img src={f.content} alt="" className="w-full h-full object-cover" draggable={false} />
                          ) : (
                            <>
                              <ImagePlus style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)" }} />
                              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Tap to upload</span>
                            </>
                          )}
                          {f && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
                              <ImagePlus style={{ width: 18, height: 18, color: "white" }} />
                            </div>
                          )}
                        </button>
                      ) : (
                        <div className="w-full h-full" style={{ background: slot.bg ?? template.bg, cursor: "pointer", position: "relative" }}>
                          {isEditing ? (
                            <div className="absolute inset-0 z-10 flex flex-col p-2" style={{ background: slot.bg ?? template.bg }}>
                              <textarea
                                autoFocus value={editSlotText}
                                onChange={e => setEditSlotText(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveSlotText(); if (e.key === "Escape") setEditSlotId(null); }}
                                className="flex-1 bg-transparent outline-none resize-none text-xs leading-snug"
                                style={{ color: slot.textColor ?? template.textColor }}
                              />
                              <div className="flex gap-1.5 mt-1">
                                <button onClick={saveSlotText} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                                  <Check className="w-2.5 h-2.5" /> Save
                                </button>
                                <button onClick={() => setEditSlotId(null)} className="px-2 py-0.5 rounded text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openSlotEdit(slot)}
                              className="w-full h-full flex items-center justify-center p-3"
                              style={{ border: !filled[slot.id] ? "1.5px dashed rgba(255,255,255,0.15)" : "none", cursor: "text" }}
                            >
                              <span style={{
                                fontFamily: slot.fontFamily ?? (slot.type === "word" ? "Georgia, serif" : "inherit"),
                                fontSize: slot.textSize ?? 13, fontWeight: slot.textWeight ?? (slot.type === "word" ? 900 : 400),
                                color: slot.textColor ?? template.textColor, textAlign: slot.textAlign ?? "center",
                                textTransform: slot.uppercase ? "uppercase" : "none",
                                letterSpacing: slot.letterSpacing ?? (slot.uppercase ? "-0.02em" : "normal"),
                                lineHeight: slot.lineHeight ?? 1.3, fontStyle: slot.italic ? "italic" : "normal",
                                whiteSpace: "pre-wrap", wordBreak: "break-word", width: "100%",
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

                {/* Floating text overlays */}
                {overlays.map(overlay => (
                  <div
                    key={overlay.id}
                    onPointerDown={e => onOverlayPointerDown(e, overlay)}
                    onDoubleClick={() => openOverlayEdit(overlay)}
                    style={{
                      position: "absolute",
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      zIndex: 30,
                      cursor: editOverlayId === overlay.id ? "text" : "move",
                      userSelect: "none",
                    }}
                  >
                    <div style={{
                      background: "rgba(255,255,255,0.93)",
                      borderRadius: 10,
                      padding: "7px 12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.3)",
                      minWidth: 80, maxWidth: 220,
                      position: "relative",
                    }}>
                      {editOverlayId === overlay.id ? (
                        <textarea
                          autoFocus value={editOverlayText}
                          onChange={e => setEditOverlayText(e.target.value)}
                          onBlur={saveOverlayEdit}
                          onKeyDown={e => { if (e.key === "Escape") saveOverlayEdit(); }}
                          rows={2}
                          style={{
                            background: "transparent", border: "none", outline: "none", resize: "none",
                            fontSize: 13, color: "#1a1a1a", fontWeight: 600, width: 160,
                            lineHeight: 1.4, fontFamily: "inherit", cursor: "text",
                          }}
                          onClick={e => e.stopPropagation()}
                          onPointerDown={e => e.stopPropagation()}
                        />
                      ) : (
                        <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 600, lineHeight: 1.4, display: "block", whiteSpace: "pre-wrap" }}>
                          {overlay.text}
                        </span>
                      )}
                      {/* Delete */}
                      <button
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); deleteOverlay(overlay.id); }}
                        style={{
                          position: "absolute", top: -8, right: -8,
                          width: 20, height: 20, background: "#e60023", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", cursor: "pointer", border: "none",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        }}
                      >
                        <X style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] mt-5 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                Double-tap text boxes to edit · ⌘+Enter to save slot text
              </p>
            </div>
          ) : null}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══ Template picker ═════════════════════════════════════════════ */
function TemplatePicker({ onPick }: { onPick: (t: TemplateDef) => void }) {
  return (
    <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
      {TEMPLATES.map(t => (
        <motion.button
          key={t.id}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPick(t)}
          className="flex flex-col gap-2 text-left"
        >
          <div
            className="w-full rounded-2xl overflow-hidden shadow-xl"
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
                  background: s.type === "image" ? "rgba(255,255,255,0.12)" : s.bg ?? "rgba(255,255,255,0.06)",
                  borderRadius: 3,
                  display: "flex", alignItems: "center", justifyContent: "center",
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
          <div>
            <p className="text-xs font-semibold text-white flex items-center gap-1">{t.emoji} {t.name}</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{t.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

/* ═══ Template card renderer (board) ════════════════════════════ */
export function TemplateCard({
  item, onDelete, onEdit,
}: {
  item: import("@/store/taskStore").VisionItem;
  onDelete: () => void;
  onEdit: () => void;
}) {
  let templateId = "mosaic";
  let filled: FilledSlots = {};
  let overlays: TextOverlay[] = [];
  try {
    const parsed = JSON.parse(item.content);
    templateId = parsed.templateId;
    filled = parsed.filled ?? {};
    overlays = parsed.overlays ?? [];
  } catch { /* ignore */ }

  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  return (
    <div className="relative group">
      <div
        style={{
          width: "100%",
          position: "relative",
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
                f ? <img src={f.content} alt="" className="w-full h-full object-cover block" draggable={false} />
                  : <div className="w-full h-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3" style={{ background: slot.bg ?? template.bg }}>
                  <span style={{
                    fontFamily: slot.fontFamily ?? (slot.type === "word" ? "Georgia, serif" : "inherit"),
                    fontSize: slot.textSize ?? 13, fontWeight: slot.textWeight ?? (slot.type === "word" ? 900 : 400),
                    color: slot.textColor ?? template.textColor, textAlign: slot.textAlign ?? "center",
                    textTransform: slot.uppercase ? "uppercase" : "none",
                    letterSpacing: slot.letterSpacing ?? "normal", lineHeight: slot.lineHeight ?? 1.3,
                    fontStyle: slot.italic ? "italic" : "normal",
                    whiteSpace: "pre-wrap", wordBreak: "break-word", width: "100%",
                  }}>
                    {f?.content ?? slot.placeholder ?? ""}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Overlays */}
        {overlays.map(overlay => (
          <div
            key={overlay.id}
            style={{ position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`, zIndex: 20, pointerEvents: "none" }}
          >
            <div style={{
              background: "rgba(255,255,255,0.93)", borderRadius: 8, padding: "5px 9px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)", maxWidth: 180,
            }}>
              <span style={{ fontSize: 11, color: "#1a1a1a", fontWeight: 600, lineHeight: 1.4, display: "block", whiteSpace: "pre-wrap" }}>
                {overlay.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.55)", color: "white" }} title="Edit">
          <ImagePlus className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(230,0,35,0.7)", color: "white" }} title="Remove">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
