#!/usr/bin/env node
/**
 * Uwarp MCP server — local contrast, palette, and tool-catalog search.
 * https://uwarp.design
 *
 * Optional paid API key: not required. Stub env UWARP_API_KEY is ignored for now.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { checkContrast } from "./tools/check_contrast.js";
import { generatePalette } from "./tools/generate_palette.js";
import { searchTools } from "./tools/search_tools.js";

const server = new McpServer({
  name: "uwarp-mcp",
  version: "1.0.0",
});

server.tool(
  "check_contrast",
  "Compute WCAG 2.x contrast ratio and AA/AAA pass flags for a foreground/background hex pair. Pure local math — no network.",
  {
    foreground: z
      .string()
      .describe("Foreground color as #RGB or #RRGGBB (e.g. #000000)"),
    background: z
      .string()
      .describe("Background color as #RGB or #RRGGBB (e.g. #ffffff)"),
  },
  async ({ foreground, background }) => {
    try {
      const result = checkContrast(foreground, background);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "generate_palette",
  "Generate a color palette from a seed hex using local HSL harmonies (analogous, complementary, triadic, mono). Returns named colors and a :root CSS snippet.",
  {
    seed: z.string().describe("Seed color as #RGB or #RRGGBB"),
    harmony: z
      .enum(["analogous", "complementary", "triadic", "mono"])
      .optional()
      .default("analogous")
      .describe("Harmony mode (default: analogous)"),
    count: z
      .number()
      .int()
      .min(3)
      .max(12)
      .optional()
      .default(6)
      .describe("Number of colors 3–12 (default: 6)"),
  },
  async ({ seed, harmony, count }) => {
    try {
      const result = generatePalette(seed, harmony, count);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "search_tools",
  "Search the local Uwarp tool catalog (bundled JSON — no scraping). Filter by query and optional category; returns name, summary, url, category.",
  {
    query: z
      .string()
      .describe("Search text matched against name, summary, category, tags"),
    category: z
      .string()
      .optional()
      .describe(
        "Optional category filter (e.g. color, svg-generators, image-conversion)"
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .default(8)
      .describe("Max results 1–20 (default: 8)"),
  },
  async ({ query, category, limit }) => {
    try {
      const result = searchTools(query, category, limit);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

async function main(): Promise<void> {
  // Optional stub — reserved for a future Uwarp API; unused today.
  if (process.env.UWARP_API_KEY) {
    console.error(
      "uwarp-mcp: UWARP_API_KEY is set but unused (no paid API required)."
    );
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("uwarp-mcp running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
