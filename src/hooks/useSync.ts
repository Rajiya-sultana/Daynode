import { useEffect, useRef, useState } from "react";
import { useTaskStore } from "@/store/taskStore";
import { supabase, supabaseEnabled, getDeviceId } from "@/lib/supabase";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "disabled";

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(supabaseEnabled ? "idle" : "disabled");
  const lastSync = useRef<number>(0);
  const timer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pulled   = useRef(false); // never push before this tab has loaded the latest data
  const dirty    = useRef(false); // local changes not yet pushed
  const store    = useTaskStore();

  async function push() {
    if (!supabase || !supabaseEnabled || !pulled.current) return;
    dirty.current = false;
    setStatus("syncing");
    try {
      const deviceId = getDeviceId();
      const s = useTaskStore.getState();
      const data = {
        tasks:             s.tasks,
        tags:              s.tags,
        recurringTasks:    s.recurringTasks,
        covers:            s.covers,
        journals:          s.journals,
        dailyHistory:      s.dailyHistory,
        currentStreak:     s.currentStreak,
        longestStreak:     s.longestStreak,
        planSeeded:        s.planSeeded,
        uiUxSprintSeeded:  s.uiUxSprintSeeded,
        categories:          s.categories,
        removedRecurringIds: s.removedRecurringIds,
      };
      const { error } = await supabase
        .from("bloom_sync")
        .upsert({ device_id: deviceId, data, synced_at: new Date().toISOString() });

      if (error) throw error;
      lastSync.current = Date.now();
      dirty.current = false;
      setStatus("synced");
    } catch {
      dirty.current = true;
      setStatus("error");
    }
  }

  async function pull() {
    try {
      await pullInner();
    } finally {
      pulled.current = true;
    }
  }

  async function pullInner() {
    if (!supabase || !supabaseEnabled) {
      useTaskStore.getState().seedPlan();
      return;
    }
    try {
      // Pull the most recently synced record across all devices (single-user app)
      const { data, error } = await supabase
        .from("bloom_sync")
        .select("data, synced_at")
        .order("synced_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        const remote = data.data as Record<string, unknown>;
        if (Array.isArray(remote.tasks) && remote.tasks.length > 0) {
          useTaskStore.setState({
            tasks:          remote.tasks          as never,
            tags:           (remote.tags   ?? []) as never,
            recurringTasks: (remote.recurringTasks ?? []) as never,
            covers:         (remote.covers ?? {}) as never,
            journals:       (remote.journals ?? {}) as never,
            dailyHistory:   (remote.dailyHistory ?? {}) as never,
            currentStreak:  (remote.currentStreak ?? 0) as number,
            longestStreak:  (remote.longestStreak ?? 0) as number,
            planSeeded:        (remote.planSeeded ?? false) as boolean,
            uiUxSprintSeeded:  (remote.uiUxSprintSeeded ?? false) as boolean,
            categories:          (remote.categories ?? DEFAULT_CATEGORIES) as never,
            removedRecurringIds: (remote.removedRecurringIds ?? []) as never,
          });
          useTaskStore.getState().seedPlan();
          useTaskStore.getState().seedUiUxSprint();
          return;
        }
      }
    } catch {
      // silent
    }
    // Nothing in Supabase — fresh start, seed the plan
    useTaskStore.getState().seedPlan();
    useTaskStore.getState().seedUiUxSprint();
  }

  // Pull on mount (restores data, then seeds/updates plan habits)
  useEffect(() => {
    pull();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push on store changes
  useEffect(() => {
    if (!supabaseEnabled || !pulled.current) return;
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(push, 3000);
    return () => clearTimeout(timer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.tasks, store.journals, store.covers, store.recurringTasks, store.categories]);

  // Only push real changes — a tab left open must never re-upload stale data.
  // Leaving the tab flushes pending changes; coming back reloads the latest data.
  useEffect(() => {
    if (!supabaseEnabled) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (dirty.current) { clearTimeout(timer.current); push(); }
      } else if (!dirty.current) {
        pull();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, push };
}
