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

## Requirements

- Node.js >= 22.0.0 (managed via mise.toml)
