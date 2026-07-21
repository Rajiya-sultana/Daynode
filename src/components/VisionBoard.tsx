"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Quote, X, Check, Pencil } from "lucide-react";
import { useTaskStore, type VisionItem } from "@/store/taskStore";

const TEXT_COLORS = [
  { bg: "#F4EFE6", label: "Cream"   },
  { bg: "#EEF3FD", label: "Blue"    },
  { bg: "#E6F5EF", label: "Mint"    },
  { bg: "#FEF3EA", label: "Peach"   },
  { bg: "#FDEAEA", label: "Rose"    },
  { bg: "#F0EBF8", label: "Lavender"},
];

interface Props {
  externalQuoteOpen?: boolean;
  onQuoteClose?: () => void;
}

export default function VisionBoard({ externalQuoteOpen = false, onQuoteClose }: Props) {
  const { visionBoard, addVisionItem, deleteVisionItem, updateVisionItem } = useTaskStore();
  const [localQuoteOpen, setLocalQuoteOpen] = useState(false);
  const quoteOpen = externalQuoteOpen || localQuoteOpen;
  function setQuoteOpen(v: boolean) { if (!v) { onQuoteClose?.(); setLocalQuoteOpen(false); } else setLocalQuoteOpen(true); }
  const [quoteText, setQuoteText]     = useState("");
  const [quoteLabel, setQuoteLabel]   = useState("");
  const [quoteColor, setQuoteColor]   = useState(TEXT_COLORS[0].bg);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editLabel, setEditLabel]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        addVisionItem({ type: "image", content: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function handleAddQuote() {
    if (!quoteText.trim()) return;
    addVisionItem({ type: "text", content: quoteText.trim(), label: quoteLabel.trim() || undefined, color: quoteColor });
    setQuoteText(""); setQuoteLabel(""); setQuoteColor(TEXT_COLORS[0].bg);
    setQuoteOpen(false);
  }

  function startEditLabel(item: VisionItem) {
    setEditingId(item.id);
    setEditLabel(item.label ?? "");
  }

  function saveLabel(id: string) {
    updateVisionItem(id, { label: editLabel.trim() || undefined });
    setEditingId(null);
  }

  if (visionBoard.length === 0 && !quoteOpen) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-ink-faint">
        <div className="text-5xl opacity-20">✦</div>
        <p className="font-mono text-sm">Your vision board is empty</p>
        <p className="font-mono text-[10px] text-ink-faint/60 text-center max-w-xs">
          Add images of your goals, dreams, and aspirations — or write quotes that inspire you.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-dim transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            Add Image
          </button>
          <button
            onClick={() => setQuoteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-binding text-ink-muted text-sm font-semibold hover:bg-binding/30 transition-colors"
          >
            <Quote className="w-4 h-4" />
            Add Quote
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Add quote form */}
      <AnimatePresence>
        {quoteOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mb-6 p-5 rounded-2xl border border-binding/60 bg-paper shadow-sm"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-3">New quote card</p>
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Write a quote, affirmation, or goal…"
              rows={3}
              autoFocus
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint/50 outline-none resize-none leading-relaxed border-b border-ruled focus:border-accent pb-1 transition-colors"
            />
            <input
              value={quoteLabel}
              onChange={(e) => setQuoteLabel(e.target.value)}
              placeholder="Source or label (optional)"
              className="w-full bg-transparent text-xs text-ink-muted placeholder:text-ink-faint/50 outline-none mt-2 border-b border-ruled/50 focus:border-accent pb-1 transition-colors"
            />
            {/* Color picker */}
            <div className="flex items-center gap-2 mt-4">
              <span className="font-mono text-[9px] text-ink-faint uppercase tracking-wider">Card color</span>
              <div className="flex items-center gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.bg}
                    onClick={() => setQuoteColor(c.bg)}
                    title={c.label}
                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.bg,
                      borderColor: quoteColor === c.bg ? "var(--color-accent)" : "var(--color-binding)",
                    }}
                  />
                ))}
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setQuoteOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-binding text-ink-muted text-xs font-semibold hover:bg-binding/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuote}
                disabled={!quoteText.trim()}
                className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-dim transition-colors disabled:opacity-40"
              >
                Add Card
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Masonry grid — CSS columns, browser handles layout */}
      <div
        className="gap-4"
        style={{ columnCount: 3, columnGap: "1rem" }}
      >
        <AnimatePresence>
          {visionBoard.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="group relative rounded-2xl overflow-hidden mb-4 shadow-sm"
              style={{ breakInside: "avoid" }}
            >
              {item.type === "image" ? (
                /* Image card */
                <div className="relative">
                  <img
                    src={item.content}
                    alt={item.label ?? "Vision"}
                    className="w-full h-auto block"
                    draggable={false}
                  />
                  {/* Label overlay */}
                  {item.label && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-ink/60 to-transparent">
                      <p className="text-white text-xs font-semibold leading-snug">{item.label}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Text / quote card */
                <div
                  className="px-5 py-6 min-h-[120px] flex flex-col justify-between"
                  style={{ backgroundColor: item.color ?? "#F4EFE6" }}
                >
                  <p className="text-ink text-sm font-semibold leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  {item.label && (
                    <p className="font-mono text-[10px] text-ink-muted mt-3">— {item.label}</p>
                  )}
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Edit label */}
                {editingId === item.id ? (
                  <div className="flex items-center gap-1 bg-paper/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow">
                    <input
                      autoFocus
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveLabel(item.id); if (e.key === "Escape") setEditingId(null); }}
                      placeholder="Add label…"
                      className="text-xs text-ink bg-transparent outline-none w-28"
                    />
                    <button onClick={() => saveLabel(item.id)} className="text-done hover:opacity-75">
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditLabel(item)}
                    className="p-1.5 rounded-lg bg-ink/40 text-white backdrop-blur-sm hover:bg-ink/60 transition-colors"
                    title="Add / edit label"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => deleteVisionItem(item.id)}
                  className="p-1.5 rounded-lg bg-ink/40 text-white backdrop-blur-sm hover:bg-urgent transition-colors"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
    </div>
  );
}
