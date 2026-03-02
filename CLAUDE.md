# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name:** zenn-contents
**jrnl Project Tag:** zenn-contents

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

### Heading rules (見出しルール)

- **レベル3見出し（###）の使用禁止**: 使用する場合は必ずユーザーの許可を得ること
- **太字を見出し代わりに使用禁止**: `**見出し風テキスト**` のような疑似見出しは禁止
- セクションを細かく区切りすぎない。シンプルな構成を心がける

### Other rules

- Do not repeat the same particle (助詞) like「が」or「から」in one sentence

## Linting (textlint)

**Pre-commit hook**: husky + lint-staged でコミット時にステージされた `.md` ファイルへ textlint が自動実行される。フックが失敗した場合はテキストを修正して対処すること。`--no-verify` でのスキップは禁止。

**Important: Claude Code から textlint を手動実行しないこと。** コミット時にフックで自動実行されるため、ユーザーが明示的に求めた場合のみ手動実行する。

**禁止: ユーザーの許可なく `<!-- textlint-disable -->` を追加してはならない。** textlintエラーが出た場合は、テキスト自体を修正して対処すること。既存の `textlint-disable` コメントを除去・変更する場合も同様にユーザーの許可が必要。

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

## Link Check (lychee)

Use `lychee` for checking broken links in articles.

```bash
# Check specific file
lychee articles/filename.md
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

## Git Operations

- **Main branch**: `main` (default branch, protected)
- **PR required**: Direct push to main is not allowed
- **Always create branch first**: Never work directly on main
- **Branch naming**: `article/<slug>` for new articles, `docs/<topic>` for docs
- **PR base**: Always use `main` as base branch
- **Auto-delete**: Branches are automatically deleted after merge
- **No develop branch**: Do not use develop branch
- **PR前の確認**: PR作成前に記事の `published: true` になっていることを必ず確認する

```bash
# Always start by creating a new branch
git checkout main && git pull origin main
git checkout -b article/<slug>

# After changes, create PR to main
gh pr create --base main
```

## Commit Message Prefixes

Use these prefixes for commit messages in this repository:

| Prefix | Usage |
|--------|-------|
| `content:` | Add or update articles/books (`articles/`, `books/`) |
| `chore:` | Config files, CI, dependencies |
| `docs:` | Documentation (`README.md`, `CLAUDE.md`) |

## Requirements

- Node.js >= 22.0.0 (managed via mise.toml)
