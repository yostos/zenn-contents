---
title: "ChatGPT Images 2.0と、ブログのカバー画像パイプライン更新"
emoji: "🎨"
type: "tech"
topics: ["OpenAI", "GenerativeAI", "ChatGPT", "ClaudeCode"]
published: true
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/05/chatgpt-images-2-0/) からの転載です。
:::

## TL;DR

OpenAIが2026年4月21日にリリースしたChatGPT Images 2.0(API名 `gpt-image-2`)は、画像生成に推論を組み込んだ新世代モデルです。筆者のブログのカバー画像生成パイプラインも、このタイミングで乗り換えました。

- テキスト描画の精度、ネイティブ2K解像度、3:1から1:3までの自由なアスペクト比などが揃った
- 料金面では筆者のブログがカバー画像に使っている1536x864/高品質で約34%安くなる
- `generate-cover.sh` を `gpt-image-2` に乗り換え、ついでに画角を16:9へ変更した
- `output_format=webp` を渡しても現状はPNGが返ってくるバグがあり、WebPへの変換は `cwebp` で行っている

## はじめに

OpenAIは2026年4月21日、新しい画像生成モデルChatGPT Images 2.0を発表しました。API名は `gpt-image-2` で、開発者向けには5月初旬から開放されています。私のブログではカバー画像の自動生成に旧モデル `gpt-image-1` を使っていたので、乗り換える価値があるかを調べた上で、今回のリリースに合わせて実際に移行しました。本稿では、新モデルで何が変わったか、料金へのインパクト、そして自分のブログでの乗り換え作業をまとめます。

## ChatGPT Images 2.0で何が変わったか

ChatGPT Images 2.0の特徴は、画像生成に「考えてから描く」という工程が入ったことです。プロンプトを受け取ったあとに構図やレイアウトを推論で組み立て、必要に応じて自己検証を挟んでから描画に進みます。OpenAI自身は「Agentic image generation」と表現しており、テキストから画像へのワンショット変換とは異なる挙動を示します。

実務面で効いてくる改良点を並べると次のようになります。

- テキスト描画の精度向上: 看板・図表・タイトルなど、画像内の文字を読める品質で出せるようになった。印刷物にも耐える水準とされる
- ネイティブ2K解像度: 2048x2048を素のままで生成でき、有料プランでは4Kまでのアップスケールが選べる。前世代の引き伸ばし感は減った
- 自由なアスペクト比: 3:1から1:3までの範囲で、16の倍数を満たす任意のサイズを指定できる。固定プリセットから連続パラメータへの転換
- マルチイメージのバッチ生成: `n=1〜8` でキャラクターやオブジェクトの一貫性を保ったまま、最大8枚を同時生成できる

なお「Thinking mode」と呼ばれる、Web検索を生成中に挟んで結果を補強する追加機能はChatGPT本体のPlus・Pro・Business・Enterpriseプランに限定されています。APIから素直に呼び出した場合に同等の挙動が得られるかは現時点で公開情報からは判然としません。日常的なカバー画像生成では恩恵が薄いため、本稿では深掘りしません。

合わせて、旧世代モデルのDALL·E 2およびDALL·E 3は2026年5月12日付で廃止されています。`gpt-image-1` 自体の廃止は告知されていませんが、明確に前世代の位置づけになりました。

## 料金面のインパクト

OpenAIの画像APIは、出力トークンに対する従量課金($30.00/100万トークン)を基準に、サイズと品質ごとに代表的な価格が公表されています。筆者のブログでは1536x1024/高品質を使っていたので、その線で比較します。

| 解像度 / 品質            | gpt-image-1 | gpt-image-2 | 差分     |
| :----------------------- | :---------- | :---------- | :------- |
| 1024x1024 / high         | $0.167      | $0.211      | +26%     |
| 1536x1024 / high(旧設定) | $0.25       | $0.165      | **-34%** |
| 1536x1024 / medium       | $0.063      | $0.041      | -35%     |
| 1536x1024 / low          | $0.016      | $0.005      | -69%     |

興味深いのは、`gpt-image-2` では1024x1024より1536x1024のほうが安いという逆転が起きている点です。`gpt-image-2` は連続的なサイズ指定とトークンベースの課金に振り切ったため、画素数と価格の関係が必ずしも単調ではなくなりました。これは料金表というよりトークン課金の写像として読むべきもので、サイズによる単純な大小比較は通用しなくなっています。

絶対額で見ると、記事1本あたり$0.085ほどの削減です。年に50本書いても$4程度なので、コスト最適化自体が主目的にはなりません。ただし「安くなって性能が上がる」方向の更新であり、乗り換えを見送る理由はありません。

## `output_format=webp` のバグ

実装中に確認したところ、`gpt-image-2` は `output_format=webp` を指定しても、実際にはPNGデータを返してきます。レスポンスJSONには `"output_format": "webp"` が含まれているものの、`b64_json` をデコードすると先頭が `89 50 4E 47 0D 0A 1A 0A` のPNGシグネチャになっています。

同一パラメータを `gpt-image-1` に渡した場合は正しくWebPが返るため、現時点では `gpt-image-2` 固有の不具合と判断しています。

そのため、本記事で示すスクリプトではAPIレスポンスをPNGとして受け取り、内部で `cwebp -q 80` によりWebPへ再エンコードしています。呼び出し側インターフェースは変更せず、最終的には1536x864のWebPファイルを取得できます。

OpenAI側で修正された場合は、`output_format=webp` をそのまま利用し、内部変換ステップを削除する想定です。

## ブログのパイプラインを乗り換える

筆者のブログではカバー画像を `scripts/generate-cover.sh` からOpenAI Image APIを叩いて生成しています。これまでは `gpt-image-1` から1536x1024のPNGを受け取り、`cwebp -q 80` でWebPに変換して `cover.webp` を作っていました。新モデルへの移行で、このパイプラインが得る恩恵は大きく2点あります。

- 画像精度の底上げ: テキスト描画・構図・解像度がモデルレベルで改善するため、カバー画像の見栄えが直接良くなる。`gpt-image-1` とのAPI互換性が高く、エンドポイント・認証・レスポンス形式(`b64_json`)はそのまま使えるため、これだけなら `MODEL` 変数を `gpt-image-2` に書き換えれば享受できる
- 画角の自由度: 画角16:9で指定できるようになった。`gpt-image-2` のサイズパラメータは「16の倍数」「総画素数65万〜829万」「縦横比3:1〜1:3」を満たす任意の値を受け付けるため、1536x864のような正確な16:9に直接出力できる。旧モデルのプリセット制約から3:2(1536x1024)に妥協していた筆者のブログでは、記事一覧の見栄えとX(旧Twitter)・はてなブックマークなどのSNSカードプレビューの収まりが、ようやく現代のプラットフォームと噛み合うようになった

リクエスト本体は次のようになりました。

```bash:scripts/generate-cover.sh
SIZE="1536x864"
MODEL="gpt-image-2"

RESPONSE=$(curl -s \
  https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "$(jq -n \
    --arg model "$MODEL" \
    --arg prompt "$PROMPT" \
    --arg size "$SIZE" \
    --arg quality "$QUALITY" \
    '{model: $model, prompt: $prompt, n: 1,
      size: $size, quality: $quality}')")
```

このスクリプトを呼び出している `article-cover` スキル(Claude Code用のカスタムコマンド)の全体は次のとおりです。記事の特定からフロントマター確認までを4ステップで定義しており、`gpt-image-2` への移行に際しての変更は不要でした。

````markdown:.claude/commands/article-cover.md
---
description: Generate a cover image for an article using OpenAI gpt-image-2 API. Read article content, craft a prompt, generate 1536x864 (16:9) WebP image.
---

# Article Cover Image Generation

Generate a cover image (cover.webp) for an article using OpenAI gpt-image-2 API.

## Steps

### 1. Identify Target Article

Ask the user which article to generate a cover image for.
Read the article content to understand the theme and key topics.

### 2. Craft Image Prompt

Based on the article content:

- Identify the core theme and visual concepts
- Craft a gpt-image-2 prompt that captures the article's essence
- Show the prompt to the user for approval before generating

### 3. Generate Image

Run `./scripts/generate-cover.sh`:

```
./scripts/generate-cover.sh \
  -p "<approved prompt>" \
  -o content/blog/YYYY/MM/slug/cover.webp
```

The script defaults to 1536x864 (16:9), high quality, and WebP output.

### 4. Verify Frontmatter

Ensure the article frontmatter has:

```toml
[extra]
local_image = "cover.webp"
social_media_card = "ogp.webp"
```
````

## まとめ

ChatGPT Images 2.0は、価格が下がり、解像度とアスペクト比の選択肢が広がった、素直なアップグレードでした。`gpt-image-1` を呼んでいる既存コードであれば、`model` を差し替えるだけで動き始めます。

連続的なサイズ指定や推論を伴う構図設計といった点は、定型的なカバー画像生成だけでなく、SNS向け縦長フォーマットや図解付き画像など、これまで複数モデルを使い分けていた領域も `gpt-image-2` 1本に集約しうるポテンシャルを持ちます。エージェント型ワークフローからの呼び出しでも、複数枚の一貫した出力をシングルリクエストで得られる点が効いてきそうです。

しばらくこのパイプラインを運用してみて、生成品質や絵柄の傾向で気になる点、あるいは `output_format=webp` まわりの挙動に変化があれば、別途取り上げます。

## References

- OpenAI. [Introducing ChatGPT Images 2.0](https://openai.com/index/introducing-chatgpt-images-2-0/)
- OpenAI API Docs. [GPT Image 1 Model](https://developers.openai.com/api/docs/models/gpt-image-1) (価格比較用)
- OpenAI. [OpenAI API Pricing](https://openai.com/api/pricing/)
- TechCrunch. [ChatGPT's new Images 2.0 model is surprisingly good at generating text](https://techcrunch.com/2026/04/21/chatgpts-new-images-2-0-model-is-surprisingly-good-at-generating-text/)
- The New Stack. [With the launch of ChatGPT Images 2.0, OpenAI now 'thinks' before it draws](https://thenewstack.io/chatgpt-images-20-openai/)
