---
title: "GPT-image-2.5 Flareへ移行 — 生成時間は118.7秒から25.4秒へ"
emoji: "🖼️"
type: "tech"
topics: ["OpenAI", "GenerativeAI", "画像生成", "API"]
published: true
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/09/gpt-image-2-5/) からの転載です。比較画像は掲載枚数を絞っています。
:::

![Cover](/images/gpt-image-2-5/cover.webp)

筆者のブログ（[codedchords.dev](https://codedchords.dev/)）では記事上部のカバー画像をOpenAIのGPT-image-2で生成していましたが、GPT-image-2.5が発表されたので早速移行してみました。

## GPT-image-2.5の概要

GPT-image-2.5は、性格の異なる2つのモデルとして公開されました。OpenAIはそれぞれを次のように位置づけています。

- `gpt-image-2.5-flare`は「日常的な用途で高品質な画像を生成するための、最も速いモデル」である
- `gpt-image-2.5-sunburst`は「画像の生成と編集における最も高性能なモデル」である

トークン単価はどちらのモデルもGPT-image-2と同じです。

品質指定の段が増えました。これまでは`low` / `medium` / `high`の3段階で、`high`が最上段でした。2.5ではその上に`xhigh`と`max`が加わり、`high`は最上段ではなくなっています。

試験的提供であった透過背景が今回正式な機能として提供されました。`background`に`transparent`を指定してPNGかWebPで受け取ると、背景を抜いた画像が返ります。文字の描画も大きく改善されましたが、正確な位置に置くのは依然として苦手です。

## gpt-image-2.5-flare vs gpt-image-2

移行の前後で何がどう変わるのかを、同じプロンプトで実際に生成して比べました。サイズは1536x864、品質はhighで、両モデルとも条件を揃えました。実際に使用したプロンプトは以下です。

:::details Prompt

```text
荒れた海の上で対峙するポセイドンとネプチューン。
左に立つポセイドンは青緑の海水をまとい、三叉の銛を振り上げている。
右のネプチューンは白い波頭を鎧のようにまとい、同じく三叉の銛を構える。
二人の間で海面が渦を巻き、波しぶきが高く上がる。
低い位置から見上げる構図、嵐の空、雲間から差す光。
油彩のような重い質感、青と灰色を基調に、波しぶきだけが白く輝く。
文字やロゴは写り込まない。
```

:::

生成時間は各モデル3回ずつ計測しています。サーバー側の混雑が一方に偏らないよう、GPT-image-2とFlareを1回ずつ交互に実行しました。ジョブを投入してから完了を確認するまでの秒数です。

| モデル              | 1回目 | 2回目 | 3回目 | 中央値 |
| ------------------- | ----: | ----: | ----: | -----: |
| gpt-image-2         | 129.1 | 118.7 | 117.6 |  118.7 |
| gpt-image-2.5-flare |  25.2 |  25.8 |  25.4 |   25.4 |

中央値で4.7倍の差です。3回の振れ幅はGPT-image-2が117.6秒から129.1秒、Flareが25.2秒から25.8秒に収まっていて、たまたま速い1回を引いたわけではありません。2分待つか25秒待つかは、記事を書きながら試行錯誤する場面ではかなり違います。

1回目に生成された2枚を並べます。掲載しているのは縮小したサムネイルです。3回分6枚の元データ（可逆WebP）は、以下にまとめて置いています。

- [ポセイドンとネプチューンの生成画像（可逆WebP）](https://e.pcloud.link/publink/show?code=kZ9Kq77ZJs6HQphSWUJPRcwIyyiRpJuQAqiy)

![gpt-image-2が1回目に生成したポセイドンとネプチューン](/images/gpt-image-2-5/poseidon-old.webp)
*1回目 / gpt-image-2*

![gpt-image-2.5-flareが1回目に生成したポセイドンとネプチューン](/images/gpt-image-2-5/poseidon-flare.webp)
*1回目 / gpt-image-2.5-flare*

総じてFlareのほうが主題をフォーカスし密度が高い構図になっています。コントラストが高く見やすい絵になっています。ただし、gpt-image-2のほうも悪くはなく、広大さと自然なコントラストでこちらが好きと言う方も多いでしょう。

速さは疑いようがなく、何度か引き直して選ぶ使い方であれば1回25秒で試せることの方が効いてきます。

ここまではすべて`high`での生成です。2.5で加わった`max`がどう違うのかを、同じプロンプトで1枚だけ試しました。

![gpt-image-2.5-flareがmax品質で生成したポセイドンとネプチューン](/images/gpt-image-2-5/poseidon-flare-max.webp)
*quality=max / gpt-image-2.5-flare*

所要時間は35.3秒でした。`high`の25秒台から4割ほど伸びています。

サムネではあまりわかりませんが、元のサイズで確認すると明らかに絵が油彩のような質感を再現しています。画像の題材やもっとフォトリアリスティックなトーンであればよりはっきりと質感は上がるかも知れません。この1枚の生成にかかったのは約0.13ドルになります。

## 画像生成に使用しているスクリプト

筆者のブログのカバー画像は`scripts/generate-cover.sh`という自前のシェルスクリプトで生成しています。プロンプトと出力先を渡すと、OpenAIに投げてAVIFに変換するところまでやります。全文は以下のとおりです。

:::details scripts/generate-cover.sh

```bash:scripts/generate-cover.sh
#!/bin/bash
set -euo pipefail

# Generate cover image using OpenAI gpt-image-2.5 Flare API
# Requires: OPENAI_API_KEY, curl, jq, avifenc
# Note: gpt-image-2.5 can return png, jpeg or webp, but we deliberately
# keep the default PNG. It is the only lossless option among them, and
# feeding a lossless intermediate to avifenc avoids stacking a second
# generation of lossy artifacts on top of the AVIF encode.
#
# AVIF is used for photographic and AI-generated cover images only.
# Diagrams, charts and screenshots must stay lossless WebP:
#   cwebp -lossless -z 9 -exact input.png -o output.webp

SIZE="1536x864"
QUALITY="high"
MODEL="gpt-image-2.5-flare"  # image_generation tool model
HOST_MODEL="gpt-4.1-mini"  # host model that drives the image tool
AVIF_QUALITY="60"

usage() {
  cat <<'USAGE'
Usage: generate-cover.sh -p <prompt> -o <output> [-s size] [-q quality] [-w avif_quality]

Options:
  -p  Image generation prompt (required)
  -o  Output file path, e.g. cover.avif (required)
  -s  Size: 1536x864, 2048x1152, 1024x1024, etc.
      Must be multiples of 16, aspect ratio within 3:1 to 1:3.
      (default: 1536x864 = 16:9)
  -q  Quality: low, medium, high, xhigh, or max (default: high)
      gpt-image-2.5 adds xhigh and max above high. They cost more per
      image, so covers stay at high unless asked otherwise.
  -w  AVIF encoder quality (0-100, default: 60)
      60 is roughly equivalent to the previous cwebp -q 80.

Examples:
  # 16:9 cover image (default)
  ./scripts/generate-cover.sh \
    -p "A futuristic cityscape" \
    -o content/blog/2026/05/my-article/cover.avif

  # Higher-quality AVIF encoding
  ./scripts/generate-cover.sh \
    -p "Abstract pattern" \
    -o output.avif -w 75
USAGE
  exit 1
}

while getopts "p:o:s:q:w:" opt; do
  case $opt in
    p) PROMPT="$OPTARG" ;;
    o) OUTPUT="$OPTARG" ;;
    s) SIZE="$OPTARG" ;;
    q) QUALITY="$OPTARG" ;;
    w) AVIF_QUALITY="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "${PROMPT:-}" ] || [ -z "${OUTPUT:-}" ]; then
  usage
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "Error: OPENAI_API_KEY is not set"
  exit 1
fi

echo "Generating image with $MODEL..."
echo "  Size: $SIZE"
echo "  Quality: $QUALITY"
echo "  AVIF quality: $AVIF_QUALITY"
echo "  Prompt: ${PROMPT:0:80}..."

RESP_FILE=$(mktemp -t cover-resp-XXXXXX)
TMP_PNG=$(mktemp -t cover-XXXXXX).png
trap 'rm -f "$RESP_FILE" "$TMP_PNG"' EXIT

# A high-quality render can still take a couple of minutes — longer than the
# ~60s idle timeout that closes a synchronous (or streamed) connection before
# the image is ready. Submit the job in background mode via the Responses API
# and poll for it, so every HTTP request is short-lived and never hits the
# timeout. The image_generation tool drives gpt-image-2.5 Flare; the host model just
# forwards the prompt verbatim.
echo "Submitting background job..."
SUBMIT=$(curl -s --max-time 60 https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "$(jq -n \
    --arg host "$HOST_MODEL" \
    --arg model "$MODEL" \
    --arg prompt "$PROMPT" \
    --arg size "$SIZE" \
    --arg quality "$QUALITY" \
    '{model: $host, background: true, store: true,
      instructions: "The user message is the exact image prompt. Call the image_generation tool once using that text verbatim as the prompt; do not paraphrase, summarize, translate, or add to it.",
      input: $prompt,
      tools: [{type: "image_generation", model: $model, size: $size, quality: $quality}],
      tool_choice: {type: "image_generation"}}')")

JOB_ID=$(echo "$SUBMIT" | jq -r '.id // empty')
if [ -z "$JOB_ID" ]; then
  echo "Error: $(echo "$SUBMIT" | jq -r '.error.message // "failed to submit job"')"
  exit 1
fi
echo "  Job: $JOB_ID"

echo "Polling for completion (high quality can take a few minutes)..."
STATUS=""
for _ in $(seq 1 120); do
  curl -s --max-time 30 "https://api.openai.com/v1/responses/$JOB_ID" \
    -H "Authorization: Bearer $OPENAI_API_KEY" > "$RESP_FILE"
  STATUS=$(jq -r '.status // "unknown"' "$RESP_FILE")
  case "$STATUS" in
    completed) break ;;
    failed|cancelled|incomplete)
      echo "Error: job $STATUS — $(jq -r '.error.message // .incomplete_details.reason // "no detail"' "$RESP_FILE")"
      exit 1 ;;
  esac
  sleep 5
done

if [ "$STATUS" != "completed" ]; then
  echo "Error: job did not complete (last status: $STATUS)"
  exit 1
fi

B64=$(jq -r '[.output[]? | select(.type=="image_generation_call") | .result][0] // empty' "$RESP_FILE")
if [ -z "$B64" ]; then
  echo "Error: no image in completed response"
  jq -r '.output[]? | select(.type=="message") | .content[]?.text // empty' "$RESP_FILE" | head -c 500
  echo
  exit 1
fi

echo "Decoding base64 image..."
printf '%s' "$B64" | base64 -d > "$TMP_PNG"

echo "Converting to AVIF (quality=$AVIF_QUALITY)..."
avifenc -q "$AVIF_QUALITY" -y 420 -s 6 --ignore-exif --ignore-xmp \
  "$TMP_PNG" "$OUTPUT" > /dev/null

echo "Saved: $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
```

:::

今回はパラメータや戻り値に変更はないので、モデル名の修正だけで移行できました。

```diff
-MODEL="gpt-image-2"        # image_generation tool model
+MODEL="gpt-image-2.5-flare"  # image_generation tool model
```

## まとめ

GPT-image-2からGPT-image-2.5 Flareへの移行は、スクリプトのモデル名を1行変えるだけで済みました。パラメータと戻り値は変わらず、トークン単価も据え置きです。

効果がはっきり出たのは速さでした。同じプロンプトと設定で、中央値118.7秒が25.4秒になっています。記事を書きながら何度か引き直す使い方では、この差がそのまま作業の速さになります。

画質は一長一短です。Flareは描写が濃く絵としての見栄えは上です。一方でgpt-image-2は色の指示に忠実で、構図も落ち着いています。速くなったからといって指示への忠実さまで上がったわけではありませんでした。

新しく加わった`max`は35.3秒、1枚あたり約0.13ドルでした。`high`よりも質感は上がりますから、高解像度でここぞという1枚では選ぶ価値があります。

## References

- OpenAI. [Image generation](https://developers.openai.com/api/docs/guides/image-generation)
- OpenAI. [Pricing](https://developers.openai.com/api/docs/pricing)
- OpenAI. [GPT-Image-2.5 Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare)
- OpenAI. [Changelog](https://developers.openai.com/api/docs/changelog)
