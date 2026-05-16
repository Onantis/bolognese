# bolognese

Syntax validation and automated code resolution for JavaScript and TypeScript.

## Install

```bash
npm install bolognese
```

## Usage

```js
import { analyze, fix, configure } from "bolognese";

// analyze — detect issues without changing anything
const result = analyze(source);
// result.success   → boolean
// result.errors    → syntax/structural errors with line + column
// result.warnings  → non-fatal issues
// result.infos     → style-level hints

// fix — apply automatic fixes where possible
const { code, fixes, errors } = fix(source);
// code   → updated source
// fixes  → list of what was changed
// errors → anything that could not be fixed

// configure — set global options once
configure({
  rules: { unusedVariables: true, semicolons: false },
  maxErrors: 50,
});
```

## CLI

```bash
bolognese scan src             # report issues
bolognese scan src --json      # JSON output for CI (exits 1 on errors)
bolognese fix src              # apply fixes in place
bolognese fix src --dry-run    # preview without writing
```

## Rules

| Rule | Severity | Fixable |
|------|----------|---------|
| Syntax / parse errors | error | no |
| Unclosed brackets | error | no |
| Unclosed strings | error | yes |
| Unused variables | warning | no |
| Duplicate declarations | error | no |
| Unsafe patterns (`eval`, `==`) | warning | partial |
| Missing semicolons | warning | yes |
| Mixed indentation | warning | yes |
| Trailing whitespace | info | yes |
| Unsorted imports | info | yes |

## License

MIT
