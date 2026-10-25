import { describe, expect, it } from "vitest";
import { registry } from "./registry";

describe("registry", () => {
  it("gives every section a unique id and nav label", () => {
    const ids = registry.map((section) => section.id);
    const nav = registry.map((section) => section.nav);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(nav).size).toBe(nav.length);
    expect(ids).toContain("housing");
    expect(ids).toContain("canopy");
    expect(ids).toContain("development");
  });

  it("keeps slot ids unique inside a section", () => {
    for (const section of registry) {
      const slots = section.slots ?? [];
      expect(new Set(slots.map((slot) => slot.id)).size).toBe(slots.length);
    }
  });
});
