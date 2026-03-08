# Article Frontmatter リファレンス

## 基本フォーマット

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

## フィールド詳細

| Field | Description |
|-------|-------------|
| `title` | 記事タイトル（必須） |
| `emoji` | 記事のアイコンとなる絵文字1つ（必須、下記選択ガイド参照） |
| `type` | "tech"（技術記事）or "idea"（アイデア・意見）（必須） |
| `topics` | タグの配列、最大5つ（必須） |
| `published` | `true` で公開、`false` で下書き（必須） |
| `published_at` | 公開予約日時（任意） |

## Emoji 選択ガイド

記事のメイントピックに基づいて選択する（優先順位順）。

1. タイトルのキーワード → 直接対応する絵文字
2. 記事の内容 → 関連する絵文字
3. 以下のカテゴリ表から選択

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
