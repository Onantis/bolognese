import { describe, it, expect } from "vitest";
import { formatAnalysisResult } from "../src/formatter/index.js";
import type { AnalysisResult } from "../src/types.js";

const errorResult: AnalysisResult = {
  success: false,
  errors: [
    {
      type: "SyntaxError",
      message: "Unexpected token",
      line: 2,
      column: 14,
      severity: "error",
      fixable: false,
    },
  ],
  warnings: [],
  infos: [],
  fixed: false,
};

const cleanResult: AnalysisResult = {
  success: true,
  errors: [],
  warnings: [],
  infos: [],
  fixed: false,
  parseTime: 12,
};

describe("formatAnalysisResult()", () => {
  it("formats as valid JSON when format is json", () => {
    const output = formatAnalysisResult(errorResult, { format: "json" });
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty("success", false);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0].type).toBe("SyntaxError");
  });

  it("includes line and column in JSON output", () => {
    const output = formatAnalysisResult(errorResult, { format: "json" });
    const parsed = JSON.parse(output);
    expect(parsed.errors[0].line).toBe(2);
    expect(parsed.errors[0].column).toBe(14);
  });

  it("produces compact single-line format per issue", () => {
    const output = formatAnalysisResult(errorResult, { format: "compact" });
    expect(output).toContain("2:14");
    expect(output).toContain("ERROR");
    expect(output).toContain("Unexpected token");
  });

  it("shows no issues message for clean result in text format", () => {
    const output = formatAnalysisResult(cleanResult, { format: "text" });
    expect(output).toContain("No issues");
  });

  it("includes parse time in text output", () => {
    const output = formatAnalysisResult(cleanResult, { format: "text" });
    expect(output).toContain("12ms");
  });

  it("shows file path in text output when provided", () => {
    const result = { ...errorResult, filePath: "src/app.ts" };
    const output = formatAnalysisResult(result, { format: "text" });
    expect(output).toContain("src/app.ts");
  });
});
