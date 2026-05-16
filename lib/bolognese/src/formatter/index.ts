import type { AnalysisResult, FixResult, Issue } from "../types.js";

export type OutputFormat = "text" | "json" | "compact";

export interface FormatOptions {
  format?: OutputFormat;
  colors?: boolean;
  showFilePath?: boolean;
  showRuleId?: boolean;
}

export function formatAnalysisResult(
  result: AnalysisResult,
  options: FormatOptions = {},
): string {
  const { format = "text" } = options;

  if (format === "json") {
    return formatAsJson(result);
  }

  if (format === "compact") {
    return formatAsCompact(result);
  }

  return formatAsText(result, options);
}

export function formatFixResult(
  result: FixResult,
  options: FormatOptions = {},
): string {
  const { format = "text" } = options;

  if (format === "json") {
    return JSON.stringify(
      {
        fixed: result.fixed,
        fixes: result.fixes,
        errors: result.errors,
        fixCount: result.fixes.length,
        remainingErrors: result.errors.length,
      },
      null,
      2,
    );
  }

  const lines: string[] = [];

  if (result.fixed) {
    lines.push(`Fixed ${result.fixes.length} issue(s):`);
    for (const fix of result.fixes) {
      lines.push(`  + ${fix.description}`);
    }
  } else {
    lines.push("No automatic fixes were applied.");
  }

  if (result.errors.length > 0) {
    lines.push("");
    lines.push(`${result.errors.length} error(s) remain after fixing:`);
    for (const error of result.errors) {
      lines.push(formatIssue(error, options));
    }
  }

  return lines.join("\n");
}

function formatAsJson(result: AnalysisResult): string {
  return JSON.stringify(
    {
      success: result.success,
      errors: result.errors,
      warnings: result.warnings,
      fixed: result.fixed,
      filePath: result.filePath,
      parseTime: result.parseTime,
      summary: {
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        infoCount: result.infos?.length ?? 0,
      },
    },
    null,
    2,
  );
}

function formatAsCompact(result: AnalysisResult): string {
  const issues = [
    ...result.errors,
    ...result.warnings,
    ...(result.infos ?? []),
  ];

  if (issues.length === 0) {
    const fp = result.filePath ? `${result.filePath}: ` : "";
    return `${fp}no issues found`;
  }

  return issues
    .map((issue) => {
      const fp = result.filePath ? `${result.filePath}:` : "";
      return `${fp}${issue.line}:${issue.column}: ${issue.severity.toUpperCase()} ${issue.message} (${issue.type})`;
    })
    .join("\n");
}

function formatAsText(
  result: AnalysisResult,
  options: FormatOptions,
): string {
  const lines: string[] = [];

  if (result.filePath) {
    lines.push(`File: ${result.filePath}`);
    lines.push("");
  }

  const allIssues = [
    ...result.errors,
    ...result.warnings,
    ...(result.infos ?? []),
  ].sort((a, b) => a.line - b.line || a.column - b.column);

  if (allIssues.length === 0) {
    lines.push("No issues detected");
  } else {
    for (const issue of allIssues) {
      lines.push(formatIssue(issue, options));
    }
    lines.push("");
    lines.push(
      `Found ${result.errors.length} error(s), ${result.warnings.length} warning(s), ${result.infos?.length ?? 0} info(s)`,
    );
  }

  if (result.parseTime !== undefined) {
    lines.push(`Analysis completed in ${result.parseTime}ms`);
  }

  return lines.join("\n");
}

function formatIssue(issue: Issue, options: FormatOptions): string {
  const location = `${issue.line}:${issue.column}`;
  const severity = issue.severity.padEnd(7);
  const ruleId =
    options.showRuleId !== false && issue.ruleId
      ? ` [${issue.ruleId}]`
      : "";
  const fixable = issue.fixable ? " (fixable)" : "";
  return `  ${location.padEnd(8)} ${severity} ${issue.message}${ruleId}${fixable}`;
}
