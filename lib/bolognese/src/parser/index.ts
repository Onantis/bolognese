import ts from "typescript";
import type { ParseContext } from "../types.js";

export interface ParseResult {
  sourceFile: ts.SourceFile | null;
  diagnostics: ts.Diagnostic[];
  success: boolean;
}

export function parseCode(context: ParseContext): ParseResult {
  const { code, filePath, isTypeScript } = context;
  const fileName =
    filePath ?? (isTypeScript ? "__input__.ts" : "__input__.js");

  const compilerOptions: ts.CompilerOptions = {
    allowJs: true,
    checkJs: true,
    noEmit: true,
    strict: false,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    skipLibCheck: true,
  };

  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.ES2020,
    true,
    isTypeScript ? ts.ScriptKind.TSX : ts.ScriptKind.JSX,
  );

  const syntaxDiagnostics = sourceFile.parseDiagnostics as ts.Diagnostic[];

  return {
    sourceFile,
    diagnostics: syntaxDiagnostics ?? [],
    success: (syntaxDiagnostics ?? []).length === 0,
  };
}

export function isTypeScriptFile(filePath: string): boolean {
  return /\.(ts|tsx)$/.test(filePath);
}

export function getNodeKindName(kind: ts.SyntaxKind): string {
  return ts.SyntaxKind[kind] ?? "Unknown";
}

export function positionToLineCol(
  sourceFile: ts.SourceFile,
  pos: number,
): { line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
  return { line: line + 1, column: character + 1 };
}

export function diagnosticToMessage(diagnostic: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
}
