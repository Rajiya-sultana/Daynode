"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ImagePlus, Quote, Pencil, Check } from "lucide-react";
import { useTaskStore, type VisionItem } from "@/store/taskStore";

/* ── Stable helpers (derived from nanoid string, never change) ── */
function stableRot(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return (((h % 13) + 13) % 13) - 6; // -6..+6
}

function stableXY(id: string) {
  let h1 = 5381, h2 = 52711;
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    h1 = (Math.imul(h1, 33) ^ c) | 0;
    h2 = (Math.imul(h2, 31) ^ (c * 7)) | 0;
  }
  return {
    x: ((Math.abs(h1) % 960) + 60),
    y: ((Math.abs(h2) % 560) + 60),
  };
}

const STICKY_COLORS = ["#FFE066", "#A8D8A8", "#F9B7B7", "#B7C9F9", "#FFD4A3", "#E8D5FF"];

type AddMode = "image" | "quote" | "sticky" | null;

/* ── Tape strip — reused on every card ── */
function Tape({ rot: r }: { rot: number }) {
  return (
    <div
      className="absolute -top-4 left-1/2 pointer-events-none"
      style={{
        transform: `translateX(-50%) rotate(${r * 0.6}deg)`,
        width: 52, height: 18,
        background: "rgba(245,230,163,0.72)",
        boxShadow: "inset 0 0 8px rgba(0,0,0,0.08)",
        borderRadius: 2,
      }}
    />
  );
}

export default function VisionBoard() {
  const { visionBoard, addVisionItem, deleteVisionItem, updateVisionItem } = useTaskStore();

  /* Per-card local position during drag — committed to store on mouseup */
  const localPosRef = useRef<Record<string, { x: number; y: number }>>({});
  const [, forceUpdate] = useState(0);
  const [zMap, setZMap] = useState<Record<string, number>>({});
  const topZRef = useRef(100);

  /* FAB / add-mode state */
  const [fabOpen, setFabOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [formText, setFormText] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formColor, setFormColor] = useState(STICKY_COLORS[0]);

  /* Editing labels on existing cards */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  /* Lightbox for double-click on image */
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Helpers ── */
  function getPos(item: VisionItem) {
    const lp = localPosRef.current[item.id];
    if (lp) return lp;
    if (item.x != null && item.y != null) return { x: item.x, y: item.y };
    return stableXY(item.id);
  }

  function getZ(item: VisionItem) {
    return zMap[item.id] ?? item.zIndex ?? 1;
  }

  function bringToFront(id: string) {
    const z = ++topZRef.current;
    setZMap(prev => ({ ...prev, [id]: z }));
  }

  /* ── Drag ── */
  function startDrag(e: React.MouseEvent, item: VisionItem) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    bringToFront(item.id);

    const id = item.id;
    const orig = getPos(item);
    let curX = orig.x, curY = orig.y;
    const sx = e.clientX, sy = e.clientY;

    function onMove(ev: MouseEvent) {
      curX = orig.x + ev.clientX - sx;
      curY = orig.y + ev.clientY - sy;
      localPosRef.current[id] = { x: curX, y: curY };
      forceUpdate(n => n + 1);
    }

    function onUp() {
      updateVisionItem(id, { x: curX, y: curY });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  /* ── Add handlers ── */
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev =>
        addVisionItem({ type: "image", content: ev.target?.result as string, cardStyle: "polaroid" });
      reader.readAsDataURL(file);
    });
    e.target.value = "";
    setFabOpen(false);
  }

  function handleAddText() {
    if (!formText.trim()) return;
    addVisionItem({
      type: "text",
      content: formText.trim(),
      label: formLabel.trim() || undefined,
      color: addMode === "sticky" ? formColor : undefined,
      cardStyle: addMode === "sticky" ? "sticky" : "clipping",
    });
    setFormText(""); setFormLabel(""); setFormColor(STICKY_COLORS[0]);
    setAddMode(null);
  }

  function saveLabel(id: string) {
    updateVisionItem(id, { label: editLabel.trim() || undefined });
    setEditingId(null);
  }

  /* ── Empty state ── */
  if (visionBoard.length === 0 && !addMode) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ minHeight: "calc(100vh - 64px)", background: "#2C2416" }}
      >
        <div className="text-6xl opacity-20 mb-4" style={{ filter: "sepia(1)" }}>✦</div>
        <p className="font-mono text-sm text-amber-200/50 mb-1">Your vision board is empty</p>
        <p className="font-mono text-[10px] text-amber-200/30 mb-6 text-center max-w-xs">
          Pin images, quotes, and affirmations of what you're building toward.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#8B5E3C" }}
          >
            <ImagePlus className="w-4 h-4" /> Add Image
          </button>
          <button
            onClick={() => { setAddMode("quote"); setFabOpen(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "rgba(255,224,102,0.15)", color: "#FFE066", border: "1px solid rgba(255,224,102,0.3)" }}
          >
            <Quote className="w-4 h-4" /> Add Quote
          </button>
          <button
            onClick={() => { setAddMode("sticky"); setFabOpen(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "rgba(168,216,168,0.15)", color: "#A8D8A8", border: "1px solid rgba(168,216,168,0.3)" }}
          >
            <Pencil className="w-4 h-4" /> Sticky Note
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
        <AddForm
          mode={addMode}
          text={formText} onText={setFormText}
          label={formLabel} onLabel={setFormLabel}
          color={formColor} onColor={setFormColor}
          onSubmit={handleAddText}
          onClose={() => setAddMode(null)}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-auto" style={{ minHeight: "calc(100vh - 64px)", background: "#2C2416" }}>

      {/* Cork noise texture */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%", opacity: 0.13, position: "fixed", top: 0, left: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="cork-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0.4" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cork-noise)" />
      </svg>

      {/* Vignette */}
      <div
        className="pointer-events-none"
        style={{
          position: "fixed", inset: 0,
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)",
          zIndex: 1,
        }}
      />

      {/* Board canvas */}
      <div
        className="relative"
        style={{ minWidth: 1800, minHeight: 1300 }}
      >
        <AnimatePresence>
          {visionBoard.map(item => {
            const pos = getPos(item);
            const z = getZ(item);
            const r = stableRot(item.id);

            return (
              <motion.div
                key={item.id}
                initial={{ y: -40, opacity: 0, rotate: r, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, rotate: r, scale: 1 }}
                exit={{ y: 120, opacity: 0, rotate: r + 22, scale: 0.85 }}
                transition={{ type: "spring", bounce: 0.28, duration: 0.5 }}
                className="group absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                  zIndex: z + 2,
                  cursor: "grab",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
                onMouseDown={e => startDrag(e, item)}
                onClick={() => bringToFront(item.id)}
                onDoubleClick={item.type === "image" ? () => setLightbox(item.content) : undefined}
              >
                {/* Delete pin */}
                <button
                  className="absolute -top-2.5 -right-2.5 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "#E63946", color: "white" }}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); deleteVisionItem(item.id); }}
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Label edit button (non-clipping only) */}
                {item.cardStyle !== "clipping" && (
                  <button
                    className="absolute -top-2.5 -left-2.5 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "#2C2416", color: "#FFE066", border: "1px solid rgba(255,224,102,0.4)" }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setEditingId(item.id); setEditLabel(item.label ?? ""); }}
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                )}

                {item.type === "image" ? (
                  <PolaroidCard item={item} />
                ) : item.cardStyle === "sticky" ? (
                  <StickyCard item={item} rot={r} />
                ) : (
                  <ClippingCard item={item} rot={r} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col-reverse items-center gap-3">
        <AnimatePresence>
          {fabOpen && (
            <>
              <FabItem
                key="img"
                label="Image"
                icon={<ImagePlus className="w-4 h-4" />}
                color="#8B5E3C"
                onClick={() => { fileRef.current?.click(); setFabOpen(false); }}
                delay={0}
              />
              <FabItem
                key="clip"
                label="Magazine clip"
                icon={<Quote className="w-4 h-4" />}
                color="#1a1a2e"
                onClick={() => { setAddMode("quote"); setFabOpen(false); }}
                delay={0.06}
              />
              <FabItem
                key="sticky"
                label="Sticky note"
                icon={<Pencil className="w-4 h-4" />}
                color="#A0793B"
                onClick={() => { setAddMode("sticky"); setFabOpen(false); }}
                delay={0.12}
              />
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setFabOpen(v => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
          style={{ background: "#8B5E3C", color: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
        >
          <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus className="w-6 h-6" />
          </motion.div>
        </motion.button>
      </div>

      {/* Label edit overlay */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setEditingId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="rounded-2xl p-6 w-80 shadow-2xl"
              style={{ background: "#1e1610", border: "1px solid rgba(255,224,102,0.2)" }}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(255,224,102,0.5)" }}>
                Edit label / caption
              </p>
              <input
                autoFocus
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveLabel(editingId); if (e.key === "Escape") setEditingId(null); }}
                placeholder="Caption or source…"
                className="w-full bg-transparent outline-none text-sm pb-1 border-b"
                style={{ color: "#f5e6c8", borderColor: "rgba(255,224,102,0.3)" }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ color: "rgba(245,230,200,0.5)", background: "rgba(255,255,255,0.06)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveLabel(editingId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "#8B5E3C", color: "white" }}
                >
                  <Check className="w-3 h-3" /> Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form */}
      <AddForm
        mode={addMode}
        text={formText} onText={setFormText}
        label={formLabel} onLabel={setFormLabel}
        color={formColor} onColor={setFormColor}
        onSubmit={handleAddText}
        onClose={() => setAddMode(null)}
      />

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-8"
            style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}
            onClick={() => setLightbox(null)}
          >
            <motion.img
              src={lightbox}
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              className="max-w-full max-h-full rounded-lg"
              style={{ boxShadow: "0 8px 60px rgba(0,0,0,0.8)" }}
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
    </div>
  );
}

/* ── Card sub-components ── */

function PolaroidCard({ item }: { item: VisionItem }) {
  const r = stableRot(item.id);
  return (
    <div
      style={{
        background: "white",
        padding: "8px 8px 28px 8px",
        width: 200,
        boxShadow: "4px 6px 20px rgba(0,0,0,0.6), 1px 2px 6px rgba(0,0,0,0.3)",
        position: "relative",
      }}
    >
      <Tape rot={r} />
      <img src={item.content} alt={item.label ?? ""} className="w-full h-auto block" draggable={false} />
      <p
        className="text-center mt-1.5 text-gray-500 italic truncate"
        style={{ fontSize: 11, fontFamily: "'Segoe UI', Georgia, cursive", minHeight: 14 }}
      >
        {item.label ?? ""}
      </p>
    </div>
  );
}

function StickyCard({ item, rot: r }: { item: VisionItem; rot: number }) {
  return (
    <div
      style={{
        background: item.color ?? "#FFE066",
        padding: "16px 14px 14px",
        width: 180,
        minHeight: 140,
        boxShadow: "2px 2px 0 rgba(0,0,0,0.12), 5px 10px 20px rgba(0,0,0,0.35), inset -4px -4px 10px rgba(0,0,0,0.06)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Tape rot={r} />
      <p
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 14,
          lineHeight: 1.55,
          color: "rgba(0,0,0,0.78)",
          flex: 1,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {item.content}
      </p>
      {item.label && (
        <p style={{ marginTop: 8, fontSize: 10, fontStyle: "italic", opacity: 0.55, fontFamily: "Georgia, serif" }}>
          — {item.label}
        </p>
      )}
    </div>
  );
}

function ClippingCard({ item, rot: r }: { item: VisionItem; rot: number }) {
  return (
    <div
      style={{
        background: "white",
        padding: "14px 16px",
        maxWidth: 240,
        boxShadow: "4px 6px 20px rgba(0,0,0,0.55)",
        position: "relative",
      }}
    >
      <Tape rot={r} />
      <p
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 900,
          fontSize: item.content.length > 40 ? 20 : 28,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          color: item.color ?? "#1a1a1a",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {item.content}
      </p>
      {item.label && (
        <p style={{ marginTop: 6, fontSize: 10, fontStyle: "italic", opacity: 0.45, fontFamily: "Georgia, serif" }}>
          — {item.label}
        </p>
      )}
    </div>
  );
}

/* ── FAB sub-item ── */

function FabItem({
  label, icon, color, onClick, delay,
}: {
  label: string; icon: React.ReactNode; color: string; onClick: () => void; delay: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.8 }}
      transition={{ delay, duration: 0.18 }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full shadow-xl text-white text-xs font-semibold"
      style={{ background: color, boxShadow: "0 4px 16px rgba(0,0,0,0.45)", whiteSpace: "nowrap" }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

/* ── Add form modal ── */

function AddForm({
  mode, text, onText, label, onLabel, color, onColor, onSubmit, onClose,
}: {
  mode: AddMode;
  text: string; onText: (v: string) => void;
  label: string; onLabel: (v: string) => void;
  color: string; onColor: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {mode && mode !== "image" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
            onClick={e => e.stopPropagation()}
            className="rounded-2xl p-6 w-96 shadow-2xl"
            style={{ background: "#1e1610", border: "1px solid rgba(255,224,102,0.18)" }}
          >
            {/* Preview of the card style */}
            <div className="mb-5 flex justify-center">
              {mode === "sticky" ? (
                <div
                  style={{
                    background: color,
                    padding: "12px 14px",
                    width: 140,
                    minHeight: 100,
                    boxShadow: "3px 4px 12px rgba(0,0,0,0.35)",
                    transform: "rotate(-2deg)",
                    fontFamily: "Georgia, serif",
                    fontSize: 13,
                    color: "rgba(0,0,0,0.75)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {text || "your note…"}
                </div>
              ) : (
                <div
                  style={{
                    background: "white",
                    padding: "10px 14px",
                    maxWidth: 180,
                    boxShadow: "4px 5px 16px rgba(0,0,0,0.4)",
                    transform: "rotate(1.5deg)",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontWeight: 900,
                    fontSize: text.length > 30 ? 16 : 22,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    textTransform: "uppercase",
                    wordBreak: "break-word",
                    color: "#1a1a1a",
                  }}
                >
                  {text || "YOUR QUOTE"}
                </div>
              )}
            </div>

            <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(255,224,102,0.5)" }}>
              {mode === "sticky" ? "New sticky note" : "New magazine clipping"}
            </p>

            <textarea
              autoFocus
              value={text}
              onChange={e => onText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(); }}
              placeholder={mode === "sticky" ? "Write your affirmation…" : "Write your quote or goal…"}
              rows={3}
              className="w-full bg-transparent text-sm outline-none resize-none leading-relaxed border-b pb-1"
              style={{ color: "#f5e6c8", borderColor: "rgba(255,224,102,0.25)" }}
            />

            <input
              value={label}
              onChange={e => onLabel(e.target.value)}
              placeholder="Source / author (optional)"
              className="w-full bg-transparent text-xs outline-none mt-3 border-b pb-1"
              style={{ color: "rgba(245,230,200,0.55)", borderColor: "rgba(255,224,102,0.15)" }}
            />

            {/* Color picker for sticky */}
            {mode === "sticky" && (
              <div className="flex items-center gap-2 mt-4">
                <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,224,102,0.4)" }}>Colour</span>
                <div className="flex gap-1.5">
                  {STICKY_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => onColor(c)}
                      style={{
                        width: 18, height: 18,
                        background: c,
                        borderRadius: "50%",
                        border: color === c ? "2px solid #FFE066" : "2px solid transparent",
                        transform: color === c ? "scale(1.2)" : "scale(1)",
                        transition: "transform 0.15s",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ color: "rgba(245,230,200,0.45)", background: "rgba(255,255,255,0.06)" }}
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={!text.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                style={{ background: "#8B5E3C", color: "white" }}
              >
                Pin it →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
