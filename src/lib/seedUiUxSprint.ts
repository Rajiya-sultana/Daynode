import type { Task, Tag } from "@/store/taskStore";

export const UIUX_SPRINT_TAG: Tag = {
  id: "uiux-sprint",
  name: "UI/UX Sprint",
  color: "#8B5CF6",
};

// Sentinel — used to detect whether sprint tasks already exist
export const UIUX_SENTINEL_DATE  = "2026-07-17";
export const UIUX_SENTINEL_TITLE = "Learn: Design Rules — Section 4 Typography & Imagery (lectures 34–39)";

function t(date: string, title: string, existingCount: number): Task {
  return {
    id: `uiux-${date}-${title.slice(0, 20).replace(/\s/g, "-")}`,
    title,
    description: "",
    date,
    deadline: "",
    status: "pending",
    tags: ["uiux-sprint"],
    subtasks: [],
    order: existingCount,
    createdAt: `${date}T12:00:00.000Z`,
    completedAt: null,
  };
}

export function buildUiUxSprintTasks(existingByDate: Record<string, number>): Task[] {
  const tasks: [string, string][] = [
    // Week 1 — Strategy
    ["2026-07-17", "Learn: Design Rules — Section 4 Typography & Imagery (lectures 34–39)"],
    ["2026-07-17", "Practice: Screenshot any app screen — list typography rules it breaks or follows"],
    ["2026-07-18", "Learn: Design Rules — Section 5 Visual Cues (lectures 40–44)"],
    ["2026-07-18", "Practice: Sketch a simplified version of a cluttered screen — remove 2 visual cues"],
    ["2026-07-19", "Learn: Design Rules — finish Section 5 (45–48) + Section 6 Recap (49)"],
    ["2026-07-19", "Practice: Save the 19 UI Design Mantras as a cheat sheet"],
    ["2026-07-20", "Learn: UX Fundamentals — Section 1 What is UXD? (all 4 lectures)"],
    ["2026-07-20", "Practice: Write 3 sentences on what UXD is NOT — in your own words"],
    ["2026-07-21", "Learn: UX Fundamentals — Section 2 Elements of UX (all 3 lectures)"],
    ["2026-07-21", "Practice: Draw the 5 Planes (Strategy/Scope/Structure/Skeleton/Surface) from memory"],
    ["2026-07-22", "Learn: UX Fundamentals — Section 3 Strategy (lectures 1–4)"],
    ["2026-07-22", "Practice: Answer Identifying B2B/B2C User Needs for one other Bizlyft brand"],
    ["2026-07-22", "Build: Open Figma file — name it \"watch.learnwhatmatters.in — UX Project\""],
    ["2026-07-23", "Learn: UX Fundamentals — finish Section 3 (Three Crucial Questions → Strategy Lab)"],
    ["2026-07-23", "Build: Write 1-page Strategy brief in Figma — business goal, user, three crucial questions"],
    // Week 2 — Figma fluency + Scope/Structure
    ["2026-07-24", "Learn: Complete UI/UX Course — Start Here + Day 1 (Splash & Sign In screens)"],
    ["2026-07-24", "Practice: Build exact splash/sign-in screens from the course in a scratch Figma file"],
    ["2026-07-25", "Learn: Complete UI/UX Course — Day 2 (Frames, Layout & Spacing) + Day 3 (Components)"],
    ["2026-07-25", "Practice: Rebuild the component exercise from scratch without looking at the video"],
    ["2026-07-26", "Learn: Complete UI/UX Course — Day 4 (Home Page & Variants)"],
    ["2026-07-26", "Practice: Create 3 button variants (default/hover/disabled) in a throwaway Figma file"],
    ["2026-07-27", "Learn: Complete UI/UX Course — Day 5 (Iconography)"],
    ["2026-07-27", "Practice: Design or source 5 icons for your app (play, pause, progress, bookmark, profile)"],
    ["2026-07-27", "Build: Save those 5 icons into the project Figma file"],
    ["2026-07-28", "Learn: UX Fundamentals — Section 4 Scope (lectures 1–3)"],
    ["2026-07-28", "Build: List every screen the app needs (auth, home, library, player, progress, search, profile, settings, Amazon verification)"],
    ["2026-07-29", "Learn: UX Fundamentals — finish Section 4 (Generating Requirements → Scope Lab)"],
    ["2026-07-29", "Build: Write a one-line functional spec for each screen"],
    ["2026-07-30", "Learn: UX Fundamentals — Section 5 Structure (all 7 lectures)"],
    ["2026-07-30", "Build: Build sitemap in FigJam — how all screens connect to each other"],
    // Week 3 — Flow + Wireframes
    ["2026-07-31", "Practice: Sketch user flow for ordering food on Zomato (paper, 5 min)"],
    ["2026-07-31", "Build: User flow diagram — new user journey (bought book → verify → first watch)"],
    ["2026-08-01", "Build: User flow diagram — returning user (resume progress) + Amazon buyer verification edge case"],
    ["2026-08-02", "Learn: UX Fundamentals — Section 6 Skeleton (lectures 1–4)"],
    ["2026-08-02", "Practice: Wireframe a random app screen (low-fi boxes) in under 10 minutes"],
    ["2026-08-03", "Learn: UX Fundamentals — finish Section 6 (Information Design, Wireframes, Skeleton Lab)"],
    ["2026-08-04", "Build: Low-fi wireframes — Login/Auth + Home screen"],
    ["2026-08-05", "Build: Low-fi wireframes — Video Library + Video Player screen"],
    ["2026-08-06", "Build: Low-fi wireframes — Progress/Dashboard + Profile/Settings"],
    ["2026-08-06", "Build: Review full wireframe set against flow diagrams — walk both user journeys screen by screen"],
    // Week 4 — Surface + High-Fidelity
    ["2026-08-07", "Learn: UX Fundamentals — Section 7 Surface (lectures 1–3)"],
    ["2026-08-07", "Practice: Apply \"Following the Eye\" — mark eye-path order on one of your wireframes"],
    ["2026-08-08", "Learn: UX Fundamentals — finish Section 7 (Contrast, Consistency, Color & Typography)"],
    ["2026-08-09", "Build: Design system in Figma — typography scale + color palette"],
    ["2026-08-10", "Learn: (optional) Complete UI/UX Course — Design Like a Pro section"],
    ["2026-08-10", "Build: Design system — buttons, inputs, component variants"],
    ["2026-08-11", "Build: High-fidelity design — Login/Auth + Home screen"],
    ["2026-08-12", "Build: High-fidelity design — Video Library + Video Player screen"],
    ["2026-08-13", "Build: High-fidelity design — Progress/Dashboard + Profile/Settings screen"],
    // Final stretch
    ["2026-08-14", "Build: Wire up clickable prototype connecting all screens per user flows"],
    ["2026-08-15", "Build: Test prototype end-to-end as a real user. Fix gaps + tighten spacing using Mantras cheat sheet"],
    ["2026-08-16", "Build: Write case study — problem → process → outcome. Post as build-in-public thread on X @HeyRajiya"],
  ];

  const countByDate: Record<string, number> = { ...existingByDate };
  return tasks.map(([date, title]) => {
    const c = countByDate[date] ?? 0;
    countByDate[date] = c + 1;
    return t(date, title, c);
  });
}
