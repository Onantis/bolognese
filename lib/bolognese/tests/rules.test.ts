import { describe, it, expect } from "vitest";
import { structuralSyntaxRules } from "../src/rules/syntax.js";
import { formattingRules } from "../src/rules/formatting.js";
import type { ParseContext } from "../src/types.js";

function ctx(code: string): ParseContext {
  return { code, config: {}, isTypeScript: false };
}

const bracketRule = structuralSyntaxRules.find(
  (r) => r.id === "syntax/unclosed-brackets",
)!;
const stringRule = structuralSyntaxRules.find(
  (r) => r.id === "syntax/unclosed-string",
)!;
const semicolonRule = formattingRules.find(
  (r) => r.id === "formatting/semicolons",
)!;
const importRule = formattingRules.find(
  (r) => r.id === "formatting/import-order",
)!;
const whitespaceRule = formattingRules.find(
  (r) => r.id === "formatting/trailing-whitespace",
)!;

describe("syntax/unclosed-brackets rule", () => {
  it("reports unclosed opening brace", () => {
    const issues = bracketRule.check(ctx(`function foo() {`), null);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].type).toBe("MissingBracket");
  });

  it("reports mismatched bracket pair", () => {
    const issues = bracketRule.check(ctx(`function foo() [`), null);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("reports no issues for balanced brackets", () => {
    const issues = bracketRule.check(
      ctx(`function foo() { return [1, 2]; }`),
      null,
    );
    expect(issues).toHaveLength(0);
  });

  it("ignores brackets inside strings", () => {
    const issues = bracketRule.check(
      ctx(`const s = "this { is fine }";`),
      null,
    );
    expect(issues).toHaveLength(0);
  });
});

describe("syntax/unclosed-string rule", () => {
  it("detects unclosed double-quoted string", () => {
    const issues = stringRule.check(ctx(`const x = "hello`), null);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].type).toBe("UnclosedString");
  });

  it("detects unclosed single-quoted string", () => {
    const issues = stringRule.check(ctx(`const x = 'world`), null);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("does not flag closed strings", () => {
    const issues = stringRule.check(
      ctx(`const x = "hello"; const y = 'world';`),
      null,
    );
    expect(issues).toHaveLength(0);
  });

  it("does not flag escaped quote inside string", () => {
    const issues = stringRule.check(ctx(`const x = "say \\"hi\\"";`), null);
    expect(issues).toHaveLength(0);
  });
});

describe("formatting/trailing-whitespace rule", () => {
  it("detects trailing spaces", () => {
    const issues = whitespaceRule.check(ctx(`const x = 1;   `), null);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].type).toBe("WhitespaceIssue");
  });

  it("does not flag clean lines", () => {
    const issues = whitespaceRule.check(ctx(`const x = 1;\nconst y = 2;`), null);
    expect(issues).toHaveLength(0);
  });
});

describe("formatting/import-order rule", () => {
  it("flags unsorted imports", () => {
    const issues = importRule.check(
      ctx(
        `import { z } from "zod";\nimport { a } from "alpha";\n\nconst x = 1;`,
      ),
      null,
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  it("does not flag sorted imports", () => {
    const issues = importRule.check(
      ctx(
        `import { a } from "alpha";\nimport { z } from "zod";\n\nconst x = 1;`,
      ),
      null,
    );
    const orderIssues = issues.filter((i) => i.type === "ImportOrderIssue");
    expect(orderIssues).toHaveLength(0);
  });
});
