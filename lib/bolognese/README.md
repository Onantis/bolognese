# bolognese

> Syntax validation and automated code resolution for JavaScript and TypeScript.

Bolognese analyzes JavaScript and TypeScript code, detects syntax and structural problems, and reports issues in a practical, readable way. For supported cases, it can also apply fixes automatically.

## Features

- **Syntax detection** — missing brackets, unclosed strings, invalid tokens, parse failures
- **Structural analysis** — unused variables, duplicate declarations, unsafe patterns
- **Automated fixes** — trailing whitespace, semicolons, import ordering, indentation, unclosed strings
- **CLI support** — file scanning, recursive project analysis, JSON output, CI integration
- **Configurable rules** — enable or disable individual checks

## Installation

```bash
npm install bolognese
```

## Usage

### `analyze()`

Analyzes source code and returns detected issues.

```js
import { analyze } from "bolognese";

const result = analyze(`
function test( {
  console.log("Hello")
}
`);

console.log(result);
// {
//   success: false,
//   errors: [{ type: "MissingBracket", message: "...", line: 2, column: 15, ... }],
//   warnings: [],
//   infos: [],
//   fixed: false
// }
```

### `fix()`

Applies automatic fixes where available.

```js
import { fix } from "bolognese";

const output = fix(sourceCode);

console.log(output.code);   // fixed source
console.log(output.fixes);  // list of applied fixes
console.log(output.errors); // remaining unfixable errors
```

### `configure()`

Loads custom rule configuration globally.

```js
import { configure } from "bolognese";

configure({
  rules: {
    unusedVariables: true,
    semicolons: false,
    importOrder: true,
  },
  maxErrors: 50,
});
```

## Result Format

### AnalysisResult

```ts
{
  success: boolean;
  errors: Issue[];
  warnings: Issue[];
  infos: Issue[];
  fixed: boolean;
  filePath?: string;
  parseTime?: number;
}
```

### Issue

```ts
{
  type: IssueType;     // "SyntaxError" | "MissingBracket" | "UnusedVariable" | ...
  message: string;
  line: number;
  column: number;
  severity: "error" | "warning" | "info";
  fixable: boolean;
  ruleId?: string;
}
```

### FixResult

```ts
{
  code: string;        // transformed source code
  fixed: boolean;      // whether any fixes were applied
  fixes: AppliedFix[]; // list of fixes that were applied
  errors: Issue[];     // remaining errors after fixing
}
```

## CLI

### Scan files for issues

```bash
bolognese scan src
bolognese scan src --json
bolognese scan src --compact
bolognese scan . --ext ts,tsx
bolognese scan src --no-warnings
bolognese scan src --max-errors 10
```

### Automatically fix issues

```bash
bolognese fix src
bolognese fix src --dry-run
bolognese fix src --json
```

### Check a code string directly

```bash
bolognese check "const x = 1"
bolognese check "const x = 1" --json
bolognese check "const x: string = 1" --ts
```

## Detected Issues

| Rule ID | Type | Severity | Fixable |
|---------|------|----------|---------|
| `syntax/parse-error` | SyntaxError, MissingBracket, etc. | error | no |
| `syntax/unclosed-brackets` | MissingBracket | error | no |
| `syntax/unclosed-string` | UnclosedString | error | yes |
| `structural/unused-variables` | UnusedVariable | warning | no |
| `structural/duplicate-declarations` | DuplicateDeclaration | error | no |
| `structural/unsafe-patterns` | UnsafePattern | warning | partial |
| `formatting/semicolons` | SemicolonIssue | warning | yes |
| `formatting/indentation` | IndentationIssue | warning | yes |
| `formatting/trailing-whitespace` | WhitespaceIssue | info | yes |
| `formatting/import-order` | ImportOrderIssue | info | yes |

## CI Integration

Bolognese exits with code `1` when errors are found, making it suitable for CI pipelines:

```yaml
- run: bolognese scan src --no-warnings
```

## License

MIT
