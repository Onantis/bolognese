# bolognese

Syntax validation and automated code resolution for JavaScript and TypeScript.

Bolognese came from frustration with tools that were either too noisy or too focused on style. The goal here is simpler: detect when code is broken, explain why, and fix what can be fixed automatically. It is designed to work in small personal projects and larger environments like CI pipelines, editor integrations, build systems, and automated workflows.

## Install

```bash
npm install bolognese
```

## API

### analyze(code, options?)

Parses source code and returns every issue found, grouped by severity. Does not modify the source.

```js
import { analyze } from "bolognese";

const result = analyze(`
function test( {
  console.log("Hello")
}
`);

// result.success → false when any errors were found
// result.errors  → array of hard failures (syntax, duplicates, etc.)
// result.warnings → non-fatal issues (unused vars, unsafe patterns)
// result.infos   → style-level hints (trailing whitespace, import order)
// result.fixed   → always false from analyze(), use fix() to apply changes
// result.parseTime → how long the analysis took in milliseconds

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

You can pass a file path in options to get it included in results and to help the parser decide whether to treat the source as TypeScript:

```js
const result = analyze(source, { filePath: "src/app.ts" });

// result.filePath → "src/app.ts"
```

You can also cap the number of errors returned, useful when scanning large files:

```js
const result = analyze(source, { maxErrors: 10 });
```

### fix(code, options?)

Applies automatic fixes where available and returns the updated source along with a description of every change made. Errors that cannot be fixed automatically are returned as-is so you can still act on them.

```js
import { fix } from "bolognese";

const result = fix(sourceCode);

// result.code  → the updated source after all fixes were applied
// result.fixed → true if at least one fix was applied
// result.fixes → array of { type, description } for each change made
// result.errors → issues that could not be fixed automatically

console.log(result.fixes);
// [
//   { type: "WhitespaceIssue", description: "Removed trailing whitespace" },
//   { type: "ImportOrderIssue", description: "Sorted import statements alphabetically" }
// ]

// write the result back to disk yourself, bolognese does not touch the filesystem from the API
fs.writeFileSync("src/app.js", result.code, "utf-8");
```

### configure(options)

Sets global options that apply to all subsequent `analyze` and `fix` calls. Useful when you want a consistent configuration across many files without passing options on every call.

```js
import { configure } from "bolognese";

configure({
  // toggle individual rules on or off
  rules: {
    unusedVariables: true,
    duplicateDeclarations: true,
    unsafePatterns: true,
    semicolons: true,
    importOrder: false,  // disable import sorting
    whitespace: true,
    indentation: true,
  },

  // stop collecting errors after this many (does not affect warnings or infos)
  maxErrors: 50,
});
```

Call `configure` once at startup. Settings persist until you call it again.

## CLI

The CLI mirrors the API and is meant for use in scripts, editors, and CI pipelines.

### scan

Scans one or more paths for issues and prints a report.

```bash
# scan a directory recursively
bolognese scan src

# scan multiple paths
bolognese scan src lib tests

# JSON output — useful for parsing results in scripts or CI
bolognese scan src --json

# compact single-line output — one issue per line
bolognese scan src --compact

# only report errors, skip warnings and info
bolognese scan src --no-warnings --no-info

# stop after the first 20 errors
bolognese scan src --max-errors 20

# control which file extensions are included
bolognese scan src --ext ts,tsx
```

The `scan` command exits with code 1 when any errors are found. This makes it usable as a CI gate:

```yaml
# GitHub Actions example
- name: Check for syntax errors
  run: bolognese scan src --no-warnings
```

### fix

Applies automatic fixes to files in place.

```bash
# fix a directory
bolognese fix src

# preview what would change without writing anything
bolognese fix src --dry-run

# fix and output a JSON report of what changed
bolognese fix src --json

# only fix specific extensions
bolognese fix src --ext js,ts
```

### check

Analyzes a code string directly, without reading from the filesystem. Handy for quick checks or piping from other tools.

```bash
bolognese check "const x = 1"

# treat the input as TypeScript
bolognese check "const x: number = 1" --ts

# machine-readable output
bolognese check "const x = 1" --json
```

## Rules

Bolognese ships with ten rules across three categories. All are enabled by default.

### Syntax

These run first. If the code cannot be parsed, structural and formatting rules may not have enough information to run accurately.

| Rule ID | What it catches | Fixable |
|---------|-----------------|---------|
| `syntax/parse-error` | General parse failures, invalid tokens, bad imports, invalid declarations | no |
| `syntax/unclosed-brackets` | Unmatched `(`, `[`, or `{` with the exact location of the opening | no |
| `syntax/unclosed-string` | Unterminated single or double-quoted string literals | yes |

### Structural

These check the code's structure and semantics after it parses successfully.

| Rule ID | What it catches | Fixable |
|---------|-----------------|---------|
| `structural/unused-variables` | `let` and `const` declarations that are never read | no |
| `structural/duplicate-declarations` | `let` or `const` names re-declared in the same scope | no |
| `structural/unsafe-patterns` | Use of `eval()` and loose equality `==` instead of `===` | partial |

### Formatting

These check style consistency. All of them are auto-fixable.

| Rule ID | What it catches | Fixable |
|---------|-----------------|---------|
| `formatting/semicolons` | Statements that appear to be missing a trailing semicolon | yes |
| `formatting/indentation` | Lines that use tabs in a file that otherwise uses spaces, or vice versa | yes |
| `formatting/trailing-whitespace` | Trailing whitespace at the end of lines | yes |
| `formatting/import-order` | Import statements that are not sorted alphabetically, or that appear after non-import code | yes |

## Output format

Every issue has the same shape regardless of which rule produced it:

```ts
{
  type: string;      // e.g. "SyntaxError", "UnusedVariable", "MissingBracket"
  message: string;   // human-readable description
  line: number;      // 1-indexed line number
  column: number;    // 1-indexed column number
  severity: "error" | "warning" | "info";
  fixable: boolean;  // whether fix() can resolve this automatically
  ruleId?: string;   // the rule that produced it, e.g. "syntax/unclosed-brackets"
}
```

## License

MIT
