#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { glob } from "glob";
import { analyze } from "../analyzer/index.js";
import { fix } from "../resolver/index.js";
import { formatAnalysisResult, formatFixResult } from "../formatter/index.js";
import type { ConfigOptions } from "../types.js";

const program = new Command();

program
  .name("bolognese")
  .description(
    "Syntax validation and automated code resolution for JavaScript and TypeScript.",
  )
  .version("0.1.0");

program
  .command("scan [paths...]")
  .description("Scan files or directories for issues")
  .option("--json", "Output results as JSON")
  .option("--compact", "Output results in compact format")
  .option("--no-warnings", "Suppress warnings")
  .option("--no-info", "Suppress info messages")
  .option("--max-errors <n>", "Maximum number of errors to report", parseInt)
  .option("--no-unused-vars", "Disable unused variable detection")
  .option("--no-duplicates", "Disable duplicate declaration detection")
  .option("--ext <extensions>", "File extensions to scan (comma-separated)", "js,ts,jsx,tsx")
  .action(async (paths: string[], opts) => {
    const targetPaths = paths.length > 0 ? paths : ["."];
    const extensions = opts.ext.split(",").map((e: string) => e.trim().replace(/^\./, ""));

    const config: ConfigOptions = {
      maxErrors: opts.maxErrors,
      rules: {
        unusedVariables: opts.unusedVars !== false,
        duplicateDeclarations: opts.duplicates !== false,
        unsafePatterns: true,
        formattingIssues: true,
        semicolons: true,
        importOrder: true,
        whitespace: opts.info !== false,
        indentation: true,
        invalidScopes: true,
      },
    };

    const format = opts.json ? "json" : opts.compact ? "compact" : "text";
    let totalErrors = 0;
    let totalWarnings = 0;
    let filesScanned = 0;

    const allResults: object[] = [];

    for (const targetPath of targetPaths) {
      const pattern = `${targetPath}/**/*.{${extensions.join(",")}}`;
      let files: string[];

      try {
        const stat = await import("fs/promises").then((m) =>
          m.stat(targetPath),
        );
        if (stat.isFile()) {
          files = [targetPath];
        } else {
          files = await glob(pattern, { ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"] });
        }
      } catch {
        files = [targetPath];
      }

      for (const file of files) {
        let code: string;
        try {
          code = readFileSync(file, "utf-8");
        } catch {
          process.stderr.write(`Error: Could not read file: ${file}\n`);
          continue;
        }

        filesScanned++;
        const result = analyze(code, { ...config, filePath: file });
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;

        if (format === "json") {
          allResults.push({
            file,
            success: result.success,
            errors: opts.warnings === false ? result.errors : result.errors,
            warnings: opts.warnings === false ? [] : result.warnings,
            infos: opts.info === false ? [] : result.infos,
          });
        } else {
          const hasIssues =
            result.errors.length > 0 ||
            (opts.warnings !== false && result.warnings.length > 0) ||
            (opts.info !== false && (result.infos?.length ?? 0) > 0);

          if (hasIssues) {
            process.stdout.write(
              formatAnalysisResult(
                opts.warnings === false
                  ? { ...result, warnings: [] }
                  : opts.info === false
                    ? { ...result, infos: [] }
                    : result,
                { format, showRuleId: true },
              ) + "\n\n",
            );
          }
        }
      }
    }

    if (format === "json") {
      process.stdout.write(
        JSON.stringify(
          {
            files: filesScanned,
            totalErrors,
            totalWarnings,
            results: allResults,
          },
          null,
          2,
        ) + "\n",
      );
    } else {
      process.stdout.write(
        `\nScanned ${filesScanned} file(s). Found ${totalErrors} error(s), ${totalWarnings} warning(s).\n`,
      );
    }

    if (totalErrors > 0) process.exit(1);
  });

program
  .command("fix [paths...]")
  .description("Automatically fix issues in files")
  .option("--dry-run", "Show what would be fixed without writing files")
  .option("--json", "Output results as JSON")
  .option("--ext <extensions>", "File extensions to fix (comma-separated)", "js,ts,jsx,tsx")
  .action(async (paths: string[], opts) => {
    const targetPaths = paths.length > 0 ? paths : ["."];
    const extensions = opts.ext.split(",").map((e: string) => e.trim().replace(/^\./, ""));

    let filesFixed = 0;
    let totalFixes = 0;

    for (const targetPath of targetPaths) {
      let files: string[];

      try {
        const stat = await import("fs/promises").then((m) =>
          m.stat(targetPath),
        );
        if (stat.isFile()) {
          files = [targetPath];
        } else {
          const pattern = `${targetPath}/**/*.{${extensions.join(",")}}`;
          files = await glob(pattern, { ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"] });
        }
      } catch {
        files = [targetPath];
      }

      for (const file of files) {
        let code: string;
        try {
          code = readFileSync(file, "utf-8");
        } catch {
          process.stderr.write(`Error: Could not read file: ${file}\n`);
          continue;
        }

        const result = fix(code, { filePath: file });

        if (result.fixed) {
          filesFixed++;
          totalFixes += result.fixes.length;

          if (!opts.dryRun) {
            writeFileSync(file, result.code, "utf-8");
          }

          if (opts.json) {
            process.stdout.write(
              JSON.stringify({ file, fixes: result.fixes }, null, 2) + "\n",
            );
          } else {
            const prefix = opts.dryRun ? "[DRY RUN] " : "";
            process.stdout.write(
              `${prefix}${file}: Applied ${result.fixes.length} fix(es)\n`,
            );
            for (const f of result.fixes) {
              process.stdout.write(`  + ${f.description}\n`);
            }
          }
        }
      }
    }

    const prefix = opts.dryRun ? "[DRY RUN] " : "";
    process.stdout.write(
      `\n${prefix}Fixed ${totalFixes} issue(s) across ${filesFixed} file(s).\n`,
    );
  });

program
  .command("check <code>")
  .description("Analyze a code string directly (useful for piping)")
  .option("--json", "Output results as JSON")
  .option("--ts", "Treat input as TypeScript")
  .action((code: string, opts) => {
    const result = analyze(code, {
      filePath: opts.ts ? "__input__.ts" : "__input__.js",
    });

    const format = opts.json ? "json" : "text";
    process.stdout.write(
      formatAnalysisResult(result, { format, showRuleId: true }) + "\n",
    );

    if (!result.success) process.exit(1);
  });

program.parse(process.argv);
