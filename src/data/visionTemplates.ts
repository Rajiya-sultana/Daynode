export type SlotType = "image" | "text" | "word";

export interface SlotDef {
  id: string;
  type: SlotType;
  area: string;
  placeholder?: string;
  textSize?: number;
  textWeight?: number;
  textAlign?: "left" | "center" | "right";
  textColor?: string;
  bg?: string;
  italic?: boolean;
  uppercase?: boolean;
  letterSpacing?: string;
  lineHeight?: number;
  fontFamily?: string;
}

export interface TemplateDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bg: string;
  textColor: string;
  cols: number;
  rowH: number;        // height per grid row in px
  areas: string;       // CSS grid-template-areas
  slots: SlotDef[];
}

export const TEMPLATES: TemplateDef[] = [
  /* ─── 1. MOSAIC — warm study collage ─────────────────────────── */
  {
    id: "mosaic",
    name: "Mosaic",
    emoji: "🎨",
    description: "Warm study collage with mixed sizes",
    bg: "#f0ebe0",
    textColor: "#2a2a2a",
    cols: 3,
    rowH: 100,
    areas: `"a a b" "a a c" "d e c" "d f f"`,
    slots: [
      { id: "a", type: "image",  area: "a" },
      { id: "b", type: "image",  area: "b" },
      { id: "c", type: "image",  area: "c" },
      { id: "d", type: "image",  area: "d" },
      { id: "e", type: "text",   area: "e", bg: "#ece8df", textColor: "#444",
        textSize: 13, italic: true, textAlign: "center", lineHeight: 1.4,
        placeholder: "Studying doesn't suck as much as failing." },
      { id: "f", type: "image",  area: "f" },
    ],
  },

  /* ─── 2. DARK POWER — black gym / discipline ─────────────────── */
  {
    id: "dark",
    name: "Dark Power",
    emoji: "⚡",
    description: "Black gym discipline aesthetic",
    bg: "#080808",
    textColor: "#ffffff",
    cols: 2,
    rowH: 130,
    areas: `"a b" "a c" "d d" "e f"`,
    slots: [
      { id: "a", type: "image",  area: "a" },
      { id: "b", type: "image",  area: "b" },
      { id: "c", type: "image",  area: "c" },
      { id: "d", type: "word",   area: "d", bg: "#080808", textColor: "#ffffff",
        textSize: 52, textWeight: 900, uppercase: true, textAlign: "center",
        letterSpacing: "-0.02em", fontFamily: "Georgia, serif",
        placeholder: "DISCIPLINE" },
      { id: "e", type: "image",  area: "e" },
      { id: "f", type: "text",   area: "f", bg: "#141414", textColor: "#888",
        textSize: 12, italic: false, textAlign: "center", lineHeight: 1.5,
        placeholder: "Will it be easy? Nope.\nWorth it? Absolutely." },
    ],
  },

  /* ─── 3. GLOW UP — clean pink 2-column ───────────────────────── */
  {
    id: "glowup",
    name: "Glow Up",
    emoji: "🌸",
    description: "Clean 6-cell pink grid",
    bg: "#fff0f3",
    textColor: "#333",
    cols: 2,
    rowH: 140,
    areas: `"a b" "c d" "e f"`,
    slots: [
      { id: "a", type: "image", area: "a" },
      { id: "b", type: "image", area: "b" },
      { id: "c", type: "image", area: "c" },
      { id: "d", type: "image", area: "d" },
      { id: "e", type: "image", area: "e" },
      { id: "f", type: "image", area: "f" },
    ],
  },

  /* ─── 4. WELLNESS — earth tones health grid ──────────────────── */
  {
    id: "wellness",
    name: "Wellness",
    emoji: "🌿",
    description: "Earth tone 3-col with tall center",
    bg: "#0f1a0f",
    textColor: "#fff",
    cols: 3,
    rowH: 100,
    areas: `"a b c" "d b e" "f g h"`,
    slots: [
      { id: "a", type: "image", area: "a" },
      { id: "b", type: "image", area: "b" },
      { id: "c", type: "image", area: "c" },
      { id: "d", type: "image", area: "d" },
      { id: "e", type: "text",  area: "e", bg: "rgba(255,255,255,0.1)", textColor: "#fff",
        textSize: 15, textWeight: 600, italic: true, textAlign: "center", lineHeight: 1.3,
        placeholder: "Just do it" },
      { id: "f", type: "image", area: "f" },
      { id: "g", type: "image", area: "g" },
      { id: "h", type: "image", area: "h" },
    ],
  },

  /* ─── 5. FAITH — warm moody spiritual ───────────────────────── */
  {
    id: "faith",
    name: "Faith & Goals",
    emoji: "🌙",
    description: "Warm moody spiritual collage",
    bg: "#1a1410",
    textColor: "#d4c5a9",
    cols: 2,
    rowH: 120,
    areas: `"a b" "a c" "d d" "e f"`,
    slots: [
      { id: "a", type: "image", area: "a" },
      { id: "b", type: "image", area: "b" },
      { id: "c", type: "image", area: "c" },
      { id: "d", type: "text",  area: "d", bg: "#261e17", textColor: "#d4c5a9",
        textSize: 14, italic: true, textAlign: "center", lineHeight: 1.6,
        placeholder: "God put that dream in your heart for a reason." },
      { id: "e", type: "image", area: "e" },
      { id: "f", type: "image", area: "f" },
    ],
  },

  /* ─── 6. EDITORIAL — clean magazine layout ───────────────────── */
  {
    id: "editorial",
    name: "Editorial",
    emoji: "📰",
    description: "Magazine hero + quote + word",
    bg: "#ffffff",
    textColor: "#1a1a1a",
    cols: 2,
    rowH: 140,
    areas: `"a a" "b c" "d d"`,
    slots: [
      { id: "a", type: "image", area: "a" },
      { id: "b", type: "text",  area: "b", bg: "#f5f0e8", textColor: "#1a1a1a",
        textSize: 17, textWeight: 700, italic: false, textAlign: "left", lineHeight: 1.35,
        fontFamily: "Georgia, serif",
        placeholder: "do it for your future self" },
      { id: "c", type: "image", area: "c" },
      { id: "d", type: "word",  area: "d", bg: "#1a1a1a", textColor: "#ffffff",
        textSize: 46, textWeight: 900, uppercase: true, textAlign: "center",
        letterSpacing: "-0.02em", fontFamily: "Georgia, serif",
        placeholder: "ELEVATE" },
    ],
  },
];
