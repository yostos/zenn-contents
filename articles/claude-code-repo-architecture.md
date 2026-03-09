---
title: "CLAUDE.mdを太らせない — リポジトリ設計で実現するClaude Codeのガードレールと再現性"
emoji: "🏗️"
type: "tech"
topics: ["ClaudeCode", "GenerativeAI"]
published: true
published_at: 2026-03-10 08:30
---

:::message
この記事は[筆者のブログ](https://yostos.org/blog/2026/03/claude-code-repo-architecture/)からの転載です。
:::

## CLAUDE.mdが肥大化していませんか

Claude Codeを使い込むほど、CLAUDE.mdは育っていきます。ショートコードの構文リファレンス、コミットの手順、画像生成のコマンド、レビューのチェックリスト。気がつけば400行を超え、重要なルールが大量の参考情報に埋もれている――そんな状態になっていないでしょうか。

CLAUDE.mdはセッション開始時に毎回読み込まれるコンテキストです。ここに情報を詰め込みすぎると、本当に守ってほしいルールの優先度が下がります。かといって削りすぎれば、Claudeは暗黙知を推測で補おうとして事故を起こします。

筆者のブログ（Zola静的サイト）の運用で、CLAUDE.mdを458行から117行へ削減しながら、むしろルール遵守の精度と作業の再現性を向上させた設計パターンを紹介します。

## 4層アーキテクチャという考え方

この整理は、Shraddha Bharuka氏が提唱する「The Anatomy of a Claude Code Project」の考え方をベースにしています。

@[tweet](https://x.com/BharukaShraddha/status/2029836408232497678)

氏の整理ではRepo Memory / Reusable Expert Modes / Guardrails / Progressive Contextという4層が示されています。本記事ではClaude CodeのAuto Memory機能との混同を避けるため、一部の用語を変更しています。

リポジトリに散らばるClaude Code関連のファイルを、責務で4つの層に分離します。

| 層                   | 場所                              | 役割                     | 読み込みタイミング   |
| -------------------- | --------------------------------- | ------------------------ | -------------------- |
| Project Instructions | `./CLAUDE.md`                     | WHY・WHAT・HOW の要約    | 毎セッション（常時） |
| Workflows            | `./.claude/commands/`             | 再利用可能なワークフロー | コマンド呼び出し時   |
| Guardrails           | `./.claude/settings.json` (Hooks) | 機械的な禁止ルール       | ツール実行の前後     |
| Progressive Context  | `./docs/`                         | 詳細リファレンス         | 必要に応じて         |

それぞれの層には明確な設計原則があります。

## CLAUDE.md — Project Instructions

Claude Codeにはもうひとつ、Auto Memoryという記憶の仕組みがあります。これはClaude自身がセッション中に学んだこと――ビルドコマンドの癖、デバッグで得た知見、ユーザーの好み――を `~/.claude/projects/<project>/memory/` に自動で書き残す機能です。CLAUDE.mdが「ユーザーからClaudeへの指示」であるのに対し、Auto Memoryは「Claudeが自分で蓄積する学習ノート」です。両者はセッション開始時に読み込まれますが、役割が異なります。この記事で扱う4層アーキテクチャは、ユーザーが意図的に設計する情報配置のパターンです。Auto Memoryはその外側で自動的に機能する補完的な仕組みとして捉えてください。

CLAUDE.mdには3つの情報だけを書きます。

- **目的（WHY）** — このリポジトリが何であるか。Zolaブログであること、tabiテーマを使っていること。新しいセッションのClaudeがプロジェクトを理解するための最小限の情報である
- **マップ（WHAT）** — 記事のfrontmatterフォーマット、タグの命名規則への参照、ショートコードドキュメントへの参照。詳細はdocsに委ね、CLAUDE.mdには「どこを見ればよいか」だけを書く
- **ルール（HOW）** — 文体はですます調、descriptionは句点で終える、textlint-disableの使い方。Claudeが記事を書くときに常に意識すべき制約である

実際のCLAUDE.mdから、ショートコードのセクションを例に挙げます。以前は13個のショートコードそれぞれに構文、パラメータ一覧、使用例を書いていました。250行です。整理後は「ショートコードはtextlint-disableで囲む」というルールと、詳細ドキュメントへの参照だけになりました。個別の構文はClaude自身が必要なときに `docs/` 配下のショートコード定義書を読みに行けばよいのです。

## Commands — Workflows

`.claude/commands/` に配置したMarkdownファイルは、`/コマンド名` で呼び出せるワークフロー定義です。セッションをまたいでも同じ手順が実行されるため、作業品質の一貫性が生まれます。

筆者のブログでは6つのコマンドを定義しています。

| コマンド           | 用途                                                              |
| ------------------ | ----------------------------------------------------------------- |
| `/article-review`  | 記事の品質レビュー（frontmatter、文体、アセット確認）             |
| `/article-publish` | 記事の公開（レビュー → OGP再生成 → ビルド検証 → コミット → push） |
| `/article-cover`   | カバー画像生成（記事内容からDALL-E 3でcover.webpを生成）          |
| `/blog-review`     | ブログ設定のコードレビュー                                        |
| `/blog-refactor`   | 設定リファクタリングの手順ガイド                                  |
| `/blog-release`    | ブランチ運用のリリースフロー（CHANGELOG → PR → マージ → タグ）    |

記事系（article-）とブログ基盤系（blog-）で命名体系を分けています。これは運用フローが根本的に異なるためです。記事はmainに直接push、ブログ設定はブランチを切ってPR経由でマージします。

`/article-publish` の定義から、要点を抜粋して見てみましょう。

```markdown:.claude/commands/article-publish.md
---
description: Publish an article. Run review, regenerate OGP,
  verify build, commit, and push to main automatically.
---

# Article Publish

Execute the full publish workflow automatically.
Prerequisite: the user has already confirmed the article
via `zola serve` preview.

## Steps

Execute in order. Stop and report if any step fails.

### 1. Run /article-review
Execute the full article quality review.
If issues are found, stop and fix them before continuing.

### 2. Regenerate OGP Image
- Delete the existing OGP image
- Run `npm run ogp` to regenerate

### 3. zola check
Run `zola check` to verify no broken links or build errors.

### 4. Stage & Commit
- `git add .` to stage all changes
- Use `/simple-commit:commit` skill to create the commit

### 5. Push
Run `git push origin main` to publish.
```

このコマンドが実行する手順は、以前はCLAUDE.mdに散在するルールの組み合わせで「わかっているはず」と暗黙に期待していたものです。コマンドとして明示することで、どのセッションでも同じ品質で公開作業が完了します。

## Hooks — Guardrails

Hooksは `.claude/settings.json` に定義する、ツール実行の前後に自動で走るチェックです。CLAUDE.mdに「〜するな」と書いても、Claudeは忘れることがあります。Hooksは忘れません。

筆者のブログで設定しているガードレールです。

| タイミング  | 対象                          | 動作                                                             |
| ----------- | ----------------------------- | ---------------------------------------------------------------- |
| PreToolUse  | `git add <個別ファイル>`      | ブロック。`git add .` のみ許可                                   |
| PreToolUse  | `themes/` への Write/Edit     | ブロック。サブモジュール保護                                     |
| PostToolUse | content/\*.md への Write/Edit | Markdown画像記法 `![]()` を検出し、imageショートコード使用を指示 |

`git add <個別ファイル>` のブロックを例に、実装を見てみましょう。

```json:.claude/settings.json（抜粋）
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | grep -qE '^git add ' | grep -qvE '^git add \\.$' && echo '{\"decision\":\"block\",\"reason\":\"個別ファイルの git add は禁止です。git add . を使ってください\"}' || true"
          }
        ]
      }
    ]
  }
}
```

Hooksの設計方針は「禁止ルールはHooksに、正のガイダンスはCLAUDE.mdに」です。「〜するな」はHooksで機械的にブロックし、「〜の代わりにこうする」はCLAUDE.mdやCommandsで伝えます。

この分離によってCLAUDE.mdから禁止文を削除できました。前向きなガイダンスだけが残り、読みやすいドキュメントになっています。

## docs/ — Progressive Context

`docs/` にはCLAUDE.mdに収まらない詳細情報を配置します。Claudeは必要に応じてこれらのファイルを読みに行きます。

| ファイル                         | 内容                           |
| -------------------------------- | ------------------------------ |
| `docs/tabi-shortcodes.md`        | ショートコード構文リファレンス |
| `docs/tag-rule.md`               | タグ命名規則                   |
| `docs/TODO.md`                   | 作業計画・意思決定の記録       |
| `docs/architectural-decision.md` | アーキテクチャ判断の記録       |

この層の設計原則は「CLAUDE.mdに場所を教え、詳細はdocsに置く」です。CLAUDE.mdのショートコードセクションには `See docs/tabi-shortcodes.md` と一行書くだけで、Claudeはショートコードを使うときにそのファイルを読みに行きます。

毎セッションで250行のショートコードリファレンスをコンテキストに読み込む必要はありません。必要なときに必要な分だけ読む。これがProgressive Contextの考え方です。

## 責務分離の判断基準

新しいルールや手順を追加するとき、どの層に置くかの判断基準をまとめます。

| 条件                               | 配置先    |
| ---------------------------------- | --------- |
| 毎セッションで必ず意識すべきルール | CLAUDE.md |
| 複数ステップのワークフロー         | Commands  |
| 「〜するな」という禁止ルール       | Hooks     |
| 必要なときだけ参照する詳細情報     | docs/     |

迷ったときは「これをCLAUDE.mdから消したら、Claudeは間違えるか？」と自問してみてください。答えがNoなら、それはCLAUDE.mdに置くべき情報ではありません。

## まとめ

CLAUDE.mdへ全部書く運用から、4層に分離する運用へ変えた結果を振り返ります。

CLAUDE.mdは458行から117行になりました。削減した341行が消えたのではなく、適切な層へ移動しただけです。ショートコードのリファレンスは`docs/`へ、公開フローはCommandsへ、禁止ルールはHooksへ。それぞれの情報が、もっとも効果的に機能する場所へ収まりました。

コンテキストが長いほど個々のルールへの注意が分散し、遵守率が下がります。CLAUDE.mdが短ければ、書いたルールが確実に守られます。ワークフローがCommandsに定義されていれば、セッション間で品質がブレません。Hooksが禁止ルールを機械的に強制すれば、「AIが忘れる」問題は起きません。

この4層アーキテクチャは、ブログに限らずあらゆるClaude Codeプロジェクトへ適用できるパターンです。CLAUDE.mdが長くなってきたら、責務の分離を検討してみてください。

## 参考

- [Shraddha Bharuka (@BharukaShraddha)](https://x.com/BharukaShraddha/status/2029836408232497678) — "The Anatomy of a Claude Code Project"
- [Claude Code Overview](https://docs.anthropic.com/en/docs/claude-code/overview) — Anthropic
- [Memory](https://docs.anthropic.com/en/docs/claude-code/memory) — Anthropic
- [Best practices](https://docs.anthropic.com/en/docs/claude-code/best-practices) — Anthropic
- [Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) — Anthropic
- [Skills](https://docs.anthropic.com/en/docs/claude-code/skills) — Anthropic
