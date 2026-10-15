import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { searchTools } from "../src/tools/search_tools.ts";

describe("search_tools", () => {
  it("finds contrast-related tools", () => {
    const { tools } = searchTools("contrast");
    assert.ok(tools.length >= 1);
    assert.ok(
      tools.some((t) => /contrast/i.test(t.name) || /contrast/i.test(t.summary))
    );
    for (const t of tools) {
      assert.ok(t.url.startsWith("https://"));
      assert.ok(t.category.length > 0);
    }
  });

  it("filters by category", () => {
    const { tools } = searchTools("svg", "svg-generators", 5);
    assert.ok(tools.length >= 1);
    assert.ok(tools.every((t) => t.category === "svg-generators"));
  });

  it("respects limit", () => {
    const { tools } = searchTools("css", undefined, 2);
    assert.ok(tools.length <= 2);
  });
});
