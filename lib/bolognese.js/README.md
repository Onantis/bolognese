# bolognese.js

Syntax validation and automated code resolution for JavaScript and TypeScript.

bolognese.js parses JS and TS source code, detects syntax and structural problems, and reports them with line and column numbers. For a subset of issues it can apply fixes automatically. It works from both the API and the command line.

## Install

```bash
npm install bolognese.js
```

## API

### analyze(code, options?)

Parses source code and returns all detected issues grouped by severity. The source is not modified.

```js
import { analyze } from "bolognese.js";

const result = analyze(`
function test( {
  console.log("Hello")
}
`);

// result.success   → false when any errors are present
// result.errors    → syntax and structural errors
// result.warnings  → non-fatal issues (unused vars, unsafe patterns)
// result.infos     → style-level observations (whitespace, import order)
// result.fixed     → always false from analyze(); use fix() to apply changes
// result.parseTime → time taken in milliseconds

console.log(result.errors[0]);
// {
//   type: "MissingBracket",
//   message: "'(' opened at line 2, col 15 was never closed (expected ')')",
//   line: 2,
//   column: 15,
//   severity: "error",
//   fixable: false,
//   ruleId: "syntax/unclosed-brackets"
// }
```

A file path can be passed in options. It is included in the result and used to determine whether the source is TypeScript:

```js
const result = analyze(source, { filePath: "src/app.ts" });

// result.filePath → "src/app.ts"
```

`maxErrors` limits the number of errors collected. Warnings and infos are not affected:

```js
const result = analyze(source, { maxErrors: 10 });
```

### fix(code, options?)

Applies automatic fixes where available and returns the updated source. Issues that cannot be fixed are included in the result unchanged.

```js
import { fix } from "bolognese.js";

const result = fix(sourceCode);

// result.code   → source after fixes were applied
// result.fixed  → true if at least one fix was applied
// result.fixes  → list of { type, description } for each change
// result.errors → issues that were not fixable

console.log(result.fixes);
// [
//   { type: "WhitespaceIssue", description: "Removed trailing whitespace" },
//   { type: "ImportOrderIssue", description: "Sorted import statements alphabetically" }
// ]

// the API does not write to disk; write result.code back yourself
fs.writeFileSync("src/app.js", result.code, "utf-8");
```

### configure(options)

Sets global options applied to all subsequent `analyze` and `fix` calls. Persists until called again.

```js
import { configure } from "bolognese.js";

configure({
  // enable or disable individual rules
  rules: {
    unusedVariables: true,
    duplicateDeclarations: true,
    unsafePatterns: true,
    semicolons: true,
    importOrder: false,  // disabled
    whitespace: true,
    indentation: true,
  },

  // cap on errors collected per call (does not affect warnings or infos)
  maxErrors: 50,
});
```

## CLI

### scan

Scans one or more paths recursively and prints a report. Exits with code 1 when errors are found.

```bash
bolognese scan src
bolognese scan src lib tests          # multiple paths
bolognese scan src --json             # JSON output
bolognese scan src --compact          # one line per issue
bolognese scan src --no-warnings --no-info
bolognese scan src --max-errors 20
bolognese scan src --ext ts,tsx       # filter by extension
```

CI usage:

```yaml
- name: Check for syntax errors
  run: bolognese scan src --no-warnings
```

### fix

Applies fixes to files in place.

```bash
bolognese fix src
bolognese fix src --dry-run           # report changes without writing
bolognese fix src --json              # JSON report of what changed
bolognese fix src --ext js,ts
```

### check

Analyzes a code string directly without reading from the filesystem.

```bash
bolognese check "const x = 1"
bolognese check "const x: number = 1" --ts    # treat as TypeScript
bolognese check "const x = 1" --json
```

## Rules

Ten rules across three categories. All are enabled by default.

### Syntax

Syntax rules run before structural and formatting rules. If the source cannot be parsed, subsequent rules may have incomplete information.

| Rule ID | What it catches | Fixable |
|---------|-----------------|---------|
| `syntax/parse-error` | Parse failures, invalid tokens, bad imports, invalid declarations | no |
| `syntax/unclosed-brackets` | Unmatched `(`, `[`, or `{`, reported at the opening location | no |
| `syntax/unclosed-string` | Unterminated single or double-quoted string literals | yes |

### Structural

Structural rules run after parsing succeeds.

| Rule ID | What it catches | Fixable |
|---------|-----------------|---------|
| `structural/unused-variables` | `let` and `const` declarations that are never read | no |
| `structural/duplicate-declarations` | `let` or `const` names re-declared in the same scope | no |
| `structural/unsafe-patterns` | `eval()` calls and loose equality `==` instead of `===` | partial |

### Formatting

Formatting rules check style consistency. All are auto-fixable.

| Rule ID | What it catches | Fixable |
|---------|-----------------|---------|
| `formatting/semicolons` | Statements missing a trailing semicolon | yes |
| `formatting/indentation` | Mixed tabs and spaces within a single file | yes |
| `formatting/trailing-whitespace` | Trailing whitespace at end of lines | yes |
| `formatting/import-order` | Imports not sorted alphabetically or appearing after non-import statements | yes |

## Output format

All issues share the same shape:

```ts
{
  type: string;      // e.g. "SyntaxError", "UnusedVariable", "MissingBracket"
  message: string;   // description of the issue
  line: number;      // 1-indexed
  column: number;    // 1-indexed
  severity: "error" | "warning" | "info";
  fixable: boolean;  // whether fix() can resolve this
  ruleId?: string;   // e.g. "syntax/unclosed-brackets"
}
```

## License

MIT
