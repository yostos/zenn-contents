# zenn-contents

Zenn への投稿記事の原稿

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
- `.textlintrc` - textlint設定ファイル
- `lychee.toml` - lychee設定ファイル
