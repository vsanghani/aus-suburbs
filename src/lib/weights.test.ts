import { describe, expect, it } from "vitest";
import { normaliseWeights, PRESETS, WEIGHTS, weightsMatch } from "./weights";

describe("weights", () => {
  it("normalises a mix and falls back to even when everything is zero", () => {
    const mix = normaliseWeights({ budget: 75, green: 25 });
    expect(mix.budget).toBeGreaterThan(mix.green ?? 0);
    expect(
      Object.values(normaliseWeights({})).every(
        (value) => Math.abs(value - 1 / WEIGHTS.length) < 1e-9,
      ),
    ).toBe(true);
  });

  it("keeps presets on the published weight ids", () => {
    const ids = new Set(WEIGHTS.map((weight) => weight.id));
    for (const preset of PRESETS) {
      expect(Object.keys(preset.values).sort()).toEqual([...ids].sort());
    }
  });

  it("matches a preset only when every weight agrees", () => {
    const even = PRESETS[0];
    if (!even) throw new Error("missing preset");
    expect(weightsMatch(even.values, { ...even.values })).toBe(true);
    expect(weightsMatch(even.values, { ...even.values, budget: 10 })).toBe(false);
  });
});
