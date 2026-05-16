import type {
  AnalysisResult,
  ConfigOptions,
  Issue,
  ParseContext,
} from "../types.js";
import { getActiveRules } from "../rules/index.js";
import { isTypeScriptFile } from "../parser/index.js";

let globalConfig: ConfigOptions = {};

export function configure(options: ConfigOptions): void {
  globalConfig = { ...globalConfig, ...options };
}

export function getConfig(): ConfigOptions {
  return { ...globalConfig };
}

export function analyze(
  code: string,
  options: ConfigOptions & { filePath?: string } = {},
): AnalysisResult {
  const startTime = Date.now();
  const config = { ...globalConfig, ...options };
  const filePath = options.filePath;
  const isTypeScript = filePath
    ? isTypeScriptFile(filePath)
    : /\binterface\b|\btype\b|\b:\s*\w+/.test(code);

  const context: ParseContext = {
    code,
    filePath,
    isTypeScript,
    config,
  };

  const activeRules = getActiveRules(config);
  const allIssues: Issue[] = [];

  const seenSyntax = new Set<string>();
  let hasSyntaxError = false;

  for (const rule of activeRules) {
    try {
      const issues = rule.check(context, null);
      for (const issue of issues) {
        const key = `${issue.type}:${issue.line}:${issue.column}:${issue.message}`;
        if (!seenSyntax.has(key)) {
          seenSyntax.add(key);
          allIssues.push(issue);
        }
      }

      if (
        rule.id === "syntax/parse-error" &&
        issues.some((i) => i.severity === "error")
      ) {
        hasSyntaxError = true;
      }
    } catch {
    }
  }

  const maxErrors = config.maxErrors ?? Infinity;
  const errors = allIssues
    .filter((i) => i.severity === "error")
    .slice(0, maxErrors);
  const warnings = allIssues.filter((i) => i.severity === "warning");
  const infos = allIssues.filter((i) => i.severity === "info");

  return {
    success: errors.length === 0,
    errors,
    warnings,
    infos,
    fixed: false,
    filePath,
    parseTime: Date.now() - startTime,
  };
}
