"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Shuffle, Move, Check } from "lucide-react";
import { useTaskStore } from "@/store/taskStore";

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #0fd850 0%, #f9f047 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f77062 0%, #fe5196 100%)",
  "linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)",
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
];

export default function CoverImage() {
  const { selectedDate, covers, setCover } = useTaskStore();
  const cover = covers[selectedDate] ?? null;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hovered, setHovered]       = useState(false);
  const [adjusting, setAdjusting]   = useState(false);
  const [positionY, setPositionY]   = useState(50);
  const fileRef   = useRef<HTMLInputElement>(null);
  const dragRef   = useRef<{ startY: number; startPos: number } | null>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCover(selectedDate, { type: "image", value: ev.target?.result as string, positionY: 50 });
      setPickerOpen(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function pickGradient(g: string) {
    setCover(selectedDate, { type: "gradient", value: g });
    setPickerOpen(false);
  }

  function randomGradient() {
    const g = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
    setCover(selectedDate, { type: "gradient", value: g });
    setPickerOpen(false);
  }

  function startAdjust() {
    setPositionY(cover?.positionY ?? 50);
    setAdjusting(true);
    setHovered(false);
  }

  function saveAdjust() {
    if (cover) setCover(selectedDate, { ...cover, positionY });
    setAdjusting(false);
  }

  function cancelAdjust() {
    setAdjusting(false);
  }

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!adjusting) return;
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startPos: positionY };

    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return;
      const delta = ev.clientY - dragRef.current.startY;
      // dragging down → reveal top (positionY decreases)
      const next = Math.max(0, Math.min(100, dragRef.current.startPos - delta * 0.35));
      setPositionY(next);
    }
    function onUp() {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [adjusting, positionY]);

  if (!cover) {
    return (
      <div className="relative group flex items-center justify-center h-10 px-6">
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1.5 font-mono text-[10px] text-ink-faint hover:text-ink-muted transition-colors opacity-0 group-hover:opacity-100"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          Add cover
        </button>
        <CoverPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onGradient={pickGradient}
          onRandom={randomGradient}
          onUpload={() => fileRef.current?.click()}
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>
    );
  }

  const displayY = adjusting ? positionY : (cover.positionY ?? 50);
  const bg = cover.type === "gradient"
    ? { background: cover.value }
    : { backgroundImage: `url(${cover.value})`, backgroundSize: "cover", backgroundPosition: `center ${displayY}%` };

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: "180px", ...bg, cursor: adjusting ? "ns-resize" : "default" }}
      onMouseEnter={() => !adjusting && setHovered(true)}
      onMouseLeave={() => !adjusting && setHovered(false)}
      onMouseDown={onMouseDown}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-ink/10" />

      {/* Adjust mode UI */}
      <AnimatePresence>
        {adjusting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex flex-col items-center justify-between py-3 pointer-events-none"
          >
            {/* Hint */}
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-white bg-ink/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Move className="w-3 h-3" />
              Drag to reposition
            </div>

            {/* Save / Cancel — these need pointer events */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={cancelAdjust}
                className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-ink/40 text-white backdrop-blur-sm hover:bg-ink/60 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={saveAdjust}
                className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-accent text-white backdrop-blur-sm hover:bg-accent-dim transition-colors"
              >
                <Check className="w-3 h-3" />
                Save position
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Normal hover controls */}
      <AnimatePresence>
        {hovered && !adjusting && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-3 right-4 flex items-center gap-2"
          >
            {/* Adjust button — only for image covers */}
            {cover.type === "image" && (
              <button
                onClick={startAdjust}
                className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-ink/40 text-white backdrop-blur-sm hover:bg-ink/60 transition-colors"
              >
                <Move className="w-3 h-3" />
                Adjust
              </button>
            )}
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-ink/40 text-white backdrop-blur-sm hover:bg-ink/60 transition-colors"
            >
              <Shuffle className="w-3 h-3" />
              Change
            </button>
            <button
              onClick={() => setCover(selectedDate, null)}
              className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-ink/40 text-white backdrop-blur-sm hover:bg-ink/60 transition-colors"
            >
              <X className="w-3 h-3" />
              Remove
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CoverPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onGradient={pickGradient}
        onRandom={randomGradient}
        onUpload={() => fileRef.current?.click()}
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}

function CoverPicker({
  open, onClose, onGradient, onRandom, onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onGradient: (g: string) => void;
  onRandom: () => void;
  onUpload: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-paper border border-binding/60 rounded-2xl shadow-xl p-4 w-72"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">Choose cover</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={onRandom}
                  className="font-mono text-[9px] px-2 py-1 rounded-lg border border-binding text-ink-muted hover:bg-binding/40 transition-colors flex items-center gap-1"
                >
                  <Shuffle className="w-3 h-3" />
                  Random
                </button>
                <button
                  onClick={onUpload}
                  className="font-mono text-[9px] px-2 py-1 rounded-lg bg-accent text-white hover:bg-accent-dim transition-colors flex items-center gap-1"
                >
                  <ImagePlus className="w-3 h-3" />
                  Upload
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => onGradient(g)}
                  className="h-12 rounded-xl hover:scale-105 transition-transform ring-2 ring-transparent hover:ring-accent"
                  style={{ background: g }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
