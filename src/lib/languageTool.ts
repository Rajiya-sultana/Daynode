export interface LTMatch {
  message: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  context: { text: string; offset: number; length: number };
  rule: { id: string; description: string };
}

/**
 * Common tech brand names, tools, and jargon that LanguageTool
 * doesn't know about. All lowercase for case-insensitive matching.
 */
export const TECH_WHITELIST = new Set([
  // Databases & backends
  "supabase", "firebase", "firestore", "mongodb", "postgresql", "mysql",
  "sqlite", "redis", "planetscale", "neon", "turso", "xata", "convex",
  "appwrite", "pocketbase", "hasura", "prisma", "drizzle",

  // Frameworks & runtimes
  "nextjs", "next.js", "nuxt", "nuxtjs", "remix", "astro", "sveltekit",
  "svelte", "vue", "vuejs", "react", "vite", "bun", "deno", "hono",
  "fastapi", "django", "laravel", "nestjs", "express",

  // Platforms & cloud
  "vercel", "netlify", "railway", "render", "fly.io", "flyio", "cloudflare",
  "aws", "gcp", "azure", "heroku", "digitalocean", "linode", "vultr",

  // Languages & tools
  "typescript", "javascript", "tailwind", "shadcn", "radix", "zustand",
  "tanstack", "trpc", "graphql", "openai", "anthropic", "langchain",
  "shopify", "stripe", "twilio", "sendgrid", "resend", "postmark",

  // General tech words
  "api", "sdk", "repo", "backend", "frontend", "fullstack", "devops",
  "saas", "paas", "iaas", "ui", "ux", "cli", "env", "npm", "pnpm",
  "yarn", "webhook", "cron", "oauth", "jwt", "hmac", "cors", "cdn",
  "dockerfile", "kubernetes", "k8s", "docker", "github", "gitlab",
  "bitbucket", "figma", "notion", "linear", "jira", "confluence",

  // Common abbreviations
  "auth", "db", "infra", "config", "repo", "prod", "dev", "qa", "uat",
  "ci", "cd", "pr", "mr", "lgtm", "wip", "poc", "mvp", "kpi", "okr",
]);

/** Check if a flagged word is a known tech term (case-insensitive) */
export function isTechTerm(word: string): boolean {
  return TECH_WHITELIST.has(word.toLowerCase());
}

export async function checkGrammar(text: string): Promise<LTMatch[]> {
  if (!text.trim() || text.length < 3) return [];

  const body = new URLSearchParams({ text, language: "en-US" });

  const res = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.matches as LTMatch[]) ?? [];
}
