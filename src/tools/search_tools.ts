/**
 * Search a local Uwarp tool catalog (no network / scraping).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface ToolEntry {
  name: string;
  summary: string;
  url: string;
  category: string;
  tags?: string[];
}

export interface SearchResult {
  tools: Array<{
    name: string;
    summary: string;
    url: string;
    category: string;
  }>;
}

function catalogPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // Prefer dist/data (production), then repo data/ (dev / tests)
  const candidates = [
    join(here, "..", "data", "tools.json"),
    join(here, "..", "..", "data", "tools.json"),
  ];
  for (const p of candidates) {
    try {
      readFileSync(p, "utf8");
      return p;
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `tools.json not found. Looked in:\n${candidates.join("\n")}`
  );
}

let cached: ToolEntry[] | null = null;

export function loadCatalog(): ToolEntry[] {
  if (cached) return cached;
  const raw = readFileSync(catalogPath(), "utf8");
  const parsed = JSON.parse(raw) as { tools: ToolEntry[] };
  if (!Array.isArray(parsed.tools)) {
    throw new Error("tools.json must contain a top-level \"tools\" array");
  }
  cached = parsed.tools;
  return cached;
}

/** Reset cache (tests). */
export function clearCatalogCache(): void {
  cached = null;
}

function score(entry: ToolEntry, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  const name = entry.name.toLowerCase();
  const summary = entry.summary.toLowerCase();
  const category = entry.category.toLowerCase();
  const tags = (entry.tags ?? []).map((t) => t.toLowerCase());
  let s = 0;
  if (name === q) s += 100;
  if (name.includes(q)) s += 40;
  if (category === q) s += 30;
  if (category.includes(q)) s += 15;
  if (summary.includes(q)) s += 10;
  for (const t of tags) {
    if (t === q) s += 25;
    else if (t.includes(q) || q.includes(t)) s += 12;
  }
  // token overlap
  for (const token of q.split(/\s+/)) {
    if (token.length < 2) continue;
    if (name.includes(token)) s += 8;
    if (summary.includes(token)) s += 4;
    if (tags.some((t) => t.includes(token))) s += 5;
  }
  return s;
}

export function searchTools(
  query: string,
  category?: string,
  limit = 8
): SearchResult {
  if (limit < 1 || limit > 20) {
    throw new Error(`limit must be between 1 and 20 (got ${limit})`);
  }
  const catalog = loadCatalog();
  let pool = catalog;
  if (category && category.trim()) {
    const c = category.toLowerCase().trim();
    pool = catalog.filter(
      (t) =>
        t.category.toLowerCase() === c ||
        t.category.toLowerCase().includes(c)
    );
  }
  const ranked = pool
    .map((t) => ({ t, s: score(t, query) }))
    .filter((x) => (query.trim() ? x.s > 0 : true))
    .sort((a, b) => b.s - a.s || a.t.name.localeCompare(b.t.name))
    .slice(0, limit)
    .map(({ t }) => ({
      name: t.name,
      summary: t.summary,
      url: t.url,
      category: t.category,
    }));

  return { tools: ranked };
}
