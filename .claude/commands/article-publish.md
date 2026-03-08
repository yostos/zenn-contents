---
description: 記事の公開フロー。ブランチ作成からPR作成まで自動実行する。
---

# Article Publish

記事の公開ワークフローを実行する。

## Steps

順番に実行する。いずれかのステップが失敗したら停止して報告する。

### 1. ブランチ作成

- `git checkout main && git pull origin main`
- 記事のslugから `git checkout -b article/<slug>` でブランチを作成

### 2. 記事の確認

- frontmatterの `published: true` を確認
- `published` が `false` の場合はユーザーに確認する

### 3. コミット

- `/simple-commit:commit` スキルでコミットを作成

### 4. Push & PR作成

- `git push -u origin article/<slug>`
- `gh pr create --base main` でPRを作成
