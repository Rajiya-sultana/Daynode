import { useEffect, useRef, useState } from "react";
import { useTaskStore } from "@/store/taskStore";
import { supabase, supabaseEnabled, getDeviceId } from "@/lib/supabase";

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "disabled";

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(supabaseEnabled ? "idle" : "disabled");
  const lastSync = useRef<number>(0);
  const timer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const store    = useTaskStore();

  async function push() {
    if (!supabase || !supabaseEnabled) return;
    setStatus("syncing");
    try {
      const deviceId = getDeviceId();
      const data = {
        tasks: store.tasks,
        tags: store.tags,
        covers: store.covers,
        journals: store.journals,
        dailyHistory: store.dailyHistory,
        currentStreak: store.currentStreak,
        longestStreak: store.longestStreak,
      };
      const { error } = await supabase
        .from("bloom_sync")
        .upsert({ device_id: deviceId, data, synced_at: new Date().toISOString() });

      if (error) throw error;
      lastSync.current = Date.now();
      setStatus("synced");
    } catch {
      setStatus("error");
    }
  }

  async function pull() {
    if (!supabase || !supabaseEnabled) {
      // No Supabase — seed plan immediately
      useTaskStore.getState().seedPlan();
      return;
    }
    try {
      // Pull the most recently synced record across ALL devices (single-user app)
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
            tasks: remote.tasks as never,
            tags: (remote.tags ?? []) as never,
            covers: (remote.covers ?? {}) as never,
            journals: (remote.journals ?? {}) as never,
            dailyHistory: (remote.dailyHistory ?? {}) as never,
            currentStreak: (remote.currentStreak ?? 0) as number,
            longestStreak: (remote.longestStreak ?? 0) as number,
          });
          // Data restored from Supabase — seed plan on top if not already done
          useTaskStore.getState().seedPlan();
          return;
        }
      }
    } catch {
      // silent
    }
    // Nothing in Supabase yet — seed the plan as starting data
    useTaskStore.getState().seedPlan();
  }

  // Pull on mount (restore data on new device/browser, then seed if needed)
  useEffect(() => {
    pull();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push on store changes
  useEffect(() => {
    if (!supabaseEnabled) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(push, 3000); // 3s debounce
    return () => clearTimeout(timer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.tasks, store.journals, store.covers]);

  // Auto-push every 30s
  useEffect(() => {
    if (!supabaseEnabled) return;
    const interval = setInterval(push, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, push };
}
