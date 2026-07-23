"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, ImagePlus, Type, Check, Trash2, ChevronUp, ChevronDown, Copy, RotateCcw } from "lucide-react";
import { nanoid } from "nanoid";
import type { VisionItem } from "@/store/taskStore";

/* ── Shared type (re-exported for VisionBoard + visionTemplates) ── */
export interface CanvasItem {
  id: string;
  type: "image" | "text";
  content: string;
  x: number;        // % of canvas width
  y: number;        // % of canvas height
  w: number;        // % of canvas width
  h: number;        // % of canvas height
  fontSize?: number;
  color?: string;
  bg?: string;
  bold?: boolean;
  italic?: boolean;
  rotation?: number; // degrees
  zIndex: number;
}

/* ── Constants ── */
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
  { color: "rgba(0,0,0,0.75)",       label: "Black" },
  { color: "rgba(255,224,102,0.85)", label: "Yellow" },
  { color: "rgba(168,240,180,0.85)", label: "Green" },
  { color: "transparent",            label: "None" },
];
const FONT_SIZES = [11, 14, 17, 21, 27, 34, 44];

/* ═══════════════════════════════════════════════════════════════════
   Editor component
═══════════════════════════════════════════════════════════════════ */
export default function VisionCanvasEditor({
  onSave,
  onClose,
  initialItems,
  initialBg,
  layoutId,
}: {
  onSave: (item: Omit<VisionItem, "id" | "createdAt">) => void;
  onClose: () => void;
  initialItems?: CanvasItem[];
  initialBg?: string;
  layoutId?: string;
}) {
  const [items,          setItems]          = useState<CanvasItem[]>(initialItems ?? []);
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [editingTextId,  setEditingTextId]  = useState<string | null>(null);
  const [editText,       setEditText]       = useState("");
  const [canvasBg,       setCanvasBg]       = useState(initialBg ?? "#141414");
  const [pendingImgId,   setPendingImgId]   = useState<string | null>(null);
  const [guideX,         setGuideX]         = useState(false);
  const [guideY,         setGuideY]         = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  /* dragRef holds drag state across pointer events */
  const dragRef = useRef<{
    itemId: string;
    mode: "move" | "resize" | "rotate";
    startX: number; startY: number;
    origX: number; origY: number; origW: number; origH: number;
    startAngle?: number; origRotation?: number;
  } | null>(null);

  /* duplicateRef keeps handleDuplicate fresh without re-registering listeners */
  const duplicateRef = useRef<() => void>(() => {});

  const selected = items.find(i => i.id === selectedId) ?? null;
  const maxZ     = items.reduce((m, i) => Math.max(m, i.zIndex), 0);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") { e.preventDefault(); duplicateRef.current(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* keep duplicateRef current */
  duplicateRef.current = () => {
    if (!selectedId) return;
    const src = items.find(i => i.id === selectedId);
    if (!src) return;
    const copy: CanvasItem = { ...src, id: nanoid(8), x: Math.min(92, src.x + 4), y: Math.min(92, src.y + 4), zIndex: maxZ + 1 };
    setItems(prev => [...prev, copy]);
    setSelectedId(copy.id);
  };

  /* ── Add items ── */
  function addTextBox() {
    const id = nanoid(8);
    setItems(prev => [...prev, {
      id, type: "text", content: "Double-click to edit",
      x: 10, y: 15, w: 60, h: 14,
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
      const url = ev.target?.result as string;
      if (pendingImgId) {
        setItems(prev => prev.map(i => i.id === pendingImgId ? { ...i, content: url } : i));
        setPendingImgId(null);
      } else {
        const id = nanoid(8);
        setItems(prev => [...prev, { id, type: "image", content: url, x: 5, y: 5, w: 90, h: 55, zIndex: maxZ + 1 }]);
        setSelectedId(id);
      }
    };
    r.readAsDataURL(file);
    e.target.value = "";
  }

  /* ── Selection ── */
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
  function sendToBack()   { updateSelected({ zIndex: items.reduce((m, i) => Math.min(m, i.zIndex), Infinity) - 1 }); }

  /* ── Pointer drag ── */
  function onItemPointerDown(e: React.PointerEvent, item: CanvasItem, mode: "move" | "resize" | "rotate") {
    if (editingTextId === item.id) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, zIndex: maxZ + 1 } : i));
    setSelectedId(item.id);

    if (mode === "rotate") {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + (item.x + item.w / 2) / 100 * rect.width;
      const cy = rect.top  + (item.y + item.h / 2) / 100 * rect.height;
      dragRef.current = {
        itemId: item.id, mode: "rotate",
        startX: e.clientX, startY: e.clientY,
        origX: item.x, origY: item.y, origW: item.w, origH: item.h,
        startAngle: Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI),
        origRotation: item.rotation ?? 0,
      };
    } else {
      dragRef.current = {
        itemId: item.id, mode,
        startX: e.clientX, startY: e.clientY,
        origX: item.x, origY: item.y, origW: item.w, origH: item.h,
      };
    }
  }

  function onCanvasPointerMove(e: React.PointerEvent) {
    const ds = dragRef.current;
    if (!ds || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    if (ds.mode === "rotate") {
      const item = items.find(i => i.id === ds.itemId);
      if (!item) return;
      const cx = rect.left + (item.x + item.w / 2) / 100 * rect.width;
      const cy = rect.top  + (item.y + item.h / 2) / 100 * rect.height;
      const ang = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      setItems(prev => prev.map(i => i.id === ds.itemId ? { ...i, rotation: (ds.origRotation ?? 0) + (ang - (ds.startAngle ?? 0)) } : i));
      return;
    }

    const dx = ((e.clientX - ds.startX) / rect.width)  * 100;
    const dy = ((e.clientY - ds.startY) / rect.height) * 100;

    if (ds.mode === "move") {
      const item = items.find(i => i.id === ds.itemId);
      const iw = item?.w ?? 0;
      const ih = item?.h ?? 0;
      let nx = Math.max(0, Math.min(96, ds.origX + dx));
      let ny = Math.max(0, Math.min(96, ds.origY + dy));
      const snapNowX = Math.abs(nx + iw / 2 - 50) < 2;
      const snapNowY = Math.abs(ny + ih / 2 - 50) < 2;
      if (snapNowX) nx = 50 - iw / 2;
      if (snapNowY) ny = 50 - ih / 2;
      setGuideX(snapNowX);
      setGuideY(snapNowY);
      setItems(prev => prev.map(i => i.id === ds.itemId ? { ...i, x: nx, y: ny } : i));
      return;
    }

    /* resize */
    setItems(prev => prev.map(i => i.id !== ds.itemId ? i : { ...i, w: Math.max(8, ds.origW + dx), h: Math.max(5, ds.origH + dy) }));
  }

  function onCanvasPointerUp() {
    dragRef.current = null;
    setGuideX(false);
    setGuideY(false);
  }

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
    onSave({ type: "text", content: JSON.stringify({ items, bg: canvasBg }), cardStyle: "canvas", color: canvasBg });
    onClose();
  }

  /* ═══════════════════════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════════════════════ */
  return (
    <motion.div
      layoutId={layoutId}
      initial={layoutId ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[150] flex flex-col"
      style={{ background: "rgba(0,0,0,0.97)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 flex-wrap gap-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setPendingImgId(null); fileRef.current?.click(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
            <ImagePlus className="w-3.5 h-3.5" /> Image
          </button>
          <button onClick={addTextBox}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
            <Type className="w-3.5 h-3.5" /> Text
          </button>

          {selected && (
            <>
              <div style={{ width: 1, background: "rgba(255,255,255,0.12)", height: 22, alignSelf: "center" }} />
              <button onClick={() => duplicateRef.current()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}
                title="Duplicate (⌘D)">
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button onClick={bringToFront}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
                <ChevronUp className="w-3.5 h-3.5" /> Front
              </button>
              <button onClick={sendToBack}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>
                <ChevronDown className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={deleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(230,0,35,0.18)", color: "#f87171" }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Canvas background picker */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>BG</span>
            {BG_OPTIONS.map(opt => (
              <button key={opt.color} onClick={() => setCanvasBg(opt.color)} title={opt.label} style={{
                width: 16, height: 16, borderRadius: "50%", background: opt.color, flexShrink: 0,
                border: canvasBg === opt.color ? "2px solid #e60023" : "1.5px solid rgba(255,255,255,0.2)",
              }} />
            ))}
          </div>

          <button onClick={handleSave} disabled={items.every(i => i.content === "")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
            style={{ background: "#e60023", color: "white" }}>
            <Check className="w-3.5 h-3.5" /> Add to board
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Text formatting toolbar (shown when text item is selected, not editing) ── */}
      {selected?.type === "text" && editingTextId !== selected.id && (
        <div className="flex items-center gap-2 px-4 py-2 flex-wrap flex-shrink-0"
          style={{ background: "rgba(8,8,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Font sizes */}
          <div className="flex items-center gap-0.5">
            {FONT_SIZES.map(size => (
              <button key={size} onClick={() => updateSelected({ fontSize: size })} style={{
                fontSize: 10, fontWeight: 700, padding: "2px 5px", borderRadius: 4,
                color: selected.fontSize === size ? "#e60023" : "rgba(255,255,255,0.4)",
                background: selected.fontSize === size ? "rgba(230,0,35,0.15)" : "transparent",
              }}>{size}</button>
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

          {/* Box background */}
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
          }}>Edit text</button>
        </div>
      )}

      {/* ── Canvas area ── */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center p-4"
        onClick={() => { setSelectedId(null); }}
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
          {/* Center snap guides */}
          {guideX && (
            <div style={{
              position: "absolute", left: "50%", top: 0,
              width: 1, height: "100%",
              background: "#e60023", opacity: 0.7, pointerEvents: "none", zIndex: 9998,
              transform: "translateX(-0.5px)",
            }} />
          )}
          {guideY && (
            <div style={{
              position: "absolute", top: "50%", left: 0,
              width: "100%", height: 1,
              background: "#e60023", opacity: 0.7, pointerEvents: "none", zIndex: 9998,
              transform: "translateY(-0.5px)",
            }} />
          )}

          {/* Items */}
          {[...items].sort((a, b) => a.zIndex - b.zIndex).map(item => {
            const isSel        = selectedId === item.id;
            const isEditingThis = editingTextId === item.id;
            const rotation     = item.rotation ?? 0;

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
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  cursor: isEditingThis ? "text" : "move",
                  userSelect: "none",
                  outline: isSel && !isEditingThis ? "2px solid #e60023" : "none",
                  outlineOffset: 2,
                }}
              >
                {/* Inner content with clipping */}
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: item.type === "text" ? 8 : 4,
                  overflow: "hidden",
                }}>
                  {item.type === "image" ? (
                    item.content ? (
                      <img src={item.content} alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
                        draggable={false} />
                    ) : (
                      /* Empty image placeholder — tap to upload */
                      <div
                        style={{
                          width: "100%", height: "100%",
                          background: "rgba(255,255,255,0.07)",
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", gap: 4,
                          cursor: "pointer",
                        }}
                        onClick={e => { e.stopPropagation(); setPendingImgId(item.id); fileRef.current?.click(); }}
                        onPointerDown={e => e.stopPropagation()}
                      >
                        <ImagePlus style={{ width: 18, height: 18, color: "rgba(255,255,255,0.25)" }} />
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>tap to add</span>
                      </div>
                    )
                  ) : isEditingThis ? (
                    <div
                      style={{ width: "100%", height: "100%", background: item.bg, borderRadius: 8, display: "flex", padding: "6px 10px" }}
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
                      width: "100%", height: "100%",
                      background: item.bg ?? "transparent",
                      borderRadius: 8,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: item.bg && item.bg !== "transparent" ? "6px 10px" : "0",
                    }}>
                      <span style={{
                        fontSize: item.fontSize, color: item.color,
                        fontWeight: item.bold ? 700 : 400, fontStyle: item.italic ? "italic" : "normal",
                        lineHeight: 1.4, wordBreak: "break-word", textAlign: "center",
                        width: "100%", display: "block", whiteSpace: "pre-wrap",
                      }}>
                        {item.content}
                      </span>
                    </div>
                  )}
                </div>

                {/* Resize handle — bottom-right */}
                {isSel && !isEditingThis && (
                  <div
                    onPointerDown={e => onItemPointerDown(e, item, "resize")}
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 22, height: 22, background: "#e60023",
                      cursor: "se-resize", borderRadius: "8px 0 4px 0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      zIndex: 10,
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M2 7L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M5 7L7 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Rotation handle — top-right */}
                {isSel && !isEditingThis && (
                  <div
                    onPointerDown={e => onItemPointerDown(e, item, "rotate")}
                    onClick={e => e.stopPropagation()}
                    title="Drag to rotate"
                    style={{
                      position: "absolute", top: 0, right: 0,
                      width: 22, height: 22, background: "rgba(255,255,255,0.2)",
                      backdropFilter: "blur(4px)",
                      cursor: "grab", borderRadius: "0 4px 0 8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      zIndex: 10,
                    }}
                  >
                    <RotateCcw style={{ width: 10, height: 10, color: "white" }} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state hint */}
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

      {selected && !editingTextId && (
        <p className="text-center pb-3 font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          Drag to move · ↘ resize · ↗ rotate · double-click text to edit · ⌘D duplicate
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CanvasCard — board renderer (read-only)
═══════════════════════════════════════════════════════════════════ */
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
    bg    = parsed.bg ?? "#141414";
  } catch { /* ignore */ }

  return (
    <div className="relative group">
      <div style={{
        width: "100%", aspectRatio: "3/4",
        background: bg, position: "relative", overflow: "hidden",
        transition: "background 0.2s",
      }}>
        {[...items].sort((a, b) => a.zIndex - b.zIndex).map(ci => (
          <div key={ci.id} style={{
            position: "absolute",
            left: `${ci.x}%`, top: `${ci.y}%`,
            width: `${ci.w}%`, height: `${ci.h}%`,
            zIndex: ci.zIndex,
            transform: `rotate(${ci.rotation ?? 0}deg)`,
            transformOrigin: "center center",
            borderRadius: ci.type === "text" ? 8 : 4,
            overflow: "hidden",
          }}>
            {ci.type === "image" ? (
              ci.content
                ? <img src={ci.content} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
                : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.07)" }} />
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
                  width: "100%", display: "block", whiteSpace: "pre-wrap",
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
        <button onClick={onEdit}
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.55)", color: "white" }} title="Edit canvas">
          <Type className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete}
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ background: "rgba(230,0,35,0.7)", color: "white" }} title="Remove">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
