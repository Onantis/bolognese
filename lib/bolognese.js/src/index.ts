export { analyze, configure, getConfig } from "./analyzer/index.js";
export { fix } from "./resolver/index.js";
export {
  formatAnalysisResult,
  formatFixResult,
  type FormatOptions,
  type OutputFormat,
} from "./formatter/index.js";
export {
  allRules,
  getActiveRules,
  syntaxRules,
  structuralRules,
  formattingRules,
} from "./rules/index.js";
export type {
  AnalysisResult,
  FixResult,
  AppliedFix,
  Issue,
  IssueType,
  IssueSeverity,
  ConfigOptions,
  RulesConfig,
  Rule,
  ParseContext,
} from "./types.js";
