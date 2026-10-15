# uwarp-mcp

[![sherotree/uwarp-mcp MCP server](https://glama.ai/mcp/servers/sherotree/uwarp-mcp/badges/score.svg)](https://glama.ai/mcp/servers/sherotree/uwarp-mcp)

MCP server for [Uwarp](https://uwarp.design) — a directory of 500+ free browser UI tools.

This package exposes **three local tools** you can use from Cursor or Claude Desktop. No paid API key is required. Most Uwarp listings are third-party embeds; this server does **not** scrape or wrap them. Contrast and palette math run entirely on-device; `search_tools` reads a bundled local catalog (`data/tools.json`).

| Tool | Purpose |
|------|---------|
| `check_contrast` | WCAG 2.x contrast ratio + AA/AAA flags |
| `generate_palette` | HSL harmony palettes + `:root` CSS |
| `search_tools` | Search the local Uwarp tool catalog |

Author / context: **Sherotree** · [https://uwarp.design](https://uwarp.design) · MIT

---

## Install via npx

No clone needed. Add to your MCP client config (Cursor `mcp.json`, Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "uwarp": {
      "command": "npx",
      "args": ["-y", "uwarp-mcp"]
    }
  }
}
```

---

## Requirements

- Node.js 18+

## Install & build

```bash
cd /path/to/uwarp-mcp
npm install
npm run build
```

## Test

```bash
npm test
```

Includes a check that black-on-white contrast ≈ **21**.

## Run locally (stdio)

```bash
npm start
# or during development:
npm run dev
```

The process speaks MCP over **stdio** (JSON-RPC on stdin/stdout). Log noise goes to stderr.

### Optional env stub

| Variable | Notes |
|----------|--------|
| `UWARP_API_KEY` | Reserved for a future Uwarp API. **Ignored today** — no paid key needed. |

---

## Cursor (`mcp.json`)

Add to your Cursor MCP config (e.g. `~/.cursor/mcp.json` or project `.cursor/mcp.json`). Point `args` at the **built** entry after `npm run build`:

```json
{
  "mcpServers": {
    "uwarp": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/uwarp-mcp/dist/index.js"]
    }
  }
}
```

Example if the project lives at `~/code/uwarp-mcp` (use the absolute path):

```json
{
  "mcpServers": {
    "uwarp": {
      "command": "node",
      "args": ["/Users/you/code/uwarp-mcp/dist/index.js"]
    }
  }
}
```

Restart Cursor (or reload MCP servers) after saving.

---

## Claude Desktop

Edit the Claude Desktop config:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "uwarp": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/uwarp-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop after saving.

---

## Tool reference

### `check_contrast`

**Input**

| Field | Type | Description |
|-------|------|-------------|
| `foreground` | string | Hex `#RGB` / `#RRGGBB` |
| `background` | string | Hex `#RGB` / `#RRGGBB` |

**Output**

```json
{
  "ratio": 21,
  "aa_normal": true,
  "aa_large": true,
  "aaa_normal": true,
  "aaa_large": true
}
```

Uses WCAG 2.x relative luminance and contrast ratio thresholds (AA normal ≥ 4.5, AA large ≥ 3, AAA normal ≥ 7, AAA large ≥ 4.5).

### `generate_palette`

**Input**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `seed` | string | — | Seed hex |
| `harmony` | `analogous` \| `complementary` \| `triadic` \| `mono` | `analogous` | Harmony mode |
| `count` | number | `6` | Colors, 3–12 |

**Output**

```json
{
  "colors": [{ "name": "Mid Blue", "hex": "#3b82f6" }],
  "css": ":root {\n  --color-1: #3b82f6; /* Mid Blue */\n}"
}
```

### `search_tools`

**Input**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | — | Search text |
| `category` | string | — | Optional filter (e.g. `color`, `svg-generators`) |
| `limit` | number | `8` | Max results, 1–20 |

**Output**

```json
{
  "tools": [
    {
      "name": "Contrast Checker",
      "summary": "…",
      "url": "https://uwarp.design/tools/contrast-checker",
      "category": "color"
    }
  ]
}
```

> **Note:** `search_tools` uses the **local** catalog in `data/tools.json` (sample entries for development). It does not scrape uwarp.design at runtime.

---

## Project layout

```
uwarp-mcp/
├── data/tools.json          # Local Uwarp catalog (~28 samples)
├── src/
│   ├── index.ts             # MCP stdio entry
│   └── tools/
│       ├── check_contrast.ts
│       ├── generate_palette.ts
│       └── search_tools.ts
├── tests/
├── dist/                    # After npm run build
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## License

MIT © Sherotree / [Uwarp](https://uwarp.design)
