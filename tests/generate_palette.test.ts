import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generatePalette } from "../src/tools/generate_palette.ts";

describe("generate_palette", () => {
  it("returns default count of 6 analogous colors and CSS", () => {
    const result = generatePalette("#3b82f6");
    assert.equal(result.colors.length, 6);
    assert.ok(result.css.startsWith(":root {"));
    assert.ok(result.css.includes("--color-1:"));
    for (const c of result.colors) {
      assert.match(c.hex, /^#[0-9a-f]{6}$/i);
      assert.ok(c.name.length > 0);
    }
  });

  it("respects count and harmony", () => {
    const tri = generatePalette("#ff0000", "triadic", 3);
    assert.equal(tri.colors.length, 3);
    const mono = generatePalette("#2288aa", "mono", 8);
    assert.equal(mono.colors.length, 8);
  });

  it("rejects out-of-range count", () => {
    assert.throws(() => generatePalette("#000000", "analogous", 2));
    assert.throws(() => generatePalette("#000000", "analogous", 13));
  });
});
