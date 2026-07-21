"use client";

import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import VisionBoard from "@/components/VisionBoard";
import { ImagePlus, Quote } from "lucide-react";
import { useRef, useState } from "react";
import { useTaskStore } from "@/store/taskStore";

export default function VisionPage() {
  const { addVisionItem } = useTaskStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [quoteMode, setQuoteMode] = useState(false);

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

  return (
    <div className="flex h-screen bg-parchment overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-ruled/60 flex-shrink-0">
          <div>
            <h1 className="font-mono text-lg font-bold text-ink leading-none">Vision Board</h1>
            <p className="font-mono text-[10px] text-ink-faint mt-1">images and words that pull you forward</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setQuoteMode(false); fileRef.current?.click(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-dim transition-colors"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Add Image
            </button>
            <button
              onClick={() => setQuoteMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-binding text-ink-muted text-xs font-semibold hover:bg-binding/30 transition-colors"
            >
              <Quote className="w-3.5 h-3.5" />
              Add Quote
            </button>
          </div>
        </div>

        {/* Board — scrollable */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <VisionBoard externalQuoteOpen={quoteMode} onQuoteClose={() => setQuoteMode(false)} />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
    </div>
  );
}
