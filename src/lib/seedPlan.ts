import { nanoid } from "nanoid";
import type { Task, Tag, RecurringTask } from "@/store/taskStore";

// ── Plan tags (stable IDs so re-running never duplicates) ────────────────────
export const PLAN_TAGS: Tag[] = [
  { id: "plan-outreach",  name: "Outreach",  color: "#F0A057" },
  { id: "plan-upwork",    name: "Upwork",    color: "#5B8DEF" },
  { id: "plan-uiux",      name: "UI/UX",     color: "#8B6DAF" },
  { id: "plan-delivery",  name: "Delivery",  color: "#5BAD8A" },
  { id: "plan-content",   name: "Content",   color: "#E88C8C" },
  { id: "plan-setup",     name: "Setup",     color: "#8A8070" },
  { id: "plan-portfolio", name: "Portfolio", color: "#5BAD8A" },
  { id: "plan-money",     name: "Money",     color: "#C9A84C" },
  { id: "plan-sales",     name: "Sales",     color: "#F0A057" },
  { id: "plan-retainer",  name: "Retainer",  color: "#5B8DEF" },
  { id: "plan-proof",     name: "Proof",     color: "#5BAD8A" },
  { id: "plan-tracking",  name: "Tracking",  color: "#8A8070" },
  { id: "plan-review",    name: "Review",    color: "#8B6DAF" },
  { id: "plan-systems",   name: "Systems",   color: "#5B8DEF" },
  { id: "plan-legal",     name: "Legal",     color: "#E88C8C" },
  { id: "plan-milestone", name: "Milestone", color: "#C9A84C" },
  { id: "plan-bagbiz",    name: "Bag Biz",   color: "#8B6DAF" },
  { id: "plan-planning",  name: "Planning",  color: "#5B8DEF" },
  { id: "plan-decision",  name: "Decision",  color: "#C9A84C" },
  { id: "plan-job",       name: "Job",       color: "#E88C8C" },
  { id: "plan-research",  name: "Research",  color: "#5BAD8A" },
];

// Maps plan JSON tag slugs → stable tag IDs
const SLUG_TO_ID: Record<string, string> = {
  outreach:  "plan-outreach",
  upwork:    "plan-upwork",
  uiux:      "plan-uiux",
  delivery:  "plan-delivery",
  content:   "plan-content",
  setup:     "plan-setup",
  portfolio: "plan-portfolio",
  money:     "plan-money",
  sales:     "plan-sales",
  retainer:  "plan-retainer",
  proof:     "plan-proof",
  tracking:  "plan-tracking",
  review:    "plan-review",
  systems:   "plan-systems",
  legal:     "plan-legal",
  milestone: "plan-milestone",
  bagbiz:    "plan-bagbiz",
  planning:  "plan-planning",
  decision:  "plan-decision",
  job:       "plan-job",
  research:  "plan-research",
  // intentionally unmapped (no task tag created): habit, hobby, rest
};

function toTagIds(slugs: string[]): string[] {
  return slugs.map((s) => SLUG_TO_ID[s]).filter(Boolean);
}

// ── Raw task data ─────────────────────────────────────────────────────────────
type RawTask = { title: string; date: string; tags: string[] };

const RAW_TASKS: RawTask[] = [
  // ── August Prep Week ────────────────────────────────────────────────────────
  { title: "Decide niche in writing: handmade + fashion D2C brands",                      date: "2026-08-24", tags: ["setup"] },
  { title: "Open a free Shopify development store for practice builds",                    date: "2026-08-24", tags: ["setup"] },
  { title: "Find 3 small stores with visible problems (slow, bad mobile, weak product page)", date: "2026-08-25", tags: ["portfolio"] },
  { title: "Start Payoneer OR Wise account verification (takes days — do it now)",         date: "2026-08-25", tags: ["money", "setup"] },
  { title: "Build before/after example #1 — speed + mobile fix",                          date: "2026-08-26", tags: ["portfolio"] },
  { title: "Build before/after example #2 — product page redesign (use your UI/UX)",      date: "2026-08-27", tags: ["portfolio", "uiux"] },
  { title: "Build before/after example #3 — homepage redesign",                           date: "2026-08-28", tags: ["portfolio", "uiux"] },
  { title: "Write Upwork profile: title, photo, overview, 3 portfolio items",             date: "2026-08-29", tags: ["upwork", "setup"] },
  { title: "Rewrite Instagram bio: 'I fix and design Shopify stores' + DM CTA",           date: "2026-08-29", tags: ["content", "setup"] },
  { title: "Build prospect list #1 — 40 Indian handmade/fashion Shopify stores",          date: "2026-08-29", tags: ["outreach"] },
  { title: "Write 3 DM templates (slow site / bad mobile / weak product page)",           date: "2026-08-29", tags: ["outreach"] },

  // ── September W1 (Aug 31 – Sep 6) ──────────────────────────────────────────
  { title: "Confirm Payoneer/Wise verification is complete",                              date: "2026-09-04", tags: ["money"] },
  { title: "Send 75 DMs this week (12-15/day) to Indian stores",                         date: "2026-09-05", tags: ["outreach"] },
  { title: "Send 25 Upwork proposals (filter: posted last 24 hrs)",                      date: "2026-09-05", tags: ["upwork"] },
  { title: "Record 4 Loom audits (2 min each) for the most promising stores",            date: "2026-09-05", tags: ["outreach"] },
  { title: "Post 3 reels: '3 mistakes on Shopify product pages'",                        date: "2026-09-05", tags: ["content"] },

  // ── September W2 (Sep 7 – Sep 13) ──────────────────────────────────────────
  { title: "Send 75 more DMs + follow up once with non-repliers from W1",               date: "2026-09-12", tags: ["outreach"] },
  { title: "Send 25 Upwork proposals",                                                   date: "2026-09-12", tags: ["upwork"] },
  { title: "Get on 2 calls/chats with interested store owners",                          date: "2026-09-12", tags: ["sales"] },
  { title: "Post 3 reels",                                                               date: "2026-09-12", tags: ["content"] },
  { title: "Review: which DM template got most replies? Kill the other two.",            date: "2026-09-12", tags: ["tracking"] },

  // ── September W3 (Sep 14 – Sep 20) ─────────────────────────────────────────
  { title: "Build prospect list #2 — 40 more Indian stores",                            date: "2026-09-16", tags: ["outreach"] },
  { title: "Close first paid project (price it small and fair — proof over profit)",    date: "2026-09-19", tags: ["sales", "milestone"] },
  { title: "Send 75 DMs + 25 Upwork proposals",                                         date: "2026-09-19", tags: ["outreach", "upwork"] },
  { title: "Post 3 reels",                                                               date: "2026-09-19", tags: ["content"] },

  // ── September W4 (Sep 21 – Sep 27) ─────────────────────────────────────────
  { title: "Deliver first client project on time",                                       date: "2026-09-25", tags: ["delivery", "milestone"] },
  { title: "Ask that client for a written testimonial + permission to show before/after", date: "2026-09-26", tags: ["proof"] },
  { title: "Pitch the Store Care Plan to that client before the project closes",         date: "2026-09-26", tags: ["sales", "retainer"] },
  { title: "Write your international DM template (slightly different tone)",             date: "2026-09-26", tags: ["outreach"] },
  { title: "Build prospect list #3 — 40 US/UK/AU stores for October",                   date: "2026-09-26", tags: ["outreach"] },
  { title: "MONTH REVIEW: messages sent, reply rate, clients, income",                  date: "2026-09-26", tags: ["review", "milestone"] },

  // ── October W1 (Sep 28 – Oct 4) ─────────────────────────────────────────────
  { title: "Write a 1-page Store Care Plan offer (what's included, price, response time)", date: "2026-09-29", tags: ["retainer", "setup"] },
  { title: "Pitch Care Plan to every past + current client",                             date: "2026-10-02", tags: ["retainer", "sales"] },
  { title: "Start international outreach — 10 India + 10 international DMs daily",      date: "2026-10-03", tags: ["outreach"] },
  { title: "Post 3 reels (add one in English aimed at US/UK owners)",                   date: "2026-10-03", tags: ["content"] },

  // ── October W2 (Oct 5 – Oct 11) ─────────────────────────────────────────────
  { title: "Join 3 Shopify/ecommerce Facebook groups, answer questions daily",          date: "2026-10-07", tags: ["outreach"] },
  { title: "Sign retainer client #1",                                                   date: "2026-10-10", tags: ["retainer", "milestone"] },
  { title: "75 DMs (half international) + 25 Upwork proposals",                        date: "2026-10-10", tags: ["outreach", "upwork"] },
  { title: "Post 3 reels",                                                              date: "2026-10-10", tags: ["content"] },

  // ── October W3 (Oct 12 – Oct 18) ────────────────────────────────────────────
  { title: "Increase quoted price by 30% for all NEW leads (old clients unchanged)",    date: "2026-10-12", tags: ["money"] },
  { title: "Sign retainer client #2",                                                   date: "2026-10-17", tags: ["retainer", "milestone"] },
  { title: "75 DMs + 25 Upwork proposals",                                             date: "2026-10-17", tags: ["outreach", "upwork"] },
  { title: "Post 3 reels",                                                             date: "2026-10-17", tags: ["content"] },

  // ── October W4 (Oct 19 – Oct 25) ────────────────────────────────────────────
  { title: "Write a simple onboarding checklist for new clients (saves hours)",         date: "2026-10-21", tags: ["systems"] },
  { title: "Create a reusable proposal + invoice template",                             date: "2026-10-22", tags: ["systems"] },
  { title: "75 DMs + 25 Upwork proposals",                                             date: "2026-10-24", tags: ["outreach", "upwork"] },
  { title: "MONTH REVIEW: income vs salary %, retainers signed, best lead source",     date: "2026-10-24", tags: ["review", "milestone"] },

  // ── November W1 (Oct 26 – Nov 1) ────────────────────────────────────────────
  { title: "Shift to 70% international outreach (higher pay per hour)",                 date: "2026-10-26", tags: ["outreach"] },
  { title: "Sign retainer client #3",                                                   date: "2026-10-31", tags: ["retainer", "milestone"] },
  { title: "75 DMs + 25 Upwork proposals",                                             date: "2026-10-31", tags: ["outreach", "upwork"] },
  { title: "Post 3 reels",                                                             date: "2026-10-31", tags: ["content"] },

  // ── November W2 (Nov 2 – Nov 8) ─────────────────────────────────────────────
  { title: "Calculate exact monthly expenses — the real number you must earn",          date: "2026-11-03", tags: ["money"] },
  { title: "Register sole proprietorship / firm name",                                  date: "2026-11-04", tags: ["legal"] },
  { title: "Open a current account (business bank account)",                            date: "2026-11-06", tags: ["money", "legal"] },
  { title: "Check if GST registration applies to you (ask a CA — 1 short call)",       date: "2026-11-06", tags: ["legal"] },
  { title: "75 DMs + 25 Upwork proposals",                                             date: "2026-11-07", tags: ["outreach", "upwork"] },

  // ── November W3 (Nov 9 – Nov 15) ────────────────────────────────────────────
  { title: "Ask every happy client for 1 referral",                                     date: "2026-11-12", tags: ["sales"] },
  { title: "Sign retainer client #4",                                                   date: "2026-11-14", tags: ["retainer", "milestone"] },
  { title: "Collect 3 written testimonials, add to Upwork + Instagram highlights",     date: "2026-11-14", tags: ["proof"] },
  { title: "75 DMs + 25 Upwork proposals",                                             date: "2026-11-14", tags: ["outreach", "upwork"] },

  // ── November W4 (Nov 16 – Nov 22) ───────────────────────────────────────────
  { title: "Book January work with existing clients while still salaried",              date: "2026-11-20", tags: ["sales"] },
  { title: "Save every rupee of freelance income — target 3 months expenses",          date: "2026-11-21", tags: ["money"] },
  { title: "75 DMs + 25 Upwork proposals",                                             date: "2026-11-21", tags: ["outreach", "upwork"] },

  // ── November W5 — Decision Week (Nov 23 – Nov 29) ───────────────────────────
  { title: "Add up November income. Compare to salary.",                                date: "2026-11-28", tags: ["review", "milestone"] },
  { title: "Check the 3 conditions: 3 months savings + 2 signed retainers + January work booked", date: "2026-11-28", tags: ["review", "milestone"] },
  { title: "DECIDE: resign in December OR push to February. Write the reason down.",   date: "2026-11-28", tags: ["decision", "milestone"] },

  // ── December W1 (Nov 30 – Dec 6) ────────────────────────────────────────────
  { title: "Submit resignation (only if conditions met) — stay professional, good exit matters", date: "2026-12-01", tags: ["job", "milestone"] },
  { title: "Keep outreach running — do NOT stop because you resigned",                 date: "2026-12-05", tags: ["outreach"] },
  { title: "Post 3 reels — share the journey now, it builds trust",                   date: "2026-12-05", tags: ["content"] },

  // ── December W2 (Dec 7 – Dec 13) ────────────────────────────────────────────
  { title: "Confirm January work in writing with every retainer client",               date: "2026-12-10", tags: ["sales"] },
  { title: "Sign 1 more retainer as a cushion",                                        date: "2026-12-12", tags: ["retainer"] },
  { title: "75 DMs + 25 Upwork proposals",                                            date: "2026-12-12", tags: ["outreach", "upwork"] },

  // ── December W3 (Dec 14 – Dec 20) ───────────────────────────────────────────
  { title: "Ask 3 D2C clients about their landed cost, margins, shipping, what sells", date: "2026-12-16", tags: ["bagbiz", "research"] },
  { title: "Shortlist 5 suppliers on Alibaba/1688, get quotes + samples pricing",     date: "2026-12-18", tags: ["bagbiz", "research"] },
  { title: "Calculate true cost: product + shipping + customs + returns + ads",        date: "2026-12-19", tags: ["bagbiz", "money"] },
  { title: "Order ONE small sample batch (max INR 20000). No bulk stock.",             date: "2026-12-19", tags: ["bagbiz", "milestone"] },

  // ── December W4 (Dec 21 – Dec 31) ───────────────────────────────────────────
  { title: "Set 2027 Q1 target: 6 retainer clients + income 1.5x old salary",         date: "2026-12-28", tags: ["planning"] },
  { title: "Plan Jan: test bag samples with INR 5000 ad spend before ordering stock",  date: "2026-12-29", tags: ["bagbiz", "planning"] },
  { title: "YEAR REVIEW: what worked, what wasted time, what to double down on",       date: "2026-12-30", tags: ["review", "milestone"] },
  { title: "Last working day — leave on good terms, they may refer you clients",       date: "2026-12-31", tags: ["job", "milestone"] },
];

// ── Recurring habits ──────────────────────────────────────────────────────────
type RawHabit = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  recurrence: "daily" | "weekdays" | "weekly" | "custom";
  days: number[]; // 0=Sun … 6=Sat
  startDate: string;
  endDate: string;
};

const RAW_HABITS: RawHabit[] = [
  {
    id: "plan-habit-outreach",
    title: "Message 3 store owners (IG DM / email)",
    description: "19:00–19:45 · Outreach block",
    tags: ["outreach"],
    recurrence: "weekdays",
    days: [],
    startDate: "2026-08-24",
    endDate: "2026-12-31",
  },
  {
    id: "plan-habit-upwork",
    title: "Send 1 Upwork proposal (posted last 24 hrs)",
    description: "19:45–20:15 · Upwork block",
    tags: ["upwork"],
    recurrence: "weekdays",
    days: [],
    startDate: "2026-08-24",
    endDate: "2026-12-31",
  },
  {
    id: "plan-habit-uiux",
    title: "UI/UX practice 30 min — apply to a real store design",
    description: "21:15–21:45 · UI/UX block",
    tags: ["uiux"],
    recurrence: "weekdays",
    days: [],
    startDate: "2026-08-24",
    endDate: "2026-12-31",
  },
  {
    id: "plan-habit-tracker",
    title: "Update tracker — messages sent, replies, calls, money in",
    description: "Daily end-of-session log",
    tags: ["tracking"],
    recurrence: "custom",
    days: [1, 2, 3, 4, 5, 6], // Mon–Sat
    startDate: "2026-08-24",
    endDate: "2026-12-31",
  },
  {
    id: "plan-habit-saturday",
    title: "Batch record 3 reels + build next week's prospect list",
    description: "20:00–21:00 Saturday · Content + outreach prep",
    tags: ["content", "outreach"],
    recurrence: "custom",
    days: [6], // Saturday only
    startDate: "2026-08-24",
    endDate: "2026-12-31",
  },
];

// ── Build store-ready objects ─────────────────────────────────────────────────
export function buildSeedTasks(existingTasksByDate: Record<string, number>): Task[] {
  const now = new Date().toISOString();
  const byDate: Record<string, number> = { ...existingTasksByDate };

  return RAW_TASKS.map((raw) => {
    const tagIds = toTagIds(raw.tags);
    const order = byDate[raw.date] ?? 0;
    byDate[raw.date] = order + 1;

    return {
      id: nanoid(),
      title: raw.title,
      description: "",
      date: raw.date,
      deadline: "",
      status: "pending" as const,
      tags: tagIds,
      subtasks: [],
      order,
      createdAt: now,
      completedAt: null,
    };
  });
}

export function buildSeedRecurring(): RecurringTask[] {
  const now = new Date().toISOString();
  return RAW_HABITS.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    tags: toTagIds(h.tags),
    recurrence: h.recurrence,
    days: h.days,
    active: true,
    createdAt: now,
    startDate: h.startDate,
    endDate: h.endDate,
  }));
}

// Retired habits — the habit and all its instances are purged on every seedPlan run
export const REMOVED_HABITS: { id: string; title: string }[] = [
  { id: "plan-habit-reel", title: "Post 1 Instagram reel (Shopify tip / fix)" },
];

// Task title renames — applied on every seedPlan run to fix existing stored tasks
export const TASK_RENAMES: { from: string; to: string }[] = [
  {
    from: "Send 4-5 Upwork proposals (posted last 24 hrs)",
    to:   "Send 1 Upwork proposal (posted last 24 hrs)",
  },
  {
    from: "Send 2 Upwork proposals (posted last 24 hrs)",
    to:   "Send 1 Upwork proposal (posted last 24 hrs)",
  },
  {
    from: "Message 12-15 store owners (IG DM / email)",
    to:   "Message 3 store owners (IG DM / email)",
  },
];
