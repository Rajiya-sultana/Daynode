"use client";

import { format, addDays, subDays, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Sun, Moon, Sunrise } from "lucide-react";
import { useTaskStore } from "@/store/taskStore";

function getTimeIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return <Sunrise className="w-5 h-5 text-peach" />;
  if (hour < 18) return <Sun className="w-5 h-5 text-peach" />;
  return <Moon className="w-5 h-5 text-lavender" />;
}

export default function DateHeader() {
  const { selectedDate, setSelectedDate, currentStreak } = useTaskStore();
  const date = new Date(selectedDate + "T12:00:00");
  const todaySelected = isToday(date);

  return (
    <div className="flex flex-col items-center gap-1 pt-6 pb-4 px-4">
      {currentStreak > 0 && (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-peach mb-1 animate-fade-in-up">
          <span className="text-base">🌱</span>
          <span>{currentStreak} day streak!</span>
        </div>
      )}
      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            setSelectedDate(format(subDays(date, 1), "yyyy-MM-dd"))
          }
          className="p-2 rounded-full hover:bg-lavender-light/50 transition-colors active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 text-muted" />
        </button>
        <div className="flex flex-col items-center min-w-[200px]">
          <div className="flex items-center gap-2">
            {getTimeIcon()}
            <h1 className="text-2xl font-bold text-foreground">
              {format(date, "EEEE")}
            </h1>
          </div>
          <p className="text-sm text-muted font-medium">
            {format(date, "MMMM d, yyyy")}
          </p>
        </div>
        <button
          onClick={() =>
            setSelectedDate(format(addDays(date, 1), "yyyy-MM-dd"))
          }
          className="p-2 rounded-full hover:bg-lavender-light/50 transition-colors active:scale-95"
        >
          <ChevronRight className="w-5 h-5 text-muted" />
        </button>
      </div>
      {!todaySelected && (
        <button
          onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
          className="mt-1 text-xs font-semibold text-lavender hover:text-lavender/80 transition-colors"
        >
          Back to today
        </button>
      )}
    </div>
  );
}
