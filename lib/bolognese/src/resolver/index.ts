import type { FixResult, AppliedFix, ConfigOptions } from "../types.js";
import { analyze } from "../analyzer/index.js";

export function fix(
  code: string,
  options: ConfigOptions & { filePath?: string } = {},
): FixResult {
  let current = code;
  const fixes: AppliedFix[] = [];

  current = fixUnclosedStrings(current, fixes);
  current = fixTrailingWhitespace(current, fixes);
  current = fixSemicolons(current, fixes);
  current = fixIndentation(current, fixes);
  current = fixImportOrder(current, fixes);

  const remaining = analyze(current, options);

  return {
    code: current,
    fixed: fixes.length > 0,
    fixes,
    errors: remaining.errors,
  };
}

function fixTrailingWhitespace(code: string, fixes: AppliedFix[]): string {
  const result = code
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");

  if (result !== code) {
    fixes.push({
      type: "WhitespaceIssue",
      description: "Removed trailing whitespace",
    });
  }

  return result;
}

function fixSemicolons(code: string, fixes: AppliedFix[]): string {
  const lines = code.split("\n");
  let changed = false;

  const needsSemicolon = (line: string): boolean => {
    const trimmed = line.trimEnd();
    if (trimmed.length === 0) return false;
    if (trimmed.endsWith(";")) return false;
    if (trimmed.endsWith("{") || trimmed.endsWith("}")) return false;
    if (trimmed.endsWith(",") || trimmed.endsWith("(")) return false;
    if (trimmed.endsWith("=>") || trimmed.endsWith("\\")) return false;
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    )
      return false;
    if (
      trimmed.startsWith("if ") ||
      trimmed.startsWith("} else") ||
      trimmed.startsWith("for ") ||
      trimmed.startsWith("while ") ||
      trimmed.startsWith("function ") ||
      trimmed.startsWith("class ") ||
      trimmed.startsWith("async function") ||
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export default function") ||
      trimmed.startsWith("export default class")
    )
      return false;

    return /\w[^;{}\n]$/.test(trimmed);
  };

  const result = lines.map((line, i) => {
    if (needsSemicolon(line)) {
      changed = true;
      return line.trimEnd() + ";";
    }
    return line;
  });

  if (changed) {
    fixes.push({
      type: "SemicolonIssue",
      description: "Added missing semicolons",
    });
  }

  return result.join("\n");
}

function fixIndentation(code: string, fixes: AppliedFix[]): string {
  const lines = code.split("\n");
  let tabCount = 0;
  let spaceCount = 0;

  for (const line of lines) {
    if (line.startsWith("\t")) tabCount++;
    else if (line.startsWith("  ")) spaceCount++;
  }

  if (tabCount === 0 || spaceCount === 0) return code;

  const dominant: "tabs" | "spaces" = tabCount > spaceCount ? "tabs" : "spaces";

  const result = lines.map((line) => {
    if (dominant === "spaces" && line.startsWith("\t")) {
      return line.replace(/^\t+/, (tabs) => "  ".repeat(tabs.length));
    }
    if (dominant === "tabs" && /^ {2,}/.test(line)) {
      return line.replace(/^( {2})+/, (spaces) =>
        "\t".repeat(spaces.length / 2),
      );
    }
    return line;
  });

  const fixed = result.join("\n");
  if (fixed !== code) {
    fixes.push({
      type: "IndentationIssue",
      description: `Normalized indentation to ${dominant}`,
    });
  }

  return fixed;
}

function fixImportOrder(code: string, fixes: AppliedFix[]): string {
  const lines = code.split("\n");
  const importBlock: string[] = [];
  const importIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("import ")) {
      importBlock.push(lines[i]);
      importIndices.push(i);
    }
  }

  if (importBlock.length <= 1) return code;

  const sorted = [...importBlock].sort((a, b) => a.localeCompare(b));
  const alreadySorted = importBlock.every((v, i) => v === sorted[i]);

  if (alreadySorted) return code;

  const result = [...lines];
  for (let i = 0; i < importIndices.length; i++) {
    result[importIndices[i]] = sorted[i];
  }

  fixes.push({
    type: "ImportOrderIssue",
    description: "Sorted import statements alphabetically",
  });

  return result.join("\n");
}

function fixUnclosedStrings(code: string, fixes: AppliedFix[]): string {
  const lines = code.split("\n");
  let changed = false;

  const result = lines.map((line, i) => {
    let singles = 0;
    let doubles = 0;
    let inSingle = false;
    let inDouble = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === "\\" && j + 1 < line.length) {
        j++;
        continue;
      }
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
        if (inSingle) singles++;
      } else if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
        if (inDouble) doubles++;
      }
    }

    if (inSingle) {
      changed = true;
      return line + "'";
    }
    if (inDouble) {
      changed = true;
      return line + '"';
    }
    return line;
  });

  if (changed) {
    fixes.push({
      type: "UnclosedString",
      description: "Closed unclosed string literals",
    });
  }

  return result.join("\n");
}
