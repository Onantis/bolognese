import ts from "typescript";
import type { Issue, Rule, ParseContext } from "../types.js";
import {
  parseCode,
  positionToLineCol,
  diagnosticToMessage,
} from "../parser/index.js";

export const syntaxRules: Rule[] = [
  {
    id: "syntax/parse-error",
    description: "Detects syntax and parse errors in source code",
    severity: "error",
    fixable: false,
    check(context: ParseContext): Issue[] {
      const result = parseCode(context);
      if (!result.sourceFile) return [];

      return result.diagnostics.map((diag) => {
        const pos =
          diag.start !== undefined
            ? positionToLineCol(result.sourceFile!, diag.start)
            : { line: 1, column: 1 };

        const msg = diagnosticToMessage(diag);
        const type = classifySyntaxDiagnostic(msg);

        return {
          type,
          message: msg,
          line: pos.line,
          column: pos.column,
          severity: "error" as const,
          fixable: false,
          ruleId: "syntax/parse-error",
        };
      });
    },
  },
];

function classifySyntaxDiagnostic(message: string): Issue["type"] {
  const lower = message.toLowerCase();
  if (lower.includes("unterminated string")) return "UnclosedString";
  if (lower.includes("unexpected token") || lower.includes("expected '}'"))
    return "MissingBracket";
  if (lower.includes("invalid character") || lower.includes("unknown token"))
    return "InvalidToken";
  if (lower.includes("unexpected expression")) return "UnexpectedExpression";
  if (lower.includes("import")) return "ImportError";
  if (lower.includes("declaration")) return "InvalidDeclaration";
  return "SyntaxError";
}

export const structuralSyntaxRules: Rule[] = [
  {
    id: "syntax/unclosed-brackets",
    description: "Detects unclosed brackets, braces, and parentheses",
    severity: "error",
    fixable: false,
    check(context: ParseContext): Issue[] {
      const issues: Issue[] = [];
      const code = context.code;
      const stack: Array<{ char: string; line: number; col: number }> = [];
      const pairs: Record<string, string> = {
        "(": ")",
        "[": "]",
        "{": "}",
      };
      const closers = new Set([")", "]", "}"]);
      const openers = new Set(["(", "[", "{"]);

      let line = 1;
      let col = 1;
      let inString = false;
      let stringChar = "";
      let i = 0;

      while (i < code.length) {
        const ch = code[i];

        if (inString) {
          if (ch === "\\" && i + 1 < code.length) {
            i += 2;
            col += 2;
            continue;
          }
          if (ch === stringChar) {
            inString = false;
            stringChar = "";
          }
          if (ch === "\n") {
            line++;
            col = 1;
          } else {
            col++;
          }
          i++;
          continue;
        }

        if (ch === '"' || ch === "'" || ch === "`") {
          inString = true;
          stringChar = ch;
          col++;
          i++;
          continue;
        }

        if (ch === "\n") {
          line++;
          col = 1;
          i++;
          continue;
        }

        if (openers.has(ch)) {
          stack.push({ char: ch, line, col });
        } else if (closers.has(ch)) {
          if (stack.length === 0) {
            issues.push({
              type: "MissingBracket",
              message: `Unexpected closing '${ch}'`,
              line,
              column: col,
              severity: "error",
              fixable: false,
              ruleId: "syntax/unclosed-brackets",
            });
          } else {
            const last = stack[stack.length - 1];
            const expected = pairs[last.char];
            if (ch !== expected) {
              issues.push({
                type: "MissingBracket",
                message: `Expected '${expected}' but found '${ch}' (opened at line ${last.line}, col ${last.col})`,
                line,
                column: col,
                severity: "error",
                fixable: false,
                ruleId: "syntax/unclosed-brackets",
              });
            } else {
              stack.pop();
            }
          }
        }

        col++;
        i++;
      }

      for (const unclosed of stack) {
        const expected = pairs[unclosed.char];
        issues.push({
          type: "MissingBracket",
          message: `'${unclosed.char}' opened at line ${unclosed.line}, col ${unclosed.col} was never closed (expected '${expected}')`,
          line: unclosed.line,
          column: unclosed.col,
          severity: "error",
          fixable: false,
          ruleId: "syntax/unclosed-brackets",
        });
      }

      return issues;
    },
  },

  {
    id: "syntax/unclosed-string",
    description: "Detects unclosed string literals",
    severity: "error",
    fixable: true,
    check(context: ParseContext): Issue[] {
      const issues: Issue[] = [];
      const lines = context.code.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let inSingle = false;
        let inDouble = false;
        let inTemplate = false;

        for (let j = 0; j < line.length; j++) {
          const ch = line[j];
          if (ch === "\\" && j + 1 < line.length) {
            j++;
            continue;
          }
          if (ch === "'" && !inDouble && !inTemplate)
            inSingle = !inSingle;
          else if (ch === '"' && !inSingle && !inTemplate)
            inDouble = !inDouble;
          else if (ch === "`" && !inSingle && !inDouble)
            inTemplate = !inTemplate;
        }

        if (inSingle) {
          issues.push({
            type: "UnclosedString",
            message: "Unterminated single-quoted string literal",
            line: i + 1,
            column: line.lastIndexOf("'") + 1,
            severity: "error",
            fixable: true,
            ruleId: "syntax/unclosed-string",
          });
        }
        if (inDouble) {
          issues.push({
            type: "UnclosedString",
            message: "Unterminated double-quoted string literal",
            line: i + 1,
            column: line.lastIndexOf('"') + 1,
            severity: "error",
            fixable: true,
            ruleId: "syntax/unclosed-string",
          });
        }
      }

      return issues;
    },
  },
];
