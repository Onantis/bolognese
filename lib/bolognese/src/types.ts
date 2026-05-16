export type IssueType =
  | "SyntaxError"
  | "ParseError"
  | "UnusedVariable"
  | "DuplicateDeclaration"
  | "InvalidScope"
  | "UnsafePattern"
  | "FormattingIssue"
  | "ImportError"
  | "UnclosedString"
  | "MissingBracket"
  | "InvalidToken"
  | "UnexpectedExpression"
  | "InvalidDeclaration"
  | "WhitespaceIssue"
  | "IndentationIssue"
  | "SemicolonIssue"
  | "ImportOrderIssue";

export type IssueSeverity = "error" | "warning" | "info";

export interface Issue {
  type: IssueType;
  message: string;
  line: number;
  column: number;
  severity: IssueSeverity;
  fixable: boolean;
  ruleId?: string;
  source?: string;
}

export interface AnalysisResult {
  success: boolean;
  errors: Issue[];
  warnings: Issue[];
  infos: Issue[];
  fixed: boolean;
  filePath?: string;
  parseTime?: number;
}

export interface FixResult {
  code: string;
  fixed: boolean;
  fixes: AppliedFix[];
  errors: Issue[];
}

export interface AppliedFix {
  type: IssueType;
  description: string;
  line?: number;
}

export interface ConfigOptions {
  rules?: Partial<RulesConfig>;
  fix?: boolean;
  ignore?: string[];
  extensions?: string[];
  maxErrors?: number;
  severity?: Partial<Record<IssueType, IssueSeverity | "off">>;
}

export interface RulesConfig {
  unusedVariables: boolean;
  duplicateDeclarations: boolean;
  invalidScopes: boolean;
  unsafePatterns: boolean;
  formattingIssues: boolean;
  semicolons: boolean;
  importOrder: boolean;
  whitespace: boolean;
  indentation: boolean;
}

export interface ParseContext {
  code: string;
  filePath?: string;
  isTypeScript?: boolean;
  config: ConfigOptions;
}

export interface Rule {
  id: string;
  description: string;
  severity: IssueSeverity;
  fixable: boolean;
  check(context: ParseContext, ast: unknown): Issue[];
}
