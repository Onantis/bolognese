import ts from "typescript";
import type { Issue, Rule, ParseContext } from "../types.js";
import { parseCode, positionToLineCol } from "../parser/index.js";

export const structuralRules: Rule[] = [
  {
    id: "structural/unused-variables",
    description: "Detects declared variables that are never read",
    severity: "warning",
    fixable: false,
    check(context: ParseContext): Issue[] {
      const issues: Issue[] = [];
      const { sourceFile } = parseCode(context);
      if (!sourceFile) return issues;

      const declared = new Map<
        string,
        { line: number; column: number; node: ts.Node }
      >();
      const used = new Set<string>();

      function visit(node: ts.Node): void {
        if (
          ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name)
        ) {
          const pos = positionToLineCol(sourceFile!, node.name.getStart());
          declared.set(node.name.text, {
            line: pos.line,
            column: pos.column,
            node,
          });
        }

        if (
          ts.isIdentifier(node) &&
          !ts.isVariableDeclaration(node.parent) &&
          !ts.isFunctionDeclaration(node.parent) &&
          !ts.isParameter(node.parent) &&
          !ts.isPropertyDeclaration(node.parent) &&
          !ts.isBindingElement(node.parent)
        ) {
          used.add(node.text);
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);

      for (const [name, info] of declared.entries()) {
        if (!used.has(name)) {
          issues.push({
            type: "UnusedVariable",
            message: `Variable '${name}' is declared but never used`,
            line: info.line,
            column: info.column,
            severity: "warning",
            fixable: false,
            ruleId: "structural/unused-variables",
          });
        }
      }

      return issues;
    },
  },

  {
    id: "structural/duplicate-declarations",
    description: "Detects duplicate variable declarations in the same scope",
    severity: "error",
    fixable: false,
    check(context: ParseContext): Issue[] {
      const issues: Issue[] = [];
      const { sourceFile } = parseCode(context);
      if (!sourceFile) return issues;

      const declared = new Map<string, { line: number; column: number }[]>();

      function visit(node: ts.Node): void {
        if (
          ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name) &&
          node.parent &&
          ts.isVariableDeclarationList(node.parent)
        ) {
          const keyword = node.parent.flags & ts.NodeFlags.Const
            ? "const"
            : node.parent.flags & ts.NodeFlags.Let
              ? "let"
              : "var";

          if (keyword !== "var") {
            const name = node.name.text;
            const pos = positionToLineCol(sourceFile!, node.name.getStart());
            const existing = declared.get(name) ?? [];
            existing.push(pos);
            declared.set(name, existing);
          }
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);

      for (const [name, positions] of declared.entries()) {
        if (positions.length > 1) {
          for (let i = 1; i < positions.length; i++) {
            issues.push({
              type: "DuplicateDeclaration",
              message: `'${name}' has already been declared (first at line ${positions[0].line})`,
              line: positions[i].line,
              column: positions[i].column,
              severity: "error",
              fixable: false,
              ruleId: "structural/duplicate-declarations",
            });
          }
        }
      }

      return issues;
    },
  },

  {
    id: "structural/unsafe-patterns",
    description: "Detects potentially unsafe coding patterns",
    severity: "warning",
    fixable: false,
    check(context: ParseContext): Issue[] {
      const issues: Issue[] = [];
      const { sourceFile } = parseCode(context);
      if (!sourceFile) return issues;

      function visit(node: ts.Node): void {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "eval"
        ) {
          const pos = positionToLineCol(sourceFile!, node.getStart());
          issues.push({
            type: "UnsafePattern",
            message: "Use of eval() is unsafe and should be avoided",
            line: pos.line,
            column: pos.column,
            severity: "warning",
            fixable: false,
            ruleId: "structural/unsafe-patterns",
          });
        }

        if (
          ts.isBinaryExpression(node) &&
          node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken
        ) {
          const pos = positionToLineCol(
            sourceFile!,
            node.operatorToken.getStart(),
          );
          issues.push({
            type: "UnsafePattern",
            message:
              "Use '===' instead of '==' for strict equality comparison",
            line: pos.line,
            column: pos.column,
            severity: "warning",
            fixable: true,
            ruleId: "structural/unsafe-patterns",
          });
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
      return issues;
    },
  },
];
