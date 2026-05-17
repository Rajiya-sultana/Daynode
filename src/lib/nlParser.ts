import { format, addDays, startOfDay } from "date-fns";

export interface NLParseResult {
  title: string;
  date: string | null;           // yyyy-MM-dd
  priority: "urgent" | "high" | null;
  matchedTagNames: string[];     // tag names matched via #hashtag
  tokens: string[];              // human-readable chips for the preview UI
}

type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_MAP: Record<string, DayIndex> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function nearestWeekday(dayIdx: DayIndex, from: Date): Date {
  const diff = ((dayIdx - from.getDay()) + 7) % 7;
  return addDays(from, diff === 0 ? 7 : diff);
}

export function parseNL(
  input: string,
  tagNames: string[] = [],
  today: Date = new Date(),
): NLParseResult {
  let text       = input;
  let date: string | null = null;
  let priority: "urgent" | "high" | null = null;
  const matchedTagNames: string[] = [];
  const tokens: string[] = [];

  function trySetDate(d: Date, label: string) {
    if (date) return false;
    date = format(startOfDay(d), "yyyy-MM-dd");
    tokens.push(`📅 ${label}`);
    return true;
  }

  // ── Relative days ─────────────────────────────────────────────
  text = text.replace(/\b(today|tonight)\b/gi,          () => { trySetDate(today, "Today");                     return "§"; });
  text = text.replace(/\b(tomorrow|tmr|tmrw)\b/gi,      () => { trySetDate(addDays(today, 1), "Tomorrow");      return "§"; });
  text = text.replace(/\bnext\s+week\b/gi,              () => { trySetDate(addDays(today, 7), "Next week");     return "§"; });
  text = text.replace(/\bin\s+(\d+)\s+(days?|weeks?)\b/gi, (_, n, unit) => {
    const days = /w/i.test(unit) ? Number(n) * 7 : Number(n);
    trySetDate(addDays(today, days), `In ${n} ${unit}`);
    return "§";
  });

  // ── Named weekdays: "friday", "next monday", "on wed" ─────────
  const dayPat = Object.keys(DAY_MAP).join("|");
  text = text.replace(
    new RegExp(`\\b(?:next\\s+|this\\s+|on\\s+)?(${dayPat})\\b`, "gi"),
    (_, day) => {
      const idx = DAY_MAP[day.toLowerCase()];
      if (idx === undefined) return _;
      const label = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
      trySetDate(nearestWeekday(idx, today), label);
      return "§";
    },
  );

  // ── Specific dates: "May 25", "25th May", "Dec 5th" ──────────
  const monPat = Object.keys(MONTH_MAP).join("|");
  // Month Day
  text = text.replace(
    new RegExp(`\\b(${monPat})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "gi"),
    (_, mon, day) => {
      const m = MONTH_MAP[mon.toLowerCase()];
      const d = new Date(today.getFullYear(), m, Number(day));
      if (d < today) d.setFullYear(d.getFullYear() + 1);
      trySetDate(d, `${mon} ${day}`);
      return "§";
    },
  );
  // Day Month
  text = text.replace(
    new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monPat})\\b`, "gi"),
    (_, day, mon) => {
      const m = MONTH_MAP[mon.toLowerCase()];
      const d = new Date(today.getFullYear(), m, Number(day));
      if (d < today) d.setFullYear(d.getFullYear() + 1);
      trySetDate(d, `${day} ${mon}`);
      return "§";
    },
  );

  // ── Priority ──────────────────────────────────────────────────
  text = text.replace(/\b(urgent|asap|urgently)\b|!!!+/gi, () => {
    if (!priority) { priority = "urgent"; tokens.push("⚡ Urgent"); }
    return "§";
  });
  text = text.replace(/\b(important|high[- ]?priority)\b|!!/g, () => {
    if (!priority) { priority = "high"; tokens.push("▲ High"); }
    return "§";
  });

  // ── Hashtags → tags ───────────────────────────────────────────
  text = text.replace(/#(\w+)/g, (_, tag) => {
    const match = tagNames.find((n) => n.toLowerCase() === tag.toLowerCase());
    if (match && !matchedTagNames.includes(match)) {
      matchedTagNames.push(match);
      tokens.push(`#${match.toLowerCase()}`);
    }
    return "§";
  });

  // ── Clean title ───────────────────────────────────────────────
  const title = text.replace(/§/g, " ").replace(/\s{2,}/g, " ").trim();

  return { title, date, priority, matchedTagNames, tokens };
}
