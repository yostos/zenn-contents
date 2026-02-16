---
title: "日記を AI に読ませる MCP サーバーを作ったら、振り返りの質が上がった"
emoji: "🤖"
type: "tech"
topics: ["mcp", "claude", "typescript", "cli", "jrnl"]
published: true
published_at: 2026-02-02 08:29
---

## はじめに

「あのとき書いたアイデア、どこいったっけ」

ふと思いついたアイデアをコマンドラインジャーナルツール「[jrnl](https://jrnl.sh/)」[^1]に `@idea` タグで書き留めておく習慣があります。しかし、書いたことすら忘れて埋もれていくものも多いです。
[^1]: jrnlは、ターミナルから素早く日記を書けるPython製のツール。タグ付けや検索機能を備え、プレーンテキストで保存されるためバージョン管理とも相性が良い。

ある日、自作のMCPサーバー経由でClaudeに「過去半年の @ideaタグを検索して、今でも価値がありそうなものをピックアップして」と頼んでみました。すると、すっかり忘れていた着想が掘り起こされ、そのうちの1つはこうして記事になっています。

この記事では、jrnlをClaudeから読めるようにするMCPサーバー「jrnl-mcp」と、その活用法を紹介します。

## jrnl-mcp とは

jrnl-mcpは、jrnlのデータにClaudeがアクセスできるようにするMCP（Model Context Protocol）サーバーです。以下の機能を提供します。

| ツール名                    | 機能                                   |
| --------------------------- | -------------------------------------- |
| search_entries              | 日付、タグ、キーワードでエントリを検索 |
| list_tags                   | 全タグと使用回数を一覧表示             |
| get_statistics              | エントリ数や文字数などの統計情報を取得 |
| analyze_tag_cooccurrence    | タグの共起関係を分析                   |
| list_journals / set_journal | 複数ジャーナルの切り替え               |

すべて読み取り専用で、ジャーナルを変更する機能は意図的に実装していません。これは誤操作のリスクを避けるためと、個人データを扱う上での安全策です。

## コード解説

開発の詳細は[ブログ記事](https://codedchords.dev/blog/2025/07/first-mcp-server-development/)に書いたので、ここでは肝となる部分だけ抜粋します。

### ツール定義

MCPサーバーは、Claudeに対して「どんな機能を提供するか」をツール定義として宣言します。以下は `search_entries` ツールの定義例です。日付範囲やタグ、キーワードでの絞り込みなど、jrnlが持つ検索機能をそのままClaudeから呼び出せるようにしています。

```typescript:src/index.ts
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_entries",
      description: "Search and filter journal entries",
      inputSchema: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: 'Start date (e.g., "yesterday", "2024-01-01")',
          },
          to: { type: "string", description: "End date" },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags to filter by",
          },
          contains: { type: "string", description: "Text to search for" },
          limit: { type: "number", description: "Maximum number of entries" },
          starred: {
            type: "boolean",
            description: "Only show starred entries",
          },
          journal: {
            type: "string",
            description: "Journal name (uses current/default if not specified)",
          },
        },
      },
    },
    // ... 他のツール定義
  ],
}));
```

ポイントは各プロパティの `description` です。ここに具体例を書いておくと、Claudeがユーザーの曖昧な指示（「先月の日記を見せて」など）を適切な引数に変換してくれます。

### jrnl コマンドの実行

MCPサーバーの実装方法には、APIを直接呼び出す方法と、既存のCLIツールをラップする方法があります。jrnl-mcpでは後者を採用しました。jrnlは成熟したCLIツールで、すでに豊富な機能を持っているためです。

`JrnlExecutor` クラスは、jrnlコマンドの実行と出力の整形を担当します。

```typescript:src/executor.ts
export class JrnlExecutor {
  async execute(args: string[]): Promise<string> {
    const result = await executeJrnlCommand(args);
    if (!result.success) {
      throw new Error(`jrnl command failed: ${result.stderr}`);
    }
    return this.cleanJrnlOutput(result.stdout);
  }

  private cleanJrnlOutput(output: string): string {
    // 装飾的なボックス文字やサマリー行を除去
    const lines = output.split("\n");
    const cleanedLines = lines.filter((line) => {
      return (
        !line.match(/^[┏┓┗┛━ ]+$/) &&
        !line.match(/^\s*\d+ entries? found\s*$/) &&
        !line.match(/^\s*no entries? found\s*$/) &&
        line.trim() !== ""
      );
    });

    const cleanedOutput = cleanedLines.join("\n").trim();

    // JSON 部分のみを抽出
    if (cleanedOutput.includes("{") && cleanedOutput.includes("}")) {
      const jsonStart = cleanedOutput.indexOf("{");
      const jsonEnd = cleanedOutput.lastIndexOf("}") + 1;
      return cleanedOutput.substring(jsonStart, jsonEnd);
    }

    return cleanedOutput;
  }
}
```

`cleanJrnlOutput` メソッドがやや複雑になっているのは、jrnlの出力に装飾的な要素が含まれるためです。ターミナル向けの罫線（`┏━━┓` など）やサマリーメッセージ（`3 entries found`）を除去し、Claudeが処理しやすいJSON形式だけを抽出しています。

ソースコード全体は [GitHub リポジトリ](https://github.com/yostos/jrnl-mcp)を参照してください。

## セットアップ

### 前提条件

- Node.js 18以上
- jrnlがインストール済み（`pip install jrnl`）

### インストール

```bash
git clone https://github.com/yostos/jrnl-mcp
cd jrnl-mcp
npm install
npm run build
npm link
```

### Claude Desktop の設定

`~/Library/Application Support/Claude/claude_desktop_config.json` に以下を追加します。

```json:claude_desktop_config.json
{
  "mcpServers": {
    "jrnl": {
      "command": "jrnl-mcp"
    }
  }
}
```

Claude Desktopを再起動すれば、jrnlツールが使えるようになります。

## 活用例：自分では気づけない行動パターンの発見

年末にふと、ギターに関する自分の行動を振り返ってみようと思いました。

```
2026年を迎えるにあたって、ギターについての過去の私の行動をjrnlから分析して。
傾向と改善点があれば教えて。
```

```
@guitarタグを分析しました。

【傾向】
- デジタル機材を買っては「やっぱりアナログ」と乗り換える繰り返し
- 同じ機能（SAG再現等）を追い求めて重複購入
- 「増えすぎた」と反省→売却→翌月また購入のサイクル
- 新機材到着時は創作意欲が爆発するが、その後途切れる

【提言】
- 歪みペダルは十分。2026年は買わない
- 購入前に既存機材で1週間試すルールを設ける
- 月1回のレコーディング日を決めて機材購入と創作を切り離す
```

個々のエントリを書いた時点では、それぞれに理由がありました。しかしClaudeが時系列で並べて分析すると、「買う→反省→また買う」というサイクルが見えてきます。エントリの中に「TR-Sを思い出す」と書いているように、重複には薄々気づいていたのに行動を変えられていませんでした。

jrnl-mcpの価値は、こうした「書いた本人が忘れている文脈」をAIが掘り起こしてくれる点にあります。日々の断片的なメモが、振り返りの素材として機能し始めます。

## 活用例：労務問題の整理

仕事上の問題を整理する際にも役立ちました。

```
仕事のジャーナル(@work)から、提言と組織の対応を時系列で整理して。
客観的な事実だけを抽出しアドバイスを提示してください。
```

```
@workタグを分析しました。

【問題→あなたの提言→結果のパターン】

- 機密情報取扱いに取引先とのNDAがない
   -> 顧問弁護士への相談とNDA案をドラフトして提示
     -> 「持ち帰り」のまま4ヶ月放置
-  取引先からのデータ連携の要件が提示されない
   -> 要件定義案を作成して提示
     ->  取引先との確認もうやむやに放置
- システム化の方針が定まらない
   -> 課題を整理して検討会議を設定
     -> 「予算だけ積んでおく」で終了

問題を特定し、具体的な解決策まで作成して提言しても、結果は常に
「持ち帰り」「結論出ず」「何もやらない」。このパターンが繰り返されています。

【分析】
組織として提言を受け止め、検討し、意思決定する機能が失われている
可能性があります。個別の提言内容の問題ではなく、意思決定プロセス
自体が機能不全に陥っているように見えます。

【提言】
- 通常の提言ルートでは状況は変わらない
- 意思決定者に直接問題を提起しても、具体的な検討段階になると責任や作業が見えてきて、
  結局「検討します」で放置される繰り返し
- 内部から自浄的な改善は期待できません。スポンサーなど外部に対して問題を可視化する
  方が有効
```

感情的になりがちな場面で、ジャーナルの記録をClaudeに分析させることで、「個別の問題」ではなく「組織の構造的な問題」が見えてきました。次に取るべきアクションも明確になります。

## jrnl-mcpの今後の展望

現在のjrnl-mcpは読み取り専用ですが、いくつかの機能拡張を検討しています。

大量のエントリを扱う際のパフォーマンス改善として、キャッシング機能の追加を考えています。タグ一覧や統計情報など、頻繁に参照するデータをキャッシュすることで、レスポンスを高速化できます。

また、検索結果をMarkdown形式でエクスポートする機能も計画しています。特定の期間やタグのエントリをまとめてドキュメント化できれば、振り返りレポートの作成が容易になります。

## まとめ

jrnl-mcpを作ってから、ジャーナルの活用法が変わりました。書きっぱなしだった記録が、Claudeとの対話を通じて振り返りや分析の素材になります。

MCPサーバーの開発自体は、Claude Codeのサポートもあり半日程度で基本機能ができました。既存のCLIツールをラップするパターンなので、複雑な実装は不要でした。開発の詳細に興味がある方は、[ブログ記事](https://codedchords.dev/blog/2025/07/first-mcp-server-development/)を参照してください。

日常的に使っているCLIツールがあれば、MCPサーバー化を検討してみてください。思わぬ活用法が見つかるかもしれません。

ただし、エンジニアであればClaude Codeを使う機会も増えてきていると思います。その場合、MCPでCLIをラップするよりエージェント経由で直接実行する方が手軽です。Claude DesktopでもClaude Coworkerが普及すれば同様の使い方ができるようになるでしょう。とはいえ、Claude CoworkはまだMaxプランでしか使用できませんから、jrnl-mcpのようにツールの機能を整理して提供する形にはまだ価値があると考えています。

## 参考リンク

- [jrnl-mcp（GitHub）](https://github.com/yostos/jrnl-mcp)
- [jrnl 公式サイト](https://jrnl.sh/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [初めてのMCPサーバー開発 - jrnl-mcpを作ってみました（ブログ）](https://codedchords.dev/blog/2025/07/first-mcp-server-development/)
