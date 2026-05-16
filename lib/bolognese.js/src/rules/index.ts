import type { Rule, ConfigOptions } from "../types.js";
import { syntaxRules, structuralSyntaxRules } from "./syntax.js";
import { structuralRules } from "./structural.js";
import { formattingRules } from "./formatting.js";

export const allRules: Rule[] = [
  ...syntaxRules,
  ...structuralSyntaxRules,
  ...structuralRules,
  ...formattingRules,
];

export function getActiveRules(config: ConfigOptions): Rule[] {
  const rules = config.rules ?? {};
  const severity = config.severity ?? {};

  return allRules.filter((rule) => {
    const overriddenSeverity = severity[
      rule.severity as keyof typeof severity
    ];
    if (overriddenSeverity === "off") return false;

    if (rule.id.startsWith("structural/unused-variables") && rules.unusedVariables === false)
      return false;
    if (rule.id.startsWith("structural/duplicate-declarations") && rules.duplicateDeclarations === false)
      return false;
    if (rule.id.startsWith("structural/unsafe-patterns") && rules.unsafePatterns === false)
      return false;
    if (rule.id.startsWith("formatting/semicolons") && rules.semicolons === false)
      return false;
    if (rule.id.startsWith("formatting/indentation") && rules.indentation === false)
      return false;
    if (rule.id.startsWith("formatting/trailing-whitespace") && rules.whitespace === false)
      return false;
    if (rule.id.startsWith("formatting/import-order") && rules.importOrder === false)
      return false;

    return true;
  });
}

export { syntaxRules, structuralSyntaxRules, structuralRules, formattingRules };
