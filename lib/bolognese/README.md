# bolognese

Syntax validation and automated code resolution for JavaScript and TypeScript.

Bolognese parses JS and TS source code, detects syntax and structural problems, and reports them with exact line and column numbers. For a subset of issues it can also apply fixes automatically.

## Install

```bash
npm install bolognese
```

## API

### analyze(code)

Returns detected issues without modifying the source.

```js
import { analyze } from "bolognese";

const result = analyze(`
function test( {
  console.log("Hello")
}
`);

console.log(result);
```

Result shape:

```json
{
  "success": false,
  "errors": [
    {
      "type": "MissingBracket",
      "message": "'(' opened at line 2, col 15 was never closed (expected ')')",
      "line": 2,
      "column": 15,
      "severity": "error",
      "fixable": false
    }
  ],
  "warnings": [],
  "infos": [],
  "fixed": false
}
```

### fix(code)

Applies automatic fixes where available and returns the updated source.

```js
import { fix } from "bolognese";

const output = fix(sourceCode);

console.log(output.code);   // updated source
console.log(output.fixes);  // list of what was changed
console.log(output.errors); // any errors that could not be fixed
```

### configure(options)

Sets global options that apply to all subsequent `analyze` and `fix` calls.

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

## CLI

```bash
# scan a directory for issues
bolognese scan src

# scan and output as JSON (useful for CI)
bolognese scan src --json

# apply automatic fixes
bolognese fix src

# preview fixes without writing to disk
bolognese fix src --dry-run

# check a code snippet directly
bolognese check "const x = 1"
```

The `scan` command exits with code 1 when errors are found, so it works as a CI gate.

## Rules

| Rule | What it checks | Severity | Auto-fixable |
|------|----------------|----------|--------------|
| `syntax/parse-error` | Parse failures, invalid tokens, bad imports | error | no |
| `syntax/unclosed-brackets` | Unmatched `(`, `[`, `{` | error | no |
| `syntax/unclosed-string` | Unterminated string literals | error | yes |
| `structural/unused-variables` | Variables declared but never read | warning | no |
| `structural/duplicate-declarations` | `let`/`const` redeclared in same scope | error | no |
| `structural/unsafe-patterns` | `eval()`, loose equality `==` | warning | partial |
| `formatting/semicolons` | Missing semicolons | warning | yes |
| `formatting/indentation` | Mixed tabs and spaces | warning | yes |
| `formatting/trailing-whitespace` | Trailing whitespace on lines | info | yes |
| `formatting/import-order` | Imports not sorted alphabetically | info | yes |

## License

MIT
