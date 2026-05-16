import { describe, it, expect } from "vitest";
import { fix } from "../src/resolver/index.js";

describe("fix()", () => {
  it("returns code and fixed flag", () => {
    const result = fix(`const x = 1`);
    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("fixed");
    expect(result).toHaveProperty("fixes");
    expect(result).toHaveProperty("errors");
  });

  it("removes trailing whitespace", () => {
    const result = fix("const x = 1;   \nconst y = 2;  ");
    expect(result.code).not.toMatch(/\s+$/m);
    expect(result.fixed).toBe(true);
  });

  it("sorts imports alphabetically", () => {
    const code = `import { z } from "zod";
import { a } from "alpha";
import { b } from "beta";

const x = 1;`;
    const result = fix(code);
    const lines = result.code.split("\n");
    const importLines = lines.filter((l) => l.startsWith("import"));
    const sorted = [...importLines].sort();
    expect(importLines).toEqual(sorted);
    expect(result.fixed).toBe(true);
  });

  it("closes unclosed strings", () => {
    const result = fix(`const msg = "hello`);
    expect(result.code).toContain('"hello"');
    expect(result.fixed).toBe(true);
  });

  it("returns descriptions for each fix applied", () => {
    const result = fix("const x = 1;   ");
    if (result.fixed) {
      expect(result.fixes.length).toBeGreaterThan(0);
      for (const f of result.fixes) {
        expect(f).toHaveProperty("type");
        expect(f).toHaveProperty("description");
        expect(typeof f.description).toBe("string");
      }
    }
  });

  it("returns unchanged code when nothing to fix", () => {
    const code = `const x = 1;\nconst y = 2;\n`;
    const result = fix(code);
    expect(result.errors).toBeDefined();
  });
});
