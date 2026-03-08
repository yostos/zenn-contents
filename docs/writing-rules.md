# 日本語ライティングルール

## 文末表現

- 文末は必ず「。」で終える。「：」（コロン）で終えない
- リストやコードブロックの前でも「。」を使う

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

## 文体（ですます/である）

- 本文: 「ですます」調
- 見出し・箇条書き: 「である」調

## 見出しルール

- レベル3見出し（###）の使用禁止: 使用する場合は必ずユーザーの許可を得ること
- 太字を見出し代わりに使用禁止: `**見出し風テキスト**` のような疑似見出しは禁止
- セクションを細かく区切りすぎない。シンプルな構成を心がける

## その他

- 一つの文の中で同じ助詞（「が」「から」等）を繰り返さない

## Linting (textlint)

husky + lint-staged でコミット時にステージされた `.md` ファイルへ textlint が自動実行される。

```bash
# 記事・本のチェック
npm run lint

# 自動修正
npm run lint:fix

# 特定ファイルのチェック
npx textlint articles/filename.md

# 特定ファイルの修正
npx textlint --fix articles/filename.md
```

## リンクチェック (lychee)

```bash
lychee articles/filename.md
```

## 文体変換

```bash
# ですます調へ変換
npm run style:desumasu -- articles/filename.md

# である調へ変換
npm run style:dearu -- articles/filename.md
```

ファイルはin-placeで変更される。必要に応じてgitで戻すこと。
