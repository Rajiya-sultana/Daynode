import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Profile {
  name: string;
  emoji: string;
  avatarUrl: string; // base64 or ""
}

interface UIState {
  theme: "light" | "dark";
  profile: Profile;
  lastReviewDate: string; // "yyyy-MM-dd" of last completed end-of-day review
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
  updateProfile: (p: Partial<Profile>) => void;
  setLastReviewDate: (date: string) => void;

  // ── Focus mode (session-only, not persisted) ──────────────────────────────
  focusTaskId:    string | null;
  focusDuration:  number;       // total seconds for this session
  focusStartTime: number | null; // Date.now() when last resumed
  focusElapsed:   number;       // seconds accumulated before last pause
  isFocusPaused:  boolean;
  isFocusMinimized: boolean;
  startFocus:     (taskId: string, minutes: number) => void;
  pauseFocus:     () => void;
  resumeFocus:    () => void;
  stopFocus:      () => void;
  setFocusMinimized: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      profile: { name: "My Workspace", emoji: "🌸", avatarUrl: "" },
      lastReviewDate: "",

      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

      setTheme: (t) => set({ theme: t }),

      updateProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),

      setLastReviewDate: (date) => set({ lastReviewDate: date }),

      // ── Focus mode defaults ───────────────────────────────────────────────
      focusTaskId:    null,
      focusDuration:  25 * 60,
      focusStartTime: null,
      focusElapsed:   0,
      isFocusPaused:  false,
      isFocusMinimized: false,

      startFocus: (taskId, minutes) => set({
        focusTaskId:    taskId,
        focusDuration:  minutes * 60,
        focusStartTime: Date.now(),
        focusElapsed:   0,
        isFocusPaused:  false,
        isFocusMinimized: false,
      }),

      pauseFocus: () => set((s) => ({
        isFocusPaused:  true,
        focusElapsed:   s.focusElapsed + (s.focusStartTime ? (Date.now() - s.focusStartTime) / 1000 : 0),
        focusStartTime: null,
      })),

      resumeFocus: () => set({
        isFocusPaused:  false,
        focusStartTime: Date.now(),
      }),

      stopFocus: () => set({
        focusTaskId:    null,
        focusStartTime: null,
        focusElapsed:   0,
        isFocusPaused:  false,
        isFocusMinimized: false,
      }),

      setFocusMinimized: (v) => set({ isFocusMinimized: v }),
    }),
    {
      name: "bloom-ui",
      // Only persist theme, profile, and review date — focus state is session-only
      partialize: (state) => ({
        theme:          state.theme,
        profile:        state.profile,
        lastReviewDate: state.lastReviewDate,
      }),
    }
  )
);
