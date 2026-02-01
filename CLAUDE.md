# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Repository for managing Zenn articles and books content.

## Commands

```bash
# Local preview (http://localhost:8000)
npx zenn preview

# Preview on custom port
npx zenn preview --port 3000

# Create new article
npx zenn new:article

# Create new book
npx zenn new:book
```

## Article Frontmatter

```yaml
---
title: "Article Title"
emoji: "🎉"
type: "tech"  # "tech" or "idea"
topics: ["topic1", "topic2"]  # max 5 topics
published: true  # set false for drafts
published_at: 2025-01-01 09:00  # optional: schedule future publication
---
```

| Field | Description |
|-------|-------------|
| `title` | Article title (required) |
| `emoji` | Single emoji for visual identifier (required, see selection guide below) |
| `type` | "tech" for technical articles, "idea" for opinion/thoughts (required) |
| `topics` | Array of tags, max 5 (required) |
| `published` | Set `true` to publish, `false` for draft (required) |
| `published_at` | Optional datetime to schedule future publication |

## Emoji Selection Guide

Choose emoji based on the main topic of the article (priority order):

1. Title keyword → direct emoji match
2. Article content → associated emoji
3. Pick from category table below

| Category | Emoji |
|----------|-------|
| CLI/Terminal | ⌨️ 🖥️ ⚡ |
| Programming | 💻 👨‍💻 |
| Web | 🌐 🔗 |
| Database | 🗄️ 💾 |
| Security | 🔐 🔒 🛡️ |
| Performance | 🚀 ⚡ 🏎️ |
| Bug fix | 🐛 🔧 🩹 |
| Config/Setup | ⚙️ 🔧 🛠️ |
| Testing | ✅ 🧪 |
| AI/ML | 🤖 🧠 |
| Tutorial | 📝 📖 🎓 |

## Project Structure

- `articles/` - Markdown files for articles
- `books/` - Book directories (each book has its own directory)

## Japanese Writing Rules

When writing Japanese articles, follow these rules to pass textlint:

### Sentence endings

- Always end sentences with「。」, never with「：」(colon)
- Even before lists or code blocks, use「。」

**Bad:**
```markdown
以下の手順で実行します：

- 手順1
- 手順2
```

**Good:**
```markdown
以下の手順で実行します。

- 手順1
- 手順2
```

### Writing style (文体)

- Body text (本文): Use「ですます」調
- Headings and lists (見出し・箇条書き): Use「である」調

### Other rules

- Do not repeat the same particle (助詞) like「が」or「から」in one sentence

## Linting (textlint)

```bash
# Check articles and books
npm run lint

# Auto-fix fixable issues
npm run lint:fix

# Check specific file
npx textlint articles/filename.md

# Fix specific file
npx textlint --fix articles/filename.md
```

## Writing Style Conversion (文体変換)

Convert between「ですます調」and「である調」while preserving frontmatter and code blocks.

```bash
# Convert to ですます調 (polite form)
npm run style:desumasu -- articles/filename.md

# Convert to である調 (plain form)
npm run style:dearu -- articles/filename.md
```

Note: The file is modified in place. Use git to revert if needed.

## Commit Message Prefixes

Use these prefixes for commit messages in this repository:

| Prefix | Usage |
|--------|-------|
| `content:` | Add or update articles/books (`articles/`, `books/`) |
| `chore:` | Config files, CI, dependencies |
| `docs:` | Documentation (`README.md`, `CLAUDE.md`) |

## Requirements

- Node.js >= 22.0.0 (managed via mise.toml)
