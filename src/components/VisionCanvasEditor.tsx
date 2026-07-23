"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, ImagePlus, Type, Check, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { nanoid } from "nanoid";
import type { VisionItem } from "@/store/taskStore";

export interface CanvasItem {
  id: string;
  type: "image" | "text";
  content: string;
  x: number;   // % of canvas width
  y: number;   // % of canvas height
  w: number;   // % of canvas width
  h: number;   // % of canvas height
  fontSize?: number;
  color?: string;
  bg?: string;
  bold?: boolean;
  italic?: boolean;
  zIndex: number;
}

const BG_OPTIONS = [
  { color: "#141414", label: "Black" },
  { color: "#ffffff", label: "White" },
  { color: "#f0ebe0", label: "Cream" },
  { color: "#0f0c29", label: "Dark purple" },
  { color: "#0d1f0d", label: "Forest" },
  { color: "#fff0f3", label: "Pink" },
  { color: "#1a1410", label: "Moody" },
  { color: "#0a1628", label: "Navy" },
];

const TEXT_COLORS = ["#ffffff", "#1a1a1a", "#FFE066", "#f87171", "#a8f0b4", "#93c5fd", "#f0a057", "#d4c5a9"];
const TEXT_BG_OPTIONS = [
  { color: "rgba(255,255,255,0.92)", label: "White" },
  { color: "rgba(0,0,0,0.75)", label: "Black" },
  { color: "rgba(255,224,102,0.85)", label: "Yellow" },
  { color: "rgba(168,240,180,0.85)", label: "Green" },
  { color: "transparent", label: "None" },
];

const FONT_SIZES = [11, 14, 17, 21, 27, 34, 44];

export default function VisionCanvasEditor({
  onSave,
  onClose,
  initialItems,
  initialBg,
}: {
  onSave: (item: Omit<VisionItem, "id" | "createdAt">) => void;
  onClose: () => void;
  initialItems?: CanvasItem[];
  initialBg?: string;
}) {
  const [items, setItems]         = useState<CanvasItem[]>(initialItems ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editText, setEditText]   = useState("");
  const [canvasBg, setCanvasBg]   = useState(initialBg ?? "#141414");

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const dragRef   = useRef<{
    itemId: string;
    mode: "move" | "resize";
    startX: number; startY: number;
    origX: number; origY: number;
    origW: number; origH: number;
  } | null>(null);

  const selected = items.find(i => i.id === selectedId) ?? null;
  const maxZ = items.reduce((m, i) => Math.max(m, i.zIndex), 0);

  /* ── Add items ── */
  function addTextBox() {
    const id = nanoid(8);
    setItems(prev => [...prev, {
      id, type: "text", content: "Double-click to edit",
      x: 10, y: 15, w: 60, h: 12,
      fontSize: 16, color: "#1a1a1a", bg: "rgba(255,255,255,0.92)",
      bold: false, italic: false, zIndex: maxZ + 1,
    }]);
    setSelectedId(id);
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const id = nanoid(8);
      setItems(prev => [...prev, {
        id, type: "image", content: ev.target?.result as string,
        x: 5, y: 5, w: 90, h: 55, zIndex: maxZ + 1,
      }]);
      setSelectedId(id);
    };
    r.readAsDataURL(file);
    e.target.value = "";
  }

  /* ── Selection + updates ── */
  function deleteSelected() {
    if (!selectedId) return;
    setItems(prev => prev.filter(i => i.id !== selectedId));
    setSelectedId(null);
  }

  function updateSelected(patch: Partial<CanvasItem>) {
    if (!selectedId) return;
    setItems(prev => prev.map(i => i.id === selectedId ? { ...i, ...patch } : i));
  }

  function bringToFront() { updateSelected({ zIndex: maxZ + 1 }); }
  function sendToBack() {
    const minZ = items.reduce((m, i) => Math.min(m, i.zIndex), Infinity);
    updateSelected({ zIndex: minZ - 1 });
  }

  /* ── Pointer drag ── */
  function onItemPointerDown(e: React.PointerEvent, item: CanvasItem, mode: "move" | "resize") {
    if (editingTextId === item.id) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    // bring to front on select
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, zIndex: maxZ + 1 } : i));
    setSelectedId(item.id);
    dragRef.current = {
      itemId: item.id, mode,
      startX: e.clientX, startY: e.clientY,
      origX: item.x, origY: item.y,
      origW: item.w, origH: item.h,
    };
  }

  function onCanvasPointerMove(e: React.PointerEvent) {
    const ds = dragRef.current;
    if (!ds || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - ds.startX) / rect.width) * 100;
    const dy = ((e.clientY - ds.startY) / rect.height) * 100;
    setItems(prev => prev.map(i => {
      if (i.id !== ds.itemId) return i;
      if (ds.mode === "move") {
        return { ...i, x: Math.max(0, Math.min(96, ds.origX + dx)), y: Math.max(0, Math.min(96, ds.origY + dy)) };
      }
      return { ...i, w: Math.max(8, ds.origW + dx), h: Math.max(5, ds.origH + dy) };
    }));
  }

  function onCanvasPointerUp() { dragRef.current = null; }

  /* ── Text edit ── */
  function openTextEdit(item: CanvasItem) {
    if (item.type !== "text") return;
    setEditingTextId(item.id);
    setEditText(item.content);
  }

  function saveTextEdit() {
    if (!editingTextId) return;
    setItems(prev => prev.map(i => i.id === editingTextId ? { ...i, content: editText } : i));
    setEditingTextId(null);
  }

  /* ── Save ── */
  function handleSave() {
    onSave({
      type: "text",
      content: JSON.stringify({ items, bg: canvasBg }),
      cardStyle: "canvas",
      color: canvasBg,
    });
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[150] flex flex-col"
      style={{ background: "rgba(0,0,0,0.97)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 flex-wrap gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
            <ImagePlus className="w-3.5 h-3.5" /> Image
          </button>
          <button onClick={addTextBox} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
            <Type className="w-3.5 h-3.5" /> Text
          </button>
          {selected && (
            <>
              <div style={{ width: 1, background: "rgba(255,255,255,0.12)", height: 22, alignSelf: "center" }} />
              <button onClick={bringToFront} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
                <ChevronUp className="w-3.5 h-3.5" /> Front
              </button>
              <button onClick={sendToBack} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
                <ChevronDown className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={deleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(230,0,35,0.18)", color: "#f87171" }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Canvas bg */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>BG</span>
            {BG_OPTIONS.map(opt => (
              <button key={opt.color} onClick={() => setCanvasBg(opt.color)} title={opt.label} style={{
                width: 16, height: 16, borderRadius: "50%", background: opt.color, flexShrink: 0,
                border: canvasBg === opt.color ? "2px solid #e60023" : "1.5px solid rgba(255,255,255,0.2)",
              }} />
            ))}
          </div>
          <button onClick={handleSave} disabled={items.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
            style={{ background: "#e60023", color: "white" }}>
            <Check className="w-3.5 h-3.5" /> Add to board
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Text formatting toolbar (shown when text is selected and not editing) ── */}
      {selected?.type === "text" && editingTextId !== selected.id && (
        <div className="flex items-center gap-2 px-4 py-2 flex-wrap flex-shrink-0" style={{ background: "rgba(8,8,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Font size */}
          <div className="flex items-center gap-0.5">
            {FONT_SIZES.map(size => (
              <button key={size} onClick={() => updateSelected({ fontSize: size })} style={{
                fontSize: 10, fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                color: selected.fontSize === size ? "#e60023" : "rgba(255,255,255,0.4)",
                background: selected.fontSize === size ? "rgba(230,0,35,0.15)" : "transparent",
              }}>
                {size}
              </button>
            ))}
          </div>

          <div style={{ width: 1, background: "rgba(255,255,255,0.1)", height: 20, flexShrink: 0 }} />

          {/* Bold / Italic */}
          <button onClick={() => updateSelected({ bold: !selected.bold })} style={{
            fontWeight: 800, fontSize: 13, padding: "2px 7px", borderRadius: 4,
            color: selected.bold ? "#e60023" : "rgba(255,255,255,0.4)",
            background: selected.bold ? "rgba(230,0,35,0.15)" : "transparent",
          }}>B</button>
          <button onClick={() => updateSelected({ italic: !selected.italic })} style={{
            fontStyle: "italic", fontSize: 13, padding: "2px 7px", borderRadius: 4,
            color: selected.italic ? "#e60023" : "rgba(255,255,255,0.4)",
            background: selected.italic ? "rgba(230,0,35,0.15)" : "transparent",
          }}>I</button>

          <div style={{ width: 1, background: "rgba(255,255,255,0.1)", height: 20, flexShrink: 0 }} />

          {/* Text color */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>A</span>
            {TEXT_COLORS.map(c => (
              <button key={c} onClick={() => updateSelected({ color: c })} style={{
                width: 14, height: 14, borderRadius: "50%", background: c, flexShrink: 0,
                border: selected.color === c ? "2px solid white" : "1.5px solid rgba(255,255,255,0.2)",
              }} />
            ))}
          </div>

          <div style={{ width: 1, background: "rgba(255,255,255,0.1)", height: 20, flexShrink: 0 }} />

          {/* Text box background */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>BOX</span>
            {TEXT_BG_OPTIONS.map(opt => (
              <button key={opt.color} onClick={() => updateSelected({ bg: opt.color })} title={opt.label} style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                background: opt.color === "transparent" ? "transparent" : opt.color,
                border: selected.bg === opt.color ? "2px solid white" : "1.5px solid rgba(255,255,255,0.25)",
              }} />
            ))}
          </div>

          <button onClick={() => openTextEdit(selected)} style={{
            marginLeft: "auto", color: "rgba(255,255,255,0.45)", fontSize: 10,
            padding: "3px 9px", borderRadius: 6, background: "rgba(255,255,255,0.07)",
          }}>
            Edit text
          </button>
        </div>
      )}

      {/* ── Canvas ── */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center p-4"
        onClick={() => setSelectedId(null)}
      >
        <div
          ref={canvasRef}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onClick={e => e.stopPropagation()}
          style={{
            position: "relative",
            width: "min(100%, 480px)",
            aspectRatio: "3/4",
            background: canvasBg,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 8px 60px rgba(0,0,0,0.8)",
            transition: "background 0.25s",
          }}
        >
          {/* Items */}
          {items.map(item => {
            const isSel = selectedId === item.id;
            const isEditingThis = editingTextId === item.id;

            return (
              <div
                key={item.id}
                onPointerDown={e => onItemPointerDown(e, item, "move")}
                onDoubleClick={e => { e.stopPropagation(); openTextEdit(item); }}
                onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                style={{
                  position: "absolute",
                  left: `${item.x}%`, top: `${item.y}%`,
                  width: `${item.w}%`, height: `${item.h}%`,
                  zIndex: item.zIndex,
                  cursor: isEditingThis ? "text" : "move",
                  userSelect: "none",
                  outline: isSel && !isEditingThis ? "2px solid #e60023" : "none",
                  outlineOffset: 2,
                  borderRadius: item.type === "text" ? 8 : 4,
                  overflow: "hidden",
                }}
              >
                {item.type === "image" ? (
                  <img
                    src={item.content} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
                    draggable={false}
                  />
                ) : isEditingThis ? (
                  <div
                    style={{ width: "100%", height: "100%", background: item.bg, borderRadius: 8, display: "flex", flexDirection: "column", padding: "6px 10px" }}
                    onClick={e => e.stopPropagation()}
                    onPointerDown={e => e.stopPropagation()}
                  >
                    <textarea
                      autoFocus
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onBlur={saveTextEdit}
                      onKeyDown={e => { if (e.key === "Escape") saveTextEdit(); }}
                      style={{
                        flex: 1, background: "transparent", border: "none", outline: "none",
                        resize: "none", fontSize: item.fontSize, color: item.color,
                        fontWeight: item.bold ? 700 : 400, fontStyle: item.italic ? "italic" : "normal",
                        lineHeight: 1.4, cursor: "text", width: "100%",
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: "100%", height: "100%", background: item.bg ?? "transparent",
                    borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: item.bg && item.bg !== "transparent" ? "6px 10px" : "0",
                  }}>
                    <span style={{
                      fontSize: item.fontSize, color: item.color,
                      fontWeight: item.bold ? 700 : 400, fontStyle: item.italic ? "italic" : "normal",
                      lineHeight: 1.4, wordBreak: "break-word", textAlign: "center",
                      width: "100%", display: "block",
                    }}>
                      {item.content}
                    </span>
                  </div>
                )}

                {/* Resize handle */}
                {isSel && !isEditingThis && (
                  <div
                    onPointerDown={e => onItemPointerDown(e, item, "resize")}
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 22, height: 22, background: "#e60023",
                      cursor: "se-resize", borderRadius: "8px 0 4px 0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M2 7L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M5 7L7 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M7 7L7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {items.length === 0 && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, pointerEvents: "none",
            }}>
              <p style={{ color: "rgba(255,255,255,0.09)", fontSize: 15, fontFamily: "Georgia, serif", textAlign: "center", lineHeight: 1.6 }}>
                Add images &amp; text<br />to build your vision
              </p>
              <p style={{ color: "rgba(255,255,255,0.05)", fontSize: 11 }}>Use the buttons above ↑</p>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <p className="text-center pb-3 font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          Drag to move · corner handle to resize · double-click text to edit
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
    </motion.div>
  );
}

/* ═══ Canvas card renderer (board) ════════════════════════════ */
export function CanvasCard({
  item, onDelete, onEdit,
}: {
  item: import("@/store/taskStore").VisionItem;
  onDelete: () => void;
  onEdit: () => void;
}) {
  let items: CanvasItem[] = [];
  let bg = "#141414";
  try {
    const parsed = JSON.parse(item.content);
    items = parsed.items ?? [];
    bg = parsed.bg ?? "#141414";
  } catch { /* ignore */ }

  return (
    <div className="relative group">
      <div
        style={{
          width: "100%",
          aspectRatio: "3/4",
          background: bg,
          position: "relative",
          overflow: "hidden",
          transition: "background 0.2s",
        }}
      >
        {items.map(ci => (
          <div
            key={ci.id}
            style={{
              position: "absolute",
              left: `${ci.x}%`, top: `${ci.y}%`,
              width: `${ci.w}%`, height: `${ci.h}%`,
              zIndex: ci.zIndex,
              borderRadius: ci.type === "text" ? 8 : 4,
              overflow: "hidden",
            }}
          >
            {ci.type === "image" ? (
              <img src={ci.content} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
            ) : (
              <div style={{
                width: "100%", height: "100%", background: ci.bg ?? "transparent",
                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                padding: ci.bg && ci.bg !== "transparent" ? "4px 8px" : "0",
              }}>
                <span style={{
                  fontSize: ci.fontSize, color: ci.color,
                  fontWeight: ci.bold ? 700 : 400, fontStyle: ci.italic ? "italic" : "normal",
                  lineHeight: 1.4, wordBreak: "break-word", textAlign: "center",
                  width: "100%", display: "block",
                }}>
                  {ci.content}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.55)", color: "white" }} title="Edit canvas">
          <Type className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(230,0,35,0.7)", color: "white" }} title="Remove">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
