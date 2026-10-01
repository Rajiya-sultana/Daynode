import type { Task } from "@/store/taskStore";

export interface CategoryDef {
  id: string;
  name: string;
  color: string;
  days?: number[]; // weekdays it shows on Today (0=Sun … 6=Sat); missing = every day
}

const MON_TO_SAT = [1, 2, 3, 4, 5, 6];

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: "office",    name: "Office",    color: "#E88C8C", days: MON_TO_SAT },
  { id: "freelance", name: "Freelance", color: "#5B8DEF", days: [0] },
  { id: "business",  name: "Business",  color: "#8B6DAF", days: MON_TO_SAT },
];

// Saved categories created before `days` existed fall back to the defaults by id
export function categoryDays(c: CategoryDef): number[] | null {
  return c.days ?? DEFAULT_CATEGORIES.find((d) => d.id === c.id)?.days ?? null;
}

export function showsOn(c: CategoryDef, date: string): boolean {
  const days = categoryDays(c);
  return !days || days.includes(new Date(date + "T12:00:00").getDay());
}

// Colours handed out to new categories, in order
export const CATEGORY_COLORS = ["#E88C8C", "#5B8DEF", "#8B6DAF", "#5BAD8A", "#F0A057", "#C9A84C", "#8A8070"];

// Tasks without an explicit category are placed by their tags
const OFFICE_TAGS   = new Set(["plan-job", "tag-work"]);
const BUSINESS_TAGS = new Set(["plan-bagbiz"]);

function inferFromTags(tags: string[]): string | null {
  if (tags.some((t) => OFFICE_TAGS.has(t)))   return "office";
  if (tags.some((t) => BUSINESS_TAGS.has(t))) return "business";
  if (tags.some((t) => t.startsWith("plan-") || t === "uiux-sprint")) return "freelance";
  return null;
}

// Returns the id of an existing category, or null when the task is uncategorised
export function getCategory(task: Pick<Task, "category" | "tags">, categories: CategoryDef[]): string | null {
  const id = task.category ?? inferFromTags(task.tags);
  return id && categories.some((c) => c.id === id) ? id : null;
}
