---
description: 記事の品質レビュー。frontmatter、文体、構成を確認する。
---

# Article Review

対象記事のパスを引数 `$ARGUMENTS` で受け取る。

## チェック項目

順番に確認し、問題があればまとめて報告する。

### 1. Frontmatter

- 必須フィールド（title, emoji, type, topics, published）がすべて存在するか
- `topics` が5つ以下か
- `emoji` が1文字の絵文字か
- `type` が "tech" または "idea" か
- 詳細は `docs/article-frontmatter.md` を参照

### 2. 文体

- 本文が「ですます」調か
- 見出し・箇条書きが「である」調か
- 文末が「。」で終わっているか（「：」で終わっていないか）
- 詳細は `docs/writing-rules.md` を参照

### 3. 構成

- レベル3見出し（###）が使われていないか
- 太字が見出し代わりに使われていないか
- 同じ助詞の繰り返しがないか

### 4. リンク

- `lychee` でリンク切れがないか確認
