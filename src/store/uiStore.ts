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
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
  updateProfile: (p: Partial<Profile>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      profile: { name: "My Workspace", emoji: "🌸", avatarUrl: "" },

      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

      setTheme: (t) => set({ theme: t }),

      updateProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),
    }),
    { name: "bloom-ui" }
  )
);
