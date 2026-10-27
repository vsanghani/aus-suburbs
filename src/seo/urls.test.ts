import { describe, expect, it } from "vitest";
import { canonicalRedirect, compareCanonicalPath, searchCanonicalPath } from "./urls";

describe("canonical redirects", () => {
  it("strips a trailing slash and lowercases place urls in one step", () => {
    expect(canonicalRedirect("/suburbs/VIC/Richmond/", "")).toBe("/suburbs/vic/richmond");
    expect(canonicalRedirect("/states/NSW", "")).toBe("/states/nsw");
    expect(canonicalRedirect("/councils/VIC/Yarra/", "?x=1")).toBe("/councils/vic/yarra?x=1");
    expect(canonicalRedirect("/rankings/Rent", "")).toBe("/rankings/rent");
    expect(canonicalRedirect("/suburbs/vic/richmond", "")).toBeNull();
    expect(canonicalRedirect("/", "")).toBeNull();
    expect(canonicalRedirect("/privacy/", "")).toBe("/privacy");
  });

  it("sends sources and index.html to one document", () => {
    expect(canonicalRedirect("/sources", "")).toBe("/methodology#sources");
    expect(canonicalRedirect("/sources/", "?q=1")).toBe("/methodology#sources");
    expect(canonicalRedirect("/index.html", "")).toBe("/");
    expect(canonicalRedirect("/INDEX.HTML", "")).toBe("/");
  });

  it("normalises search and compare queries and leaves match weights alone", () => {
    expect(canonicalRedirect("/search", "?q=port%20melbourne")).toBe("/search?q=port+melbourne");
    expect(canonicalRedirect("/Search/", "?q=richmond&utm=1")).toBe("/search?q=richmond");
    expect(canonicalRedirect("/search", "?q=richmond")).toBeNull();
    expect(searchCanonicalPath("  port   melbourne ")).toBe("/search?q=port+melbourne");
    expect(canonicalRedirect("/compare", "?p=VIC:Richmond&p=bad&p=nsw:newtown")).toBe(
      "/compare?p=vic%3Arichmond&p=nsw%3Anewtown",
    );
    expect(compareCanonicalPath(["vic:richmond"])).toBe("/compare?p=vic%3Arichmond");
    expect(canonicalRedirect("/compare", "?p=vic%3Arichmond")).toBeNull();
    expect(canonicalRedirect("/match", "?budget=90")).toBeNull();
    expect(canonicalRedirect("/explore/", "?metric=rent&state=vic")).toBe(
      "/explore?metric=rent&state=vic",
    );
  });
});
