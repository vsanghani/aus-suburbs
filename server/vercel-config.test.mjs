// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

describe("vercel.json", () => {
  it("keeps the Vite preset from turning the site into a static shell", () => {
    expect(config.framework).toBeNull();
    expect(config.outputDirectory).toBe("dist");
    expect(config.buildCommand).toBe("npm run build");
    expect(JSON.stringify(config)).not.toContain("index.html");
  });

  it("rewrites documents to the function and restores the visitor path", () => {
    expect(config.rewrites).toEqual([
      {
        source: "/(.*)",
        destination: "/api/ssr",
        transforms: [{ type: "request.path", op: "set", args: "/$1" }],
      },
    ]);
    expect(config.functions["api/ssr.js"].includeFiles).toBe("dist-server/**");
  });

  it("caches hashed assets and leaves fonts and the favicon short-lived", () => {
    const bySource = Object.fromEntries(
      config.headers.map((entry) => [entry.source, entry.headers]),
    );
    expect(bySource["/assets/(.*)"]).toEqual([
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ]);
    expect(bySource["/fonts/(.*)"][0].value).toBe("public, max-age=300");
    expect(bySource["/favicon.svg"][0].value).toBe("public, max-age=300");
  });
});
