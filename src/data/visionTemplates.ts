import type { CanvasItem } from "@/components/VisionCanvasEditor";

export interface TemplateDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bg: string;
  starterItems: CanvasItem[];
}

/* ─────────────────────────────────────────────────────────────────
   6 templates re-expressed as pre-positioned CanvasItem arrays.
   Positions are % of canvas (3:4 aspect ratio).
   Image items with content="" show a tap-to-upload placeholder.
───────────────────────────────────────────────────────────────── */
export const TEMPLATES: TemplateDef[] = [

  /* 1. MOSAIC — warm study collage ─────────────────────────────── */
  {
    id: "mosaic",
    name: "Mosaic",
    emoji: "🎨",
    description: "Warm collage with mixed sizes",
    bg: "#f0ebe0",
    starterItems: [
      { id: "m-a", type: "image", content: "", x: 0,    y: 0,  w: 66.6, h: 50,   zIndex: 1 },
      { id: "m-b", type: "image", content: "", x: 66.6, y: 0,  w: 33.3, h: 25,   zIndex: 1 },
      { id: "m-c", type: "image", content: "", x: 66.6, y: 25, w: 33.3, h: 50,   zIndex: 1 },
      { id: "m-d", type: "image", content: "", x: 0,    y: 50, w: 33.3, h: 50,   zIndex: 1 },
      {
        id: "m-e", type: "text",
        content: "Studying doesn't suck as much as failing.",
        x: 33.3, y: 50, w: 33.3, h: 25,
        fontSize: 11, color: "#444444", bg: "#ece8df", italic: true, zIndex: 2,
      },
      { id: "m-f", type: "image", content: "", x: 33.3, y: 75, w: 66.6, h: 25,   zIndex: 1 },
    ],
  },

  /* 2. DARK POWER — black gym / discipline ─────────────────────── */
  {
    id: "dark",
    name: "Dark Power",
    emoji: "⚡",
    description: "Black gym discipline aesthetic",
    bg: "#080808",
    starterItems: [
      { id: "d-a", type: "image", content: "", x: 0,  y: 0,  w: 50, h: 50, zIndex: 1 },
      { id: "d-b", type: "image", content: "", x: 50, y: 0,  w: 50, h: 25, zIndex: 1 },
      { id: "d-c", type: "image", content: "", x: 50, y: 25, w: 50, h: 25, zIndex: 1 },
      {
        id: "d-d", type: "text",
        content: "DISCIPLINE",
        x: 0, y: 50, w: 100, h: 25,
        fontSize: 38, color: "#ffffff", bg: "#080808", bold: true, zIndex: 2,
      },
      { id: "d-e", type: "image", content: "", x: 0,  y: 75, w: 50, h: 25, zIndex: 1 },
      {
        id: "d-f", type: "text",
        content: "Will it be easy? Nope.\nWorth it? Absolutely.",
        x: 50, y: 75, w: 50, h: 25,
        fontSize: 11, color: "#888888", bg: "#141414", zIndex: 2,
      },
    ],
  },

  /* 3. GLOW UP — clean 6-cell pink grid ─────────────────────────── */
  {
    id: "glowup",
    name: "Glow Up",
    emoji: "🌸",
    description: "Clean 6-cell pink grid",
    bg: "#fff0f3",
    starterItems: [
      { id: "g-a", type: "image", content: "", x: 0,  y: 0,    w: 50, h: 33.3, zIndex: 1 },
      { id: "g-b", type: "image", content: "", x: 50, y: 0,    w: 50, h: 33.3, zIndex: 1 },
      { id: "g-c", type: "image", content: "", x: 0,  y: 33.3, w: 50, h: 33.3, zIndex: 1 },
      { id: "g-d", type: "image", content: "", x: 50, y: 33.3, w: 50, h: 33.3, zIndex: 1 },
      { id: "g-e", type: "image", content: "", x: 0,  y: 66.6, w: 50, h: 33.3, zIndex: 1 },
      { id: "g-f", type: "image", content: "", x: 50, y: 66.6, w: 50, h: 33.3, zIndex: 1 },
    ],
  },

  /* 4. WELLNESS — earth tones with tall center ───────────────────── */
  {
    id: "wellness",
    name: "Wellness",
    emoji: "🌿",
    description: "Earth tone 3-col with tall center",
    bg: "#0f1a0f",
    starterItems: [
      { id: "w-a", type: "image", content: "", x: 0,    y: 0,    w: 33.3, h: 33.3, zIndex: 1 },
      { id: "w-b", type: "image", content: "", x: 33.3, y: 0,    w: 33.3, h: 66.6, zIndex: 1 },
      { id: "w-c", type: "image", content: "", x: 66.6, y: 0,    w: 33.3, h: 33.3, zIndex: 1 },
      { id: "w-d", type: "image", content: "", x: 0,    y: 33.3, w: 33.3, h: 33.3, zIndex: 1 },
      {
        id: "w-e", type: "text",
        content: "Just do it",
        x: 66.6, y: 33.3, w: 33.3, h: 33.3,
        fontSize: 13, color: "#ffffff", bg: "rgba(255,255,255,0.1)", italic: true, zIndex: 2,
      },
      { id: "w-f", type: "image", content: "", x: 0,    y: 66.6, w: 33.3, h: 33.3, zIndex: 1 },
      { id: "w-g", type: "image", content: "", x: 33.3, y: 66.6, w: 33.3, h: 33.3, zIndex: 1 },
      { id: "w-h", type: "image", content: "", x: 66.6, y: 66.6, w: 33.3, h: 33.3, zIndex: 1 },
    ],
  },

  /* 5. FAITH & GOALS — warm moody spiritual ──────────────────────── */
  {
    id: "faith",
    name: "Faith & Goals",
    emoji: "🌙",
    description: "Warm moody spiritual collage",
    bg: "#1a1410",
    starterItems: [
      { id: "f-a", type: "image", content: "", x: 0,  y: 0,  w: 50, h: 50, zIndex: 1 },
      { id: "f-b", type: "image", content: "", x: 50, y: 0,  w: 50, h: 25, zIndex: 1 },
      { id: "f-c", type: "image", content: "", x: 50, y: 25, w: 50, h: 25, zIndex: 1 },
      {
        id: "f-d", type: "text",
        content: "God put that dream in your heart for a reason.",
        x: 0, y: 50, w: 100, h: 25,
        fontSize: 13, color: "#d4c5a9", bg: "#261e17", italic: true, zIndex: 2,
      },
      { id: "f-e", type: "image", content: "", x: 0,  y: 75, w: 50, h: 25, zIndex: 1 },
      { id: "f-f", type: "image", content: "", x: 50, y: 75, w: 50, h: 25, zIndex: 1 },
    ],
  },

  /* 6. EDITORIAL — clean magazine layout ─────────────────────────── */
  {
    id: "editorial",
    name: "Editorial",
    emoji: "📰",
    description: "Magazine hero + quote + word",
    bg: "#ffffff",
    starterItems: [
      { id: "e-a", type: "image", content: "", x: 0,  y: 0,    w: 100, h: 33.3, zIndex: 1 },
      {
        id: "e-b", type: "text",
        content: "do it for your future self",
        x: 0, y: 33.3, w: 50, h: 33.3,
        fontSize: 15, color: "#1a1a1a", bg: "#f5f0e8", bold: true, zIndex: 2,
      },
      { id: "e-c", type: "image", content: "", x: 50, y: 33.3, w: 50, h: 33.3, zIndex: 1 },
      {
        id: "e-d", type: "text",
        content: "ELEVATE",
        x: 0, y: 66.6, w: 100, h: 33.3,
        fontSize: 42, color: "#ffffff", bg: "#1a1a1a", bold: true, zIndex: 2,
      },
    ],
  },
];
