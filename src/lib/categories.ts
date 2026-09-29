import type { Task } from "@/store/taskStore";

export type Category = "office" | "freelance" | "business";

export const CATEGORIES: { id: Category; name: string; color: string }[] = [
  { id: "office",    name: "Office",    color: "#E88C8C" },
  { id: "freelance", name: "Freelance", color: "#5B8DEF" },
  { id: "business",  name: "Business",  color: "#8B6DAF" },
];

// Tasks without an explicit category are placed by their tags
const OFFICE_TAGS   = new Set(["plan-job", "tag-work"]);
const BUSINESS_TAGS = new Set(["plan-bagbiz"]);

export function getCategory(task: Pick<Task, "category" | "tags">): Category | null {
  if (task.category) return task.category;
  if (task.tags.some((t) => OFFICE_TAGS.has(t)))   return "office";
  if (task.tags.some((t) => BUSINESS_TAGS.has(t))) return "business";
  if (task.tags.some((t) => t.startsWith("plan-") || t === "uiux-sprint")) return "freelance";
  return null;
}
