import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { format } from "date-fns";

export type TaskStatus =
  | "pending" | "seen" | "in-progress" | "blocked" | "completed" | "cancelled";

export const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:      { label: "Pending",     color: "#8A8070", bg: "#F4EFE6", icon: "○" },
  seen:         { label: "Seen",        color: "#5B8DEF", bg: "#EEF3FD", icon: "◉" },
  "in-progress":{ label: "In Progress", color: "#F0A057", bg: "#FEF3EA", icon: "◑" },
  blocked:      { label: "Blocked",     color: "#E88C8C", bg: "#FDEAEA", icon: "⊗" },
  completed:    { label: "Completed",   color: "#5BAD8A", bg: "#E6F5EF", icon: "✓" },
  cancelled:    { label: "Cancelled",   color: "#B8AFA2", bg: "#F4EFE6", icon: "—" },
};

export const STATUS_ORDER: TaskStatus[] = [
  "pending", "seen", "in-progress", "blocked", "completed", "cancelled",
];

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  deadline: string;
  status: TaskStatus;
  tags: string[];
  subtasks: Subtask[];
  order: number;
  createdAt: string;
  completedAt: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Cover {
  type: "gradient" | "image";
  value: string;
  positionY?: number; // 0–100, default 50 (center)
}

interface DailyHistory {
  [date: string]: { total: number; completed: number };
}

interface TaskState {
  tasks: Task[];
  tags: Tag[];
  selectedDate: string;
  dailyHistory: DailyHistory;
  currentStreak: number;
  longestStreak: number;
  covers: Record<string, Cover>;
  journals: Record<string, string>; // date → text

  setSelectedDate: (date: string) => void;
  addTask: (task: Omit<Task, "id" | "order" | "createdAt" | "completedAt" | "status" | "subtasks">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (date: string, taskIds: string[]) => void;

  // Subtasks
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, title: string) => void;

  // Tags
  addTag: (name: string, color: string) => Tag;
  deleteTag: (id: string) => void;

  // Cover
  setCover: (date: string, cover: Cover | null) => void;

  // Journal
  setJournal: (date: string, text: string) => void;

  // Export / Import
  exportData: () => void;
  importData: (json: string) => { ok: boolean; error?: string };

  getTasksForDate: (date: string) => Task[];
}

const DEFAULT_TAGS: Tag[] = [
  { id: "tag-work",     name: "Work",     color: "#5B8DEF" },
  { id: "tag-personal", name: "Personal", color: "#8B6DAF" },
  { id: "tag-urgent",   name: "Urgent",   color: "#E88C8C" },
  { id: "tag-health",   name: "Health",   color: "#5BAD8A" },
];

function computeStreaks(history: DailyHistory) {
  const dates    = Object.keys(history).sort().reverse();
  const today    = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
  let current = 0, longest = 0, streak = 0;

  for (let i = 0; i < dates.length; i++) {
    const entry = history[dates[i]];
    if (entry.total > 0 && entry.completed === entry.total) {
      streak++;
      if (i === 0 && dates[0] !== today && dates[0] !== yesterday) { current = 0; streak = 0; break; }
    } else { if (i === 0) current = 0; break; }
  }
  current = streak; streak = 0;
  for (const d of dates) {
    const e = history[d];
    if (e.total > 0 && e.completed === e.total) { streak++; longest = Math.max(longest, streak); }
    else streak = 0;
  }
  return { currentStreak: current, longestStreak: longest };
}

function updateDailyHistory(tasks: Task[]): DailyHistory {
  const history: DailyHistory = {};
  for (const t of tasks) {
    if (!history[t.date]) history[t.date] = { total: 0, completed: 0 };
    history[t.date].total++;
    if (t.status === "completed") history[t.date].completed++;
  }
  return history;
}

function rebuildHistory(tasks: Task[], set: (s: Partial<TaskState>) => void) {
  const history = updateDailyHistory(tasks);
  set({ tasks, dailyHistory: history, ...computeStreaks(history) });
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [], tags: DEFAULT_TAGS,
      selectedDate: format(new Date(), "yyyy-MM-dd"),
      dailyHistory: {}, currentStreak: 0, longestStreak: 0,
      covers: {}, journals: {},

      setSelectedDate: (date) => set({ selectedDate: date }),

      setCover: (date, cover) => set((s) => {
        const next = { ...s.covers };
        if (cover === null) delete next[date]; else next[date] = cover;
        return { covers: next };
      }),

      setJournal: (date, text) => set((s) => ({
        journals: { ...s.journals, [date]: text },
      })),

      addTask: (taskData) => {
        const tasks = get().tasks;
        const order = tasks.filter((t) => t.date === taskData.date).length;
        const newTask: Task = {
          ...taskData, id: nanoid(), status: "pending",
          subtasks: [], order, createdAt: new Date().toISOString(), completedAt: null,
        };
        rebuildHistory([...tasks, newTask], set);
      },

      updateTask: (id, updates) => {
        rebuildHistory(get().tasks.map((t) => t.id === id ? { ...t, ...updates } : t), set);
      },

      setStatus: (id, status) => {
        rebuildHistory(get().tasks.map((t) => t.id !== id ? t : {
          ...t, status,
          completedAt: status === "completed" ? new Date().toISOString() : t.completedAt,
        }), set);
      },

      deleteTask: (id) => rebuildHistory(get().tasks.filter((t) => t.id !== id), set),

      reorderTasks: (date, taskIds) => {
        const others   = get().tasks.filter((t) => t.date !== date);
        const dateTasks = get().tasks.filter((t) => t.date === date);
        const reordered = taskIds
          .map((id, i) => { const t = dateTasks.find((t) => t.id === id); return t ? { ...t, order: i } : null; })
          .filter(Boolean) as Task[];
        set({ tasks: [...others, ...reordered] });
      },

      // ── Subtasks ─────────────────────────────────────────────
      addSubtask: (taskId, title) => {
        const newSub: Subtask = { id: nanoid(), title: title.trim(), completed: false, createdAt: new Date().toISOString() };
        set({ tasks: get().tasks.map((t) => t.id !== taskId ? t : { ...t, subtasks: [...(t.subtasks ?? []), newSub] }) });
      },

      toggleSubtask: (taskId, subtaskId) => {
        set({
          tasks: get().tasks.map((t) => t.id !== taskId ? t : {
            ...t,
            subtasks: (t.subtasks ?? []).map((s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
          }),
        });
      },

      deleteSubtask: (taskId, subtaskId) => {
        set({ tasks: get().tasks.map((t) => t.id !== taskId ? t : { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) }) });
      },

      updateSubtask: (taskId, subtaskId, title) => {
        set({
          tasks: get().tasks.map((t) => t.id !== taskId ? t : {
            ...t, subtasks: (t.subtasks ?? []).map((s) => s.id === subtaskId ? { ...s, title } : s),
          }),
        });
      },

      // ── Tags ─────────────────────────────────────────────────
      addTag: (name, color) => {
        const tag: Tag = { id: nanoid(), name, color };
        set({ tags: [...get().tags, tag] });
        return tag;
      },

      deleteTag: (id) => set({
        tags: get().tags.filter((t) => t.id !== id),
        tasks: get().tasks.map((t) => ({ ...t, tags: t.tags.filter((tid) => tid !== id) })),
      }),

      // ── Export / Import ──────────────────────────────────────
      exportData: () => {
        const { tasks, tags, covers, journals, dailyHistory, currentStreak, longestStreak } = get();
        const payload = JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), tasks, tags, covers, journals, dailyHistory, currentStreak, longestStreak },
          null, 2
        );
        const blob = new Blob([payload], { type: "application/json" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `daynode-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      importData: (json: string) => {
        try {
          const data = JSON.parse(json);
          if (!data.tasks || !Array.isArray(data.tasks)) return { ok: false, error: "Invalid backup file." };
          const history = updateDailyHistory(data.tasks);
          set({
            tasks: data.tasks,
            tags:  data.tags  ?? DEFAULT_TAGS,
            covers: data.covers ?? {},
            journals: data.journals ?? {},
            dailyHistory: history,
            ...computeStreaks(history),
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Could not parse the file." };
        }
      },

      getTasksForDate: (date) =>
        get().tasks.filter((t) => t.date === date).sort((a, b) => a.order - b.order),
    }),
    { name: "bloom-tasks" }
  )
);
