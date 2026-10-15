/**
 * Local HSL palette generation — no external color API.
 */

export type Harmony = "analogous" | "complementary" | "triadic" | "mono";

export interface PaletteColor {
  name: string;
  hex: string;
}

export interface PaletteResult {
  colors: PaletteColor[];
  css: string;
}

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function parseHexToRgb(hex: string): [number, number, number] {
  const m = HEX_RE.exec(hex.trim());
  if (!m) {
    throw new Error(`Invalid hex color: "${hex}". Expected #RGB or #RRGGBB.`);
  }
  let h = m[1];
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  return [
    Math.round(hue2rgb(p, q, hk + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hk) * 255),
    Math.round(hue2rgb(p, q, hk - 1 / 3) * 255),
  ];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

function hueName(h: number): string {
  const names = [
    [15, "Red"],
    [45, "Orange"],
    [75, "Yellow"],
    [150, "Green"],
    [200, "Cyan"],
    [260, "Blue"],
    [290, "Purple"],
    [330, "Magenta"],
    [360, "Red"],
  ] as const;
  const hh = ((h % 360) + 360) % 360;
  for (const [max, name] of names) {
    if (hh < max) return name;
  }
  return "Color";
}

function lightnessLabel(l: number): string {
  if (l < 0.2) return "Deep";
  if (l < 0.4) return "Dark";
  if (l < 0.6) return "Mid";
  if (l < 0.8) return "Light";
  return "Pale";
}

/** Build hue targets for a harmony, then distribute `count` colors. */
function hueTargets(seedH: number, harmony: Harmony, count: number): number[] {
  const wrap = (h: number) => ((h % 360) + 360) % 360;
  let anchors: number[];
  switch (harmony) {
    case "complementary":
      anchors = [seedH, wrap(seedH + 180)];
      break;
    case "triadic":
      anchors = [seedH, wrap(seedH + 120), wrap(seedH + 240)];
      break;
    case "mono":
      anchors = [seedH];
      break;
    case "analogous":
    default:
      anchors = [wrap(seedH - 30), seedH, wrap(seedH + 30)];
      break;
  }

  if (harmony === "mono") {
    return Array.from({ length: count }, () => seedH);
  }

  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / Math.max(count - 1, 1)) * (anchors.length - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(i0 + 1, anchors.length - 1);
    const f = t - i0;
    let a = anchors[i0];
    let b = anchors[i1];
    // shortest-path interpolate on the hue circle
    let diff = b - a;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    out.push(wrap(a + diff * f));
  }
  return out;
}

export function generatePalette(
  seed: string,
  harmony: Harmony = "analogous",
  count = 6
): PaletteResult {
  if (count < 3 || count > 12) {
    throw new Error(`count must be between 3 and 12 (got ${count})`);
  }
  const [r, g, b] = parseHexToRgb(seed);
  const [seedH, seedS, seedL] = rgbToHsl(r, g, b);
  const hues = hueTargets(seedH, harmony, count);

  const colors: PaletteColor[] = hues.map((h, i) => {
    let s = seedS;
    let l = seedL;
    if (harmony === "mono") {
      // spread lightness across the range while keeping hue/sat
      l = 0.15 + (i / Math.max(count - 1, 1)) * 0.7;
      s = Math.min(1, Math.max(0.15, seedS * (0.7 + (i / count) * 0.5)));
    } else {
      // slight lightness variation for visual interest
      const wave = Math.sin((i / Math.max(count - 1, 1)) * Math.PI);
      l = Math.min(0.9, Math.max(0.12, seedL + (wave - 0.5) * 0.2));
      s = Math.min(1, Math.max(0.1, seedS * (0.85 + wave * 0.2)));
    }
    const [rr, gg, bb] = hslToRgb(h, s, l);
    const hex = toHex(rr, gg, bb);
    const name = `${lightnessLabel(l)} ${hueName(h)}`;
    return { name, hex };
  });

  // Deduplicate display names with index when colliding
  const seen = new Map<string, number>();
  for (const c of colors) {
    const n = (seen.get(c.name) ?? 0) + 1;
    seen.set(c.name, n);
    if (n > 1) c.name = `${c.name} ${n}`;
  }

  const cssLines = colors.map(
    (c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.name} */`
  );
  const css = `:root {\n${cssLines.join("\n")}\n}`;

  return { colors, css };
}
