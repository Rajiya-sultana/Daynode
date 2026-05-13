"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Shuffle } from "lucide-react";
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
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCover(selectedDate, { type: "image", value: ev.target?.result as string });
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

  const bg = cover.type === "gradient"
    ? { background: cover.value }
    : { backgroundImage: `url(${cover.value})`, backgroundSize: "cover", backgroundPosition: "center" };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "180px", ...bg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-ink/10" />

      {/* Controls on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-3 right-4 flex items-center gap-2"
          >
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
