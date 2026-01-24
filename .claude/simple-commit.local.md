# Simple Commit Local Rules

## Custom Prefixes for This Repository

This repository is for Zenn articles and books content. Use the following commit prefixes:

| Prefix | Usage |
|--------|-------|
| `content:` | Add or update articles/books (`articles/`, `books/`) |
| `chore:` | Config files, CI, dependencies (`.textlintrc`, `package.json`, `.github/`) |
| `docs:` | Documentation updates (`README.md`, `CLAUDE.md`) |

## Examples

```
content: Add article about Claude Code development
content: Update TTT article with textlint fixes
chore: Add textlint CI workflow
chore: Update textlint dependencies
docs: Add textlint usage to README
```

## Rules

- Use `content:` for any changes under `articles/` or `books/`
- Use `chore:` for tooling and configuration changes
- Use `docs:` only for repository documentation (README, CLAUDE.md)

## Pre-commit Checks

Before committing, run these checks:

1. **textlint** - Check Japanese writing style
   ```bash
   npm run lint
   ```

2. **lychee** - Check for broken links (if lychee is installed)
   ```bash
   lychee "articles/**/*.md" "books/**/*.md"
   ```

If errors are found, fix them before committing.
