import { describe, expect, it } from "vitest";
import { humaniseSlug } from "./format";
import { circlePolygon } from "./circle";
import { parsePlaceTokens } from "./places";

describe("places", () => {
  it("keeps four valid compare tokens", () => {
    const params = new URLSearchParams();
    ["vic:richmond", "bad", "nsw:place-1", "VIC:already", "qld:one", "sa:two", "wa:three"].forEach(
      (token) => params.append("p", token),
    );
    expect(parsePlaceTokens(params)).toEqual([
      "vic:richmond",
      "nsw:place-1",
      "vic:already",
      "qld:one",
    ]);
  });

  it("turns a slug into words without claiming it is a real name", () => {
    expect(humaniseSlug("st-kilda-west")).toBe("St Kilda West");
  });

  it("closes the radius ring", () => {
    const polygon = circlePolygon(145, -37.8, 5);
    const ring = polygon.coordinates[0] ?? [];
    expect(ring.length).toBe(65);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
});
