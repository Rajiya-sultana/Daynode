"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Pause, Play, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import confetti from "canvas-confetti";
import { useUIStore } from "@/store/uiStore";
import { useTaskStore } from "@/store/taskStore";

const PRESETS = [15, 25, 50] as const;
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusMode() {
  const {
    focusTaskId, focusDuration, focusStartTime, focusElapsed,
    isFocusPaused, isFocusMinimized,
    startFocus, pauseFocus, resumeFocus, stopFocus, setFocusMinimized,
  } = useUIStore();
  const { tasks, setStatus } = useTaskStore();

  // Tick every second while running to redrive the derived time
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isFocusPaused && focusStartTime && focusTaskId) {
      const id = setInterval(() => setTick((n) => n + 1), 1000);
      return () => clearInterval(id);
    }
  }, [isFocusPaused, focusStartTime, focusTaskId]);

  if (!focusTaskId) return null;

  const task = tasks.find((t) => t.id === focusTaskId);
  if (!task) { stopFocus(); return null; }

  // If the task was completed outside the panel, close focus automatically
  if (task.status === "completed") { stopFocus(); return null; }

  const elapsedNow =
    focusElapsed +
    (!isFocusPaused && focusStartTime ? (Date.now() - focusStartTime) / 1000 : 0);
  const remaining  = Math.max(0, focusDuration - elapsedNow);
  const isExpired  = remaining <= 0;
  const dashOffset = CIRCUMFERENCE * (remaining / focusDuration);

  const mins    = Math.floor(remaining / 60);
  const secs    = Math.floor(remaining % 60);
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const ringColor = isExpired
    ? "var(--color-urgent)"
    : isFocusPaused
    ? "var(--color-pending)"
    : "var(--color-accent)";

  function handleComplete() {
    setStatus(focusTaskId!, "completed");
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 },
      colors: ["#5B8DEF", "#5BAD8A", "#E88C8C", "#F0A057", "#8B6DAF"] });
    stopFocus();
  }

  function handlePreset(m: number) {
    startFocus(focusTaskId!, m);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="focus-panel"
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="fixed bottom-6 right-6 z-[55]"
      >
        {isFocusMinimized ? (
          /* ── Minimized pill ─────────────────────────────────────────── */
          <div className="flex items-center gap-2 pl-3.5 pr-2 py-2 bg-paper border border-binding/60 rounded-2xl shadow-lg">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isExpired ? "bg-urgent" : isFocusPaused ? "bg-pending" : "bg-accent animate-pulse"}`} />
            <span className={`font-mono text-sm font-bold w-14 ${isExpired ? "text-urgent" : "text-ink"}`}>
              {isExpired ? "Done!" : timeStr}
            </span>

            {!isExpired && (
              <button
                onClick={() => isFocusPaused ? resumeFocus() : pauseFocus()}
                className="p-1.5 rounded-lg hover:bg-binding/40 text-ink-muted hover:text-ink transition-colors"
                title={isFocusPaused ? "Resume" : "Pause"}
              >
                {isFocusPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={() => setFocusMinimized(false)}
              className="p-1.5 rounded-lg hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors"
              title="Expand"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={stopFocus}
              className="p-1.5 rounded-lg hover:bg-urgent-soft text-ink-faint hover:text-urgent transition-colors"
              title="End focus"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* ── Expanded card ──────────────────────────────────────────── */
          <div className="w-72 bg-paper border border-binding/60 rounded-3xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-2 px-5 pt-5">
              <Target className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint flex-1">
                Focus Mode
              </span>
              <button
                onClick={() => setFocusMinimized(true)}
                className="p-1 rounded-lg hover:bg-binding/40 text-ink-faint hover:text-ink transition-colors"
                title="Minimize"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={stopFocus}
                className="p-1 rounded-lg hover:bg-urgent-soft text-ink-faint hover:text-urgent transition-colors"
                title="End focus"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ring timer */}
            <div className="flex flex-col items-center px-5 pt-4 pb-2">
              <div className="relative w-[140px] h-[140px]">
                <svg width="140" height="140" viewBox="0 0 120 120" className="overflow-visible">
                  {/* Track */}
                  <circle
                    cx="60" cy="60" r={RADIUS}
                    fill="none"
                    stroke="var(--color-ruled)"
                    strokeWidth="7"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="60" cy="60" r={RADIUS}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
                  />
                </svg>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`font-mono text-2xl font-bold leading-none tabular-nums ${
                    isExpired ? "text-urgent" : isFocusPaused ? "text-pending" : "text-ink"
                  }`}>
                    {isExpired ? "00:00" : timeStr}
                  </span>
                  <span className="font-mono text-[9px] text-ink-faint mt-1">
                    {isExpired ? "time's up!" : isFocusPaused ? "paused" : "remaining"}
                  </span>
                </div>
              </div>

              {/* Task title */}
              <p className="text-sm font-semibold text-ink text-center leading-snug mt-3 line-clamp-2 px-2">
                {task.title}
              </p>
            </div>

            {/* Duration presets */}
            <div className="flex items-center justify-center gap-2 px-5 pb-4">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => handlePreset(m)}
                  className={`font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    focusDuration === m * 60
                      ? "bg-accent text-white border-accent"
                      : "border-ruled text-ink-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 px-5 pb-5">
              <button
                onClick={handleComplete}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-done text-white font-mono text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Check className="w-3.5 h-3.5" />
                Complete
              </button>
              {!isExpired && (
                <button
                  onClick={() => isFocusPaused ? resumeFocus() : pauseFocus()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-binding text-ink-muted font-mono text-xs font-semibold hover:bg-binding/30 transition-colors"
                >
                  {isFocusPaused
                    ? <Play  className="w-3.5 h-3.5" />
                    : <Pause className="w-3.5 h-3.5" />}
                  {isFocusPaused ? "Resume" : "Pause"}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
