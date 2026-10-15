import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkContrast,
  contrastRatio,
  parseHex,
  relativeLuminance,
} from "../src/tools/check_contrast.ts";

describe("parseHex", () => {
  it("parses #RGB and #RRGGBB", () => {
    assert.deepEqual(parseHex("#000"), [0, 0, 0]);
    assert.deepEqual(parseHex("#fff"), [255, 255, 255]);
    assert.deepEqual(parseHex("#000000"), [0, 0, 0]);
    assert.deepEqual(parseHex("ffffff"), [255, 255, 255]);
  });

  it("rejects invalid input", () => {
    assert.throws(() => parseHex("not-a-color"));
    assert.throws(() => parseHex("#12"));
  });
});

describe("relativeLuminance", () => {
  it("black is 0, white is 1", () => {
    assert.equal(relativeLuminance("#000000"), 0);
    assert.equal(relativeLuminance("#ffffff"), 1);
  });
});

describe("check_contrast", () => {
  it("black on white ≈ 21", () => {
    const ratio = contrastRatio("#000000", "#ffffff");
    assert.ok(
      Math.abs(ratio - 21) < 0.01,
      `expected ≈21, got ${ratio}`
    );
    const result = checkContrast("#000000", "#ffffff");
    assert.equal(result.ratio, 21);
    assert.equal(result.aa_normal, true);
    assert.equal(result.aa_large, true);
    assert.equal(result.aaa_normal, true);
    assert.equal(result.aaa_large, true);
  });

  it("white on black is also 21", () => {
    assert.equal(checkContrast("#ffffff", "#000000").ratio, 21);
  });

  it("same color has ratio 1", () => {
    const r = checkContrast("#336699", "#336699");
    assert.equal(r.ratio, 1);
    assert.equal(r.aa_normal, false);
    assert.equal(r.aa_large, false);
  });

  it("accepts 3-digit hex", () => {
    assert.equal(checkContrast("#000", "#fff").ratio, 21);
  });
});
