import type { Issue, Rule, ParseContext } from "../types.js";

export const formattingRules: Rule[] = [
  {
    id: "formatting/semicolons",
    description: "Detects missing semicolons at end of statements",
    severity: "warning",
    fixable: true,
    check(context: ParseContext): Issue[] {
      const issues: Issue[] = [];
      const lines = context.code.split("\n");

      const needsSemicolon =
        /^(?!.*\/\/)(?!.*\{$)(?!.*\}$)(?!.*,$)(?!.*\($)(?!^.*=>)(?!^import )(?!^export )(?!^if |^for |^while |^function |^class |^\/\/).*\w[^;{}\n]$/;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trimEnd();
        if (
          trimmed.length > 0 &&
          !trimmed.endsWith(";") &&
          !trimmed.endsWith("{") &&
          !trimmed.endsWith("}") &&
          !trimmed.endsWith(",") &&
          !trimmed.endsWith("(") &&
          !trimmed.startsWith("//") &&
          !trimmed.startsWith("*") &&
          !trimmed.startsWith("/*") &&
          !trimmed.startsWith("import ") &&
          !trimmed.startsWith("export default ") &&
          !trimmed.startsWith("if ") &&
          !trimmed.startsWith("} else") &&
          !trimmed.startsWith("for ") &&
          !trimmed.startsWith("while ") &&
          !trimmed.startsWith("function ") &&
          !trimmed.startsWith("class ") &&
          !trimmed.startsWith("async function") &&
          needsSemicolon.test(trimmed)
        ) {
          issues.push({
            type: "SemicolonIssue",
            message: "Missing semicolon",
            line: i + 1,
            column: trimmed.length + 1,
            severity: "warning",
            fixable: true,
            ruleId: "formatting/semicolons",
          });
        }
      }

      return issues;
    },
  },

  {
    id: "formatting/indentation",
    description: "Detects inconsistent indentation",
    severity: "warning",
    fixable: true,
    check(context: ParseContext): Issue[] {
      const issues: Issue[] = [];
      const lines = context.code.split("\n");

      let usesSpaces = 0;
      let usesTabs = 0;

      for (const line of lines) {
        if (line.startsWith("  ")) usesSpaces++;
        if (line.startsWith("\t")) usesTabs++;
      }

      const dominant: "spaces" | "tabs" | null =
        usesSpaces > usesTabs
          ? "spaces"
          : usesTabs > usesSpaces
            ? "tabs"
            : null;

      if (dominant === null) return issues;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.length === 0) continue;

        const hasTabIndent = line.startsWith("\t");
        const hasSpaceIndent = line.startsWith("  ");

        if (dominant === "spaces" && hasTabIndent) {
          issues.push({
            type: "IndentationIssue",
            message: "Mixed indentation: tab found in file that uses spaces",
            line: i + 1,
            column: 1,
            severity: "warning",
            fixable: true,
            ruleId: "formatting/indentation",
          });
        } else if (dominant === "tabs" && hasSpaceIndent) {
          issues.push({
            type: "IndentationIssue",
            message: "Mixed indentation: spaces found in file that uses tabs",
            line: i + 1,
            column: 1,
            severity: "warning",
            fixable: true,
            ruleId: "formatting/indentation",
          });
        }
      }

      return issues;
    },
  },

  {
    id: "formatting/trailing-whitespace",
    description: "Detects trailing whitespace on lines",
    severity: "info",
    fixable: true,
    check(context: ParseContext): Issue[] {
      const issues: Issue[] = [];
      const lines = context.code.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (/\s+$/.test(lines[i])) {
          issues.push({
            type: "WhitespaceIssue",
            message: "Trailing whitespace",
            line: i + 1,
            column: lines[i].trimEnd().length + 1,
            severity: "info",
            fixable: true,
            ruleId: "formatting/trailing-whitespace",
          });
        }
      }

      return issues;
    },
  },

  {
    id: "formatting/import-order",
    description: "Detects unsorted import statements",
    severity: "info",
    fixable: true,
    check(context: ParseContext): Issue[] {
      const issues: Issue[] = [];
      const lines = context.code.split("\n");

      const importLines: Array<{ text: string; lineNum: number }> = [];
      let lastImportLine = -1;
      let firstNonImportAfterImports = -1;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith("import ")) {
          if (
            firstNonImportAfterImports !== -1 &&
            firstNonImportAfterImports < i
          ) {
            issues.push({
              type: "ImportOrderIssue",
              message: "Import statements should be grouped together at the top of the file",
              line: i + 1,
              column: 1,
              severity: "info",
              fixable: true,
              ruleId: "formatting/import-order",
            });
          }
          importLines.push({ text: trimmed, lineNum: i + 1 });
          lastImportLine = i;
        } else if (
          trimmed.length > 0 &&
          lastImportLine !== -1 &&
          firstNonImportAfterImports === -1 &&
          !trimmed.startsWith("//")
        ) {
          firstNonImportAfterImports = i;
        }
      }

      if (importLines.length > 1) {
        const sorted = [...importLines].sort((a, b) =>
          a.text.localeCompare(b.text),
        );
        const isOrdered = importLines.every(
          (imp, i) => imp.text === sorted[i].text,
        );
        if (!isOrdered) {
          issues.push({
            type: "ImportOrderIssue",
            message: "Import statements are not sorted alphabetically",
            line: importLines[0].lineNum,
            column: 1,
            severity: "info",
            fixable: true,
            ruleId: "formatting/import-order",
          });
        }
      }

      return issues;
    },
  },
];
