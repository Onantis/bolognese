import { describe, it, expect } from "vitest";
import { analyze } from "../src/analyzer/index.js";

describe("analyze()", () => {
  it("returns success for valid JavaScript", () => {
    const result = analyze(`
function greet(name) {
  return "Hello, " + name;
}
greet("World");
`);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects unclosed bracket", () => {
    const result = analyze(`
function test( {
  console.log("Hello")
}
`);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("detects unclosed string", () => {
    const result = analyze(`const x = "unclosed`);
    const issues = [...result.errors, ...result.warnings];
    const stringIssues = issues.filter(
      (i) => i.type === "UnclosedString" || i.type === "SyntaxError",
    );
    expect(stringIssues.length).toBeGreaterThan(0);
  });

  it("detects unused variable", () => {
    const result = analyze(`
const unusedVar = 42;
const usedVar = "hello";
console.log(usedVar);
`);
    const unusedIssues = result.warnings.filter(
      (i) => i.type === "UnusedVariable",
    );
    expect(unusedIssues.length).toBeGreaterThan(0);
    expect(unusedIssues[0].message).toContain("unusedVar");
  });

  it("detects duplicate declarations", () => {
    const result = analyze(`
const x = 1;
const x = 2;
console.log(x);
`);
    const dupeIssues = result.errors.filter(
      (i) => i.type === "DuplicateDeclaration",
    );
    expect(dupeIssues.length).toBeGreaterThan(0);
  });

  it("detects eval usage as unsafe pattern", () => {
    const result = analyze(`
const code = "1 + 2";
const result = eval(code);
`);
    const unsafeIssues = result.warnings.filter(
      (i) => i.type === "UnsafePattern" && i.message.includes("eval"),
    );
    expect(unsafeIssues.length).toBeGreaterThan(0);
  });

  it("includes line and column numbers", () => {
    const result = analyze(`function test( {
  console.log("Hello")
}
`);
    if (result.errors.length > 0) {
      const err = result.errors[0];
      expect(err.line).toBeGreaterThan(0);
      expect(err.column).toBeGreaterThan(0);
    }
  });

  it("returns parseTime in result", () => {
    const result = analyze(`const x = 1;`);
    expect(result.parseTime).toBeDefined();
    expect(typeof result.parseTime).toBe("number");
  });

  it("returns correct shape matching documented API", () => {
    const result = analyze(`
function test( {
  console.log("Hello")
}
`);
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("fixed");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
