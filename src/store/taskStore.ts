import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { format } from "date-fns";
import { PLAN_TAGS, buildSeedTasks, buildSeedRecurring, TASK_RENAMES, REMOVED_HABITS } from "@/lib/seedPlan";
import type { Category } from "@/lib/categories";
import { UIUX_SPRINT_TAG, UIUX_SENTINEL_DATE, UIUX_SENTINEL_TITLE, buildUiUxSprintTasks } from "@/lib/seedUiUxSprint";

export type TaskStatus =
  | "pending" | "seen" | "in-progress" | "blocked" | "completed" | "cancelled";

export const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: "Pending", color: "#8A8070", bg: "#F4EFE6", icon: "○" },
  seen: { label: "Seen", color: "#5B8DEF", bg: "#EEF3FD", icon: "◉" },
  "in-progress": { label: "In Progress", color: "#F0A057", bg: "#FEF3EA", icon: "◑" },
  blocked: { label: "Blocked", color: "#E88C8C", bg: "#FDEAEA", icon: "⊗" },
  completed: { label: "Completed", color: "#5BAD8A", bg: "#E6F5EF", icon: "✓" },
  cancelled: { label: "Cancelled", color: "#B8AFA2", bg: "#F4EFE6", icon: "—" },
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
  recurringId?: string;
  estimatedMinutes?: number;
  startedAt?: string;
  actualMinutes?: number;
  priority?: "urgent" | "high";
  category?: Category;
}

export type RecurrenceType = "daily" | "weekdays" | "weekly" | "custom";

export interface RecurringTask {
  id: string;
  title: string;
  description: string;
  tags: string[];
  recurrence: RecurrenceType;
  days: number[]; // 0=Sun … 6=Sat; empty for daily/weekdays
  active: boolean;
  createdAt: string;
  startDate?: string; // yyyy-MM-dd; don't generate before this date
  endDate?: string;   // yyyy-MM-dd; don't generate after this date
  category?: Category;
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

export interface VisionItem {
  id: string;
  type: "image" | "text";
  content: string;
  label?: string;
  color?: string;
  cardStyle?: "polaroid" | "sticky" | "clipping" | "word" | "template" | "canvas";
  category?: string;
  achieved?: boolean;
  x?: number;
  y?: number;
  zIndex?: number;
  createdAt: string;
}

interface DailyHistory {
  [date: string]: { total: number; completed: number };
}

interface TaskState {
  tasks: Task[];
  tags: Tag[];
  recurringTasks: RecurringTask[];
  selectedDate: string;
  dailyHistory: DailyHistory;
  currentStreak: number;
  longestStreak: number;
  covers: Record<string, Cover>;
  journals: Record<string, string>; // date → text
  visionBoard: VisionItem[];
  planSeeded: boolean;
  uiUxSprintSeeded: boolean;

  setSelectedDate: (date: string) => void;
  addTask: (task: Omit<Task, "id" | "order" | "createdAt" | "completedAt" | "status" | "subtasks"> & { date?: string }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (date: string, taskIds: string[]) => void;
  scheduleTask: (id: string, date: string) => void;

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

  // Vision board
  addVisionItem: (item: Omit<VisionItem, "id" | "createdAt">) => void;
  deleteVisionItem: (id: string) => void;
  updateVisionItem: (id: string, updates: Partial<VisionItem>) => void;

  // Journal
  setJournal: (date: string, text: string) => void;

  // Rollover
  rolloverTasks: (fromDate: string, toDate: string) => number;

  // Recurring
  addRecurringTask: (rt: Omit<RecurringTask, "id" | "createdAt">) => void;
  updateRecurringTask: (id: string, updates: Partial<RecurringTask>) => void;
  deleteRecurringTask: (id: string) => void;
  generateForDate: (date: string) => void;

  // Export / Import
  exportData: () => void;
  importData: (json: string) => { ok: boolean; error?: string };

  // Seed plan
  seedPlan: () => void;
  seedUiUxSprint: () => void;

  getTasksForDate: (date: string) => Task[];
}

const DEFAULT_TAGS: Tag[] = [
  { id: "tag-work", name: "Work", color: "#5B8DEF" },
  { id: "tag-personal", name: "Personal", color: "#8B6DAF" },
  { id: "tag-urgent", name: "Urgent", color: "#E88C8C" },
  { id: "tag-health", name: "Health", color: "#5BAD8A" },
];

function computeStreaks(history: DailyHistory) {
  const dates = Object.keys(history).sort().reverse();
  const today = format(new Date(), "yyyy-MM-dd");
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

// Deduplicate tasks by title+date — keeps first occurrence
function deduplicateTasks(tasks: Task[]): Task[] {
  const seen = new Set<string>();
  return tasks.filter((t) => {
    const key = `${t.date}||${t.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rebuildHistory(tasks: Task[], set: (s: Partial<TaskState>) => void) {
  const history = updateDailyHistory(tasks);
  set({ tasks, dailyHistory: history, ...computeStreaks(history) });
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [], tags: DEFAULT_TAGS, recurringTasks: [],
      selectedDate: format(new Date(), "yyyy-MM-dd"),
      dailyHistory: {}, currentStreak: 0, longestStreak: 0,
      covers: {}, journals: {}, visionBoard: [], planSeeded: false, uiUxSprintSeeded: false,

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
        const date = taskData.date ?? "";
        const order = tasks.filter((t) => t.date === date).length;
        const newTask: Task = {
          ...taskData, date, id: nanoid(), status: "pending",
          subtasks: [], order, createdAt: new Date().toISOString(), completedAt: null,
        };
        rebuildHistory([...tasks, newTask], set);
      },

      updateTask: (id, updates) => {
        rebuildHistory(get().tasks.map((t) => t.id === id ? { ...t, ...updates } : t), set);
      },

      setStatus: (id, status) => {
        const now = new Date().toISOString();
        rebuildHistory(get().tasks.map((t) => {
          if (t.id !== id) return t;
          const startedAt = status === "in-progress" && !t.startedAt ? now : t.startedAt;
          const completedAt = status === "completed" ? now : t.completedAt;
          const actualMinutes = status === "completed" && startedAt
            ? Math.round((new Date(now).getTime() - new Date(startedAt).getTime()) / 60000)
            : t.actualMinutes;
          return { ...t, status, completedAt, startedAt, actualMinutes };
        }), set);
      },

      deleteTask: (id) => rebuildHistory(get().tasks.filter((t) => t.id !== id), set),

      scheduleTask: (id, date) => {
        const tasks = get().tasks;
        const order = tasks.filter((t) => t.date === date).length;
        rebuildHistory(tasks.map((t) => t.id === id ? { ...t, date, order } : t), set);
      },

      reorderTasks: (date, taskIds) => {
        const others = get().tasks.filter((t) => t.date !== date);
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

      // ── Recurring ────────────────────────────────────────────
      addRecurringTask: (rt) => {
        const task: RecurringTask = { ...rt, id: nanoid(), createdAt: new Date().toISOString() };
        set((s) => ({ recurringTasks: [...s.recurringTasks, task] }));
      },

      updateRecurringTask: (id, updates) => {
        set((s) => ({
          recurringTasks: s.recurringTasks.map((rt) => rt.id === id ? { ...rt, ...updates } : rt),
        }));
      },

      deleteRecurringTask: (id) => {
        set((s) => ({
          recurringTasks: s.recurringTasks.filter((rt) => rt.id !== id),
          // detach any generated instances so they stay but aren't re-linked
          tasks: s.tasks.map((t) => t.recurringId === id ? { ...t, recurringId: undefined } : t),
        }));
      },

      generateForDate: (date) => {
        const { tasks, recurringTasks } = get();
        const dow = new Date(date + "T12:00:00").getDay(); // 0=Sun
        const toCreate: Task[] = [];

        for (const rt of recurringTasks) {
          if (!rt.active) continue;
          if (rt.startDate && date < rt.startDate) continue;
          if (rt.endDate && date > rt.endDate) continue;
          const applies =
            rt.recurrence === "daily" ||
            (rt.recurrence === "weekdays" && dow >= 1 && dow <= 5) ||
            (rt.recurrence === "weekly" && rt.days.includes(dow)) ||
            (rt.recurrence === "custom" && rt.days.includes(dow));
          if (!applies) continue;
          const exists = tasks.some((t) => t.recurringId === rt.id && t.date === date);
          if (exists) continue;

          toCreate.push({
            id: nanoid(),
            title: rt.title,
            description: rt.description,
            date,
            deadline: "",
            status: "pending",
            tags: rt.tags,
            subtasks: [],
            order: tasks.filter((t) => t.date === date).length + toCreate.length,
            createdAt: new Date().toISOString(),
            completedAt: null,
            recurringId: rt.id,
            category: rt.category,
          });
        }

        if (toCreate.length > 0) rebuildHistory([...tasks, ...toCreate], set);
      },

      // ── Vision board ─────────────────────────────────────────
      addVisionItem: (item) => set((s) => ({
        visionBoard: [{ ...item, id: nanoid(), createdAt: new Date().toISOString() }, ...s.visionBoard],
      })),
      deleteVisionItem: (id) => set((s) => ({ visionBoard: s.visionBoard.filter((v) => v.id !== id) })),
      updateVisionItem: (id, updates) => set((s) => ({
        visionBoard: s.visionBoard.map((v) => v.id === id ? { ...v, ...updates } : v),
      })),

      // ── Rollover ─────────────────────────────────────────────
      rolloverTasks: (fromDate, toDate) => {
        const all = get().tasks;
        const incomplete = all.filter(
          (t) => t.date === fromDate && t.status !== "completed" && t.status !== "cancelled"
        );
        if (incomplete.length === 0) return 0;
        const incompleteIds = new Set(incomplete.map((t) => t.id));
        // Move tasks (remove originals so they don't re-trigger the banner)
        const remaining = all.filter((t) => !incompleteIds.has(t.id));
        const existing = remaining.filter((t) => t.date === toDate).length;
        const rolled: Task[] = incomplete.map((t, i) => ({
          ...t,
          id: nanoid(),
          date: toDate,
          status: "pending" as const,
          order: existing + i,
          createdAt: new Date().toISOString(),
          completedAt: null,
          startedAt: undefined,
          actualMinutes: undefined,
        }));
        rebuildHistory([...remaining, ...rolled], set);
        return rolled.length;
      },

      // ── Export / Import ──────────────────────────────────────
      exportData: () => {
        const { tasks, tags, covers, journals, dailyHistory, currentStreak, longestStreak } = get();
        const payload = JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), tasks, tags, covers, journals, dailyHistory, currentStreak, longestStreak },
          null, 2
        );
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
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
            tags: data.tags ?? DEFAULT_TAGS,
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

      seedPlan: () => {
        const newRecurring = buildSeedRecurring();

        // Purge retired habits and every instance of them (matched by id or title)
        const removedIds = new Set(REMOVED_HABITS.map((h) => h.id));
        const removedTitles = new Set(REMOVED_HABITS.map((h) => h.title));
        const keptRecurring = get().recurringTasks.filter(
          (rt) => !removedIds.has(rt.id) && !removedTitles.has(rt.title)
        );
        const keptTasks = get().tasks.filter(
          (t) => !(t.recurringId && removedIds.has(t.recurringId)) && !removedTitles.has(t.title)
        );

        // Always update existing plan habits with latest data (picks up startDate)
        const planHabitIds = new Set(newRecurring.map((r) => r.id));
        const updatedRecurring = keptRecurring.map((rt) => {
          if (!planHabitIds.has(rt.id)) return rt;
          const updated = newRecurring.find((r) => r.id === rt.id);
          return updated ? { ...rt, ...updated } : rt;
        });
        const existingRtIds = new Set(keptRecurring.map((r) => r.id));
        const recurringToAdd = newRecurring.filter((r) => !existingRtIds.has(r.id));

        // Remove habit instances generated outside their startDate–endDate window
        const cleanedTasks = keptTasks.filter((t) => {
          if (!t.recurringId || !planHabitIds.has(t.recurringId)) return true;
          const habit = newRecurring.find((r) => r.id === t.recurringId);
          if (habit?.startDate && t.date < habit.startDate) return false;
          if (habit?.endDate && t.date > habit.endDate) return false;
          return true;
        });

        // Tags
        const existingTagIds = new Set(get().tags.map((t) => t.id));
        const tagsToAdd = PLAN_TAGS.filter((t) => !existingTagIds.has(t.id));

        // Detect if plan tasks already exist (sentinel: first plan task title+date)
        const PLAN_SENTINEL_DATE = "2026-08-24";
        const PLAN_SENTINEL_TITLE = "Decide niche in writing: handmade + fashion D2C brands";
        const planTasksAlreadyExist = cleanedTasks.some(
          (t) => t.date === PLAN_SENTINEL_DATE && t.title === PLAN_SENTINEL_TITLE
        );

        // Apply any title renames to already-stored tasks
        const renamedTasks = cleanedTasks.map((t) => {
          const rename = TASK_RENAMES.find((r) => r.from === t.title);
          return rename ? { ...t, title: rename.to } : t;
        });

        if (!get().planSeeded && !planTasksAlreadyExist) {
          // First time seeding — add all plan tasks
          const byDate: Record<string, number> = {};
          for (const t of renamedTasks) byDate[t.date] = (byDate[t.date] ?? 0) + 1;
          const newTasks = buildSeedTasks(byDate);
          const deduped = deduplicateTasks([...renamedTasks, ...newTasks]);
          const history = updateDailyHistory(deduped);
          set({
            tasks: deduped,
            tags: [...get().tags, ...tagsToAdd],
            recurringTasks: [...updatedRecurring, ...recurringToAdd],
            dailyHistory: history,
            planSeeded: true,
            ...computeStreaks(history),
          });
        } else {
          // Already seeded (or tasks exist) — dedup, update habits, purge bad instances
          const deduped = deduplicateTasks(renamedTasks);
          const history = updateDailyHistory(deduped);
          set({
            tasks: deduped,
            tags: [...get().tags, ...tagsToAdd],
            recurringTasks: [...updatedRecurring, ...recurringToAdd],
            dailyHistory: history,
            planSeeded: true,
            ...computeStreaks(history),
          });
        }
      },

      seedUiUxSprint: () => {
        const current = get().tasks;
        const alreadyExists = current.some(
          (t) => t.date === UIUX_SENTINEL_DATE && t.title === UIUX_SENTINEL_TITLE
        );
        if (alreadyExists || get().uiUxSprintSeeded) {
          set({ uiUxSprintSeeded: true });
          return;
        }
        const existingTagIds = new Set(get().tags.map((t) => t.id));
        const byDate: Record<string, number> = {};
        for (const t of current) byDate[t.date] = (byDate[t.date] ?? 0) + 1;
        const newTasks = buildUiUxSprintTasks(byDate);
        const merged = deduplicateTasks([...current, ...newTasks]);
        const history = updateDailyHistory(merged);
        set({
          tasks: merged,
          tags: existingTagIds.has(UIUX_SPRINT_TAG.id)
            ? get().tags
            : [...get().tags, UIUX_SPRINT_TAG],
          dailyHistory: history,
          uiUxSprintSeeded: true,
          ...computeStreaks(history),
        });
      },

      getTasksForDate: (date) =>
        get().tasks.filter((t) => t.date === date).sort((a, b) => a.order - b.order),
    }),
    { name: "bloom-tasks" }
  )
);
