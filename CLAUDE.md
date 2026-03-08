# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name:** zenn-contents
**jrnl Project Tag:** zenn-contents

Zenn の記事・本を管理するリポジトリ。

- `articles/` — 記事の Markdown ファイル
- `books/` — 本のディレクトリ

## Commands

```bash
npx zenn preview              # ローカルプレビュー (http://localhost:8000)
npx zenn new:article          # 新規記事作成
npx zenn new:book             # 新規本作成
```

## References

詳細は以下を参照。

- Frontmatter・Emoji選択: `docs/article-frontmatter.md`
- 日本語文体ルール・textlint: `docs/writing-rules.md`

## Writing Rules（常時適用）

- 本文は「ですます」調、見出し・箇条書きは「である」調
- 文末は「。」で終える（「：」禁止）
- レベル3見出し（###）はユーザーの許可なく使わない
- 太字（`**`）を見出し代わりに使わない
- 同じ助詞を一文で繰り返さない

## Linting

- **Pre-commit hook** で textlint が自動実行される
- Claude Code から textlint を手動実行しない（ユーザーが明示的に求めた場合のみ）
- textlint の抑制コメントの追加はユーザーの許可が必要（Hooks でもブロック）
- `--no-verify` でのスキップは禁止（Hooks でもブロック）

## Git Operations

- **Main branch**: `main`（PR 必須、直接 push 禁止。Hooks でもブロック）
- **Branch naming**: `article/<slug>`（記事）、`docs/<topic>`（ドキュメント）
- PR 作成前に `published: true` を確認する

## Commit Message Prefixes

| Prefix | Usage |
|--------|-------|
| `content:` | 記事・本の追加・更新 (`articles/`, `books/`) |
| `chore:` | 設定、CI、依存関係 |
| `docs:` | ドキュメント (`README.md`, `CLAUDE.md`) |

## Requirements

- Node.js >= 22.0.0 (managed via mise.toml)
