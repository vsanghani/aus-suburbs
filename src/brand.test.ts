import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ALLOWED_NAME = new Set(["src/config/site.ts", "package.json", "README.md", "docs/design.md"]);
const namePattern = new RegExp(["hearth", "fire"].join(""), "i");
const retiredPattern = new RegExp(`${["Suburb", "IQ"].join("")}|${["Aus", "Score"].join("")}`, "i");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".venv",
  "coverage",
  "playwright-report",
  "test-results",
]);

function files(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files(full, found);
      continue;
    }
    found.push(full);
  }
  return found;
}

describe("brand guard", () => {
  it("keeps the product name in the site module, the package name, and the docs", () => {
    const offenders: string[] = [];
    const banned: string[] = [];
    for (const full of files(process.cwd())) {
      const rel = path.relative(process.cwd(), full);
      if (
        rel === "package-lock.json" ||
        rel.endsWith("schema.d.ts") ||
        rel.endsWith("openapi.json") ||
        rel.startsWith("backend/.venv")
      ) {
        continue;
      }
      let text: string;
      try {
        text = readFileSync(full, "utf8");
      } catch {
        continue;
      }
      if (text.includes("\u0000")) continue;
      if (namePattern.test(text) && !ALLOWED_NAME.has(rel)) offenders.push(rel);
      if (retiredPattern.test(text)) banned.push(rel);
    }
    expect(offenders).toEqual([]);
    expect(banned).toEqual([]);
  });
});
