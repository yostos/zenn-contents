---
title: "DALL-E 3 が消える日に備えて移行した"
emoji: "🤖"
type: "tech"
topics: ["OpenAI", "GenerativeAI", "ClaudeCode"]
published: true
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/04/dalle3-to-gpt-image-mini/) からの転載です。
:::

## はじめに

OpenAIから以下のメールが届きました。

> As part of our continuous upgrade process, we are deprecating the following models on May 12, 2026:
>
> - Dall-e-2
> - Dall-e-3
>
> Ahead of the shutdown timeline, we encourage you to explore gpt-image-1.5 or gpt-image-1-mini, our latest flagship models.

DALL-E 3は、OpenAIが2023年にリリースしたテキストをもとに画像を生成するAIモデルです。プロンプトを与えるだけで高品質な画像を生成でき、API経由でプログラムへ組み込めるため、画像生成の自動化に広く使われてきました。

筆者のブログでは、記事のカバー画像をDALL-E 3 APIで生成しています。Claude Codeのスキル（`/article-cover`）からシェルスクリプトを呼び出し、記事の内容に合った画像を自動生成してカバーに使う仕組みです。2026年5月12日にDALL-E 3が廃止されると、この仕組みが動かなくなります。廃止まで約1ヶ月しかないので、早速対応しました。

## 移行先の選定

メールで案内された後継モデルはgpt-image-1.5（高品質・高コスト）とgpt-image-1-mini（コスト効率重視）の2つです。他のサービスも検討しましたが、まだOpenAIにチャージが残っているので、画像生成については、当面OpenAIを使い続けることとしました。ブログのカバー画像は記事の雰囲気を伝えるためのもので、写真レベルの精度は求めていません。コストと品質のバランスから **gpt-image-1-mini** を選びました。

ただし、DALL-E 3との間にいくつかの仕様差があります。最も大きな変化はサポートされる画像サイズです。

| DALL-E 3          | gpt-image-1-mini     |
| ----------------- | -------------------- |
| 1792x1024（16:9） | **1536x1024（3:2）** |
| 1024x1792         | 1024x1536            |
| 1024x1024         | 1024x1024            |

これまで使っていた画角16:9の画像は新モデルでは非対応です。
最も近い横長サイズは1536x1024で、アスペクト比が16:9から3:2に変わります。16:9はモニターや動画で標準的な比率ですが、3:2はフィルムカメラ（35mm）由来の伝統的な比率です。筆者のブログではCSSの `object-fit` でカバー画像を表示しているため表示上の問題はありませんが、ちょっと間が抜けた感じになります。

品質パラメータも名前が変わりました。DALL-E 3の `standard` / `hd` に対して、gpt-image-1-miniでは `low` / `medium` / `high` の3段階です。従来の `hd` に相当するのは `high` になります。

課金モデルも異なります。DALL-E 3は「1枚いくら」のシンプルな定額課金でしたが、新モデルはトークンベースの課金に変わっています。画像は内部的にトークンに変換され、入力（プロンプト）と出力（生成画像）のトークン数に応じて課金されます。実際の1枚あたりの費用を比較すると以下のとおりです（横長サイズ）。

| Quality | DALL-E 3（1792x1024） | gpt-image-1-mini（1536x1024） |
| ------- | --------------------- | ----------------------------- |
| Low     | --                    | $0.006                        |
| Medium  | $0.120                | $0.015                        |
| High    | $0.120                | **$0.052**                    |

High品質で比較すると、**1枚あたり $0.120 → $0.052 で約57%のコスト削減**になります。Medium品質なら $0.015で87%削減です。参考までに、上位モデルgpt-image-1.5のHighは1536x1024で約 $0.250と、DALL-E 3の2倍以上です。
ブログのカバー画像用途ではgpt-image-1-miniで十分だと割切りました。

## スクリプトの改修

筆者のブログでは、カバー画像の生成に以下のシェルスクリプトを使っています。
プロンプトと出力先を引数で受け取り、OpenAIの画像生成APIを呼び出して画像を保存するシンプルなスクリプトです。
DALL-E 3を使っていたものを、gpt-image-1-miniを使うよう修正しました。

```bash:scripts/generate-cover.sh
#!/bin/bash
set -euo pipefail

SIZE="1536x1024"
QUALITY="high"
MODEL="gpt-image-1-mini"

# ... 引数パース省略 ...

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

# gpt-image-1-mini returns b64_json; fall back to URL for other models
B64=$(echo "$RESPONSE" | jq -r '.data[0].b64_json // empty')
URL=$(echo "$RESPONSE" | jq -r '.data[0].url // empty')

if [ -n "$B64" ]; then
  echo "$B64" | base64 -d > "$OUTPUT"
elif [ -n "$URL" ]; then
  curl -s "$URL" -o "$OUTPUT"
fi
```

移行にあたって変更したのは以下の点です。

まず、モデル名・サイズ・品質の3パラメータを変更しました。

```diff:scripts/generate-cover.sh
-SIZE="1792x1024"
-QUALITY="hd"
-MODEL="dall-e-3"
+SIZE="1536x1024"
+QUALITY="high"
+MODEL="gpt-image-1-mini"
```

APIエンドポイント（`/v1/images/generations`）とリクエスト形式は同じなので、パラメータの変更だけで済むと思っていましたが、もう1点変更が必要でした。

DALL-E 3はレスポンスで画像のURLを返していましたが、gpt-image-1-miniは**base64エンコードされた画像データ**を直接返します。そのため、レスポンス処理をURLダウンロードからbase64デコードへ変更しました。`b64_json` と `url` の両方へ対応したので、将来モデルを切り替えてもこの部分は変更不要です。

## まとめ

DALL-E 3の廃止に伴い、筆者のブログのカバー画像生成をgpt-image-1-miniに移行しました。

- サイズが16:9（1792x1024）から3:2（1536x1024）に変わった
- 課金モデルが定額からトークンベースに変わった
- 費用はHigh品質で約57%削減
- レスポンス形式がURLからbase64に変わった
- スクリプトの変更は最小限

元記事のカバー画像もgpt-image-1-miniで生成しています。実のところ微妙です。

- DALL-E 3と比べると間の抜けた絵になっている
- 画角が3:2も間延びして微妙

しばらく様子を見て、満足できなければgpt-image-1に差し替えるかも知れません。
また、画角についても、変形かクロップで16:9に変更することも考えるかもしれません。

OpenAIのモデル廃止は突然来るものなので、同様にDALL-E 3を使っているプロジェクトがあれば、5月12日までに移行しておくことをおすすめします。
