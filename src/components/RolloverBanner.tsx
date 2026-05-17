"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, RotateCcw } from "lucide-react";
import { format, subDays, isToday } from "date-fns";
import { useTaskStore } from "@/store/taskStore";

export default function RolloverBanner() {
  const { tasks, selectedDate, rolloverTasks } = useTaskStore();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [rolled, setRolled]       = useState(false);

  // Only show on today
  const isSelectedToday = isToday(new Date(selectedDate + "T12:00:00"));

  // Find the most recent past date that has incomplete tasks
  const fromDate = (() => {
    if (!isSelectedToday) return null;
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    // Check up to 7 days back
    for (let i = 1; i <= 7; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const incomplete = tasks.filter(
        (t) => t.date === d && t.status !== "completed" && t.status !== "cancelled"
      );
      if (incomplete.length > 0) return d;
    }
    return null;
  })();

  const incompleteCount = fromDate
    ? tasks.filter((t) => t.date === fromDate && t.status !== "completed" && t.status !== "cancelled").length
    : 0;

  // Already rolled over tasks from this date today?
  const alreadyRolled = fromDate
    ? tasks.some((t) => t.date === selectedDate && t.createdAt > new Date(selectedDate).toISOString())
    : false;

  const bannerKey = fromDate ?? "";
  const show = !!fromDate && incompleteCount > 0 && !dismissed.includes(bannerKey) && !rolled;

  function handleRollover() {
    if (!fromDate) return;
    rolloverTasks(fromDate, selectedDate);
    setRolled(true);
  }

  // Reset rolled state when date changes
  useEffect(() => { setRolled(false); }, [selectedDate]);

  const dateLabel = fromDate
    ? fromDate === format(subDays(new Date(), 1), "yyyy-MM-dd")
      ? "yesterday"
      : format(new Date(fromDate + "T12:00:00"), "MMM d")
    : "";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 px-6 py-2.5 bg-pending-soft border-b border-pending/20">
            <RotateCcw className="w-3.5 h-3.5 text-pending flex-shrink-0" />
            <p className="font-mono text-[11px] text-pending flex-1">
              <span className="font-semibold">{incompleteCount} task{incompleteCount > 1 ? "s" : ""}</span>
              {" "}from {dateLabel} weren't completed.
            </p>
            <button
              onClick={handleRollover}
              className="flex items-center gap-1.5 font-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-pending text-white hover:opacity-90 transition-opacity"
            >
              <ArrowRight className="w-3 h-3" />
              Roll over
            </button>
            <button
              onClick={() => setDismissed((d) => [...d, bannerKey])}
              className="p-1 rounded hover:bg-pending/20 text-pending/60 hover:text-pending transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Success flash */}
      {rolled && (
        <motion.div
          key="success"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          onAnimationComplete={() => setTimeout(() => setRolled(false), 2000)}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 px-6 py-2.5 bg-done-soft border-b border-done/20">
            <RotateCcw className="w-3.5 h-3.5 text-done" />
            <p className="font-mono text-[11px] text-done font-semibold">
              Tasks rolled over to today.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
