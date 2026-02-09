# zenn-contents

[Zenn](https://zenn.dev/) への投稿記事・書籍の原稿を管理するリポジトリです。

AI支援に[Claude Code](https://claude.ai/code)を使用しています（設定は`CLAUDE.md`を参照）。

## 必要な環境

- Node.js >= 22.0.0（[mise](https://mise.jdx.dev/) で管理）
- [lychee](https://github.com/lycheeverse/lychee)（リンクチェック用、任意）

## セットアップ

```bash
npm install
```

## コマンド

```bash
# ローカルプレビュー (http://localhost:8000)
npx zenn preview

# 新規記事作成
npx zenn new:article

# 新規本作成
npx zenn new:book
```

## 文章校正 (textlint)

```bash
# チェックのみ
npm run lint

# 自動修正
npm run lint:fix
```

### 直接実行

```bash
# 特定ファイルをチェック
npx textlint articles/ファイル名.md

# 特定ファイルを自動修正
npx textlint --fix articles/ファイル名.md
```

## 文体変換

```bash
# ですます調に変換
npm run style:desumasu -- articles/ファイル名.md

# である調に変換
npm run style:dearu -- articles/ファイル名.md
```

## リンクチェック (lychee)

```bash
# インストール (Homebrew)
brew install lychee

# 全ファイルをチェック
lychee "articles/**/*.md" "books/**/*.md"

# 特定ファイルをチェック
lychee articles/ファイル名.md
```

## プロジェクト構成

- `articles/` - 記事のMarkdownファイル
- `books/` - 本のディレクトリ（本ごとにディレクトリを作成）
- `images/` - 記事で使用する画像
- `scripts/` - ユーティリティスクリプト
- `.textlintrc` - textlint設定ファイル
- `lychee.toml` - lychee設定ファイル

## ライセンス

- `articles/` 内の記事: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- `books/` 内の書籍: All Rights Reserved
- その他のコード・設定ファイル: [ISC License](./LICENSE)
