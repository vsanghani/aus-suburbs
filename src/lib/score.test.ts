import { describe, expect, it } from "vitest";
import { FORMULA } from "../config/formula";
import { tierFor } from "./score";

describe("tierFor", () => {
  it("picks the highest tier whose minimum the value clears", () => {
    expect(tierFor(80, FORMULA.tiers)).toBe("Clear");
    expect(tierFor(65, FORMULA.tiers)).toBe("Steady");
    expect(tierFor(50, FORMULA.tiers)).toBe("Mixed");
    expect(tierFor(35, FORMULA.tiers)).toBe("Thin");
    expect(tierFor(10, FORMULA.tiers)).toBe("Sparse");
    expect(tierFor(null, FORMULA.tiers)).toBeNull();
  });
});
