"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Check, Sparkles } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

const EMOJI_OPTIONS = [
  "🌸","🌿","🦋","🌙","⭐","🔥","🎯","💎","🚀","🎨",
  "🧠","📚","☕","🌊","🌻","🦊","🐉","🎸","🍀","✨",
];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
];

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { profile, updateProfile } = useUIStore();

  const [name, setName]             = useState(profile.name);
  const [emoji, setEmoji]           = useState(profile.emoji);
  const [preview, setPreview]       = useState(profile.avatarUrl);
  const [bgGradient, setBgGradient] = useState(AVATAR_GRADIENTS[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    updateProfile({ name: name.trim() || "My Workspace", emoji, avatarUrl: preview });
    onClose();
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/30 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto w-[480px] bg-paper rounded-3xl shadow-2xl overflow-hidden border border-binding/30">

              {/* ── Header band ── */}
              <div
                className="relative h-28 flex items-end px-8 pb-0"
                style={{ background: preview ? `url(${preview}) center/cover` : bgGradient }}
              >
                {/* Gradient cycle button */}
                {!preview && (
                  <button
                    onClick={() => {
                      const idx = AVATAR_GRADIENTS.indexOf(bgGradient);
                      setBgGradient(AVATAR_GRADIENTS[(idx + 1) % AVATAR_GRADIENTS.length]);
                    }}
                    className="absolute top-3 right-12 flex items-center gap-1.5 font-mono text-[9px] font-semibold text-white/70 hover:text-white bg-ink/20 hover:bg-ink/40 px-2.5 py-1.5 rounded-lg transition-all backdrop-blur-sm"
                  >
                    <Sparkles className="w-3 h-3" />
                    cycle
                  </button>
                )}
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-xl bg-ink/20 hover:bg-ink/40 text-white/80 hover:text-white transition-colors backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Avatar — overlaps header bottom */}
                <div className="relative translate-y-1/2">
                  <div
                    className="w-20 h-20 rounded-2xl border-4 border-paper shadow-xl overflow-hidden flex items-center justify-center"
                    style={{ background: preview ? undefined : bgGradient }}
                  >
                    {preview
                      ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-4xl">{emoji}</span>
                    }
                  </div>
                  {/* Camera button */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-accent border-2 border-paper flex items-center justify-center hover:bg-accent-dim transition-colors shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

              {/* ── Body ── */}
              <div className="px-8 pt-14 pb-8 flex flex-col gap-6">

                {/* Name field */}
                <div>
                  <label className="font-mono text-[10px] text-ink-faint uppercase tracking-widest block mb-2">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name or workspace…"
                    className="w-full bg-transparent border-b-2 border-ruled focus:border-accent outline-none text-xl font-bold text-ink placeholder:text-ink-faint py-1.5 transition-colors"
                  />
                </div>

                {/* Emoji avatar picker */}
                {!preview && (
                  <div>
                    <label className="font-mono text-[10px] text-ink-faint uppercase tracking-widest block mb-2.5">
                      Avatar emoji
                    </label>
                    <div className="grid grid-cols-10 gap-1.5">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setEmoji(e)}
                          className={`aspect-square text-xl flex items-center justify-center rounded-xl transition-all ${
                            emoji === e
                              ? "bg-accent/15 ring-2 ring-accent scale-110 shadow-sm"
                              : "hover:bg-binding/50 hover:scale-105"
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remove photo */}
                {preview && (
                  <button
                    onClick={() => setPreview("")}
                    className="self-start font-mono text-[10px] text-urgent/70 hover:text-urgent transition-colors underline underline-offset-2"
                  >
                    Remove photo — use emoji instead
                  </button>
                )}

                {/* Divider */}
                <div className="h-px bg-binding/40" />

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl border border-binding text-ink-muted text-sm font-semibold hover:bg-binding/30 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3 rounded-2xl bg-accent text-white text-sm font-semibold hover:bg-accent-dim transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
