---
title: "Zolaブログにsatori + sharpでOGP画像の自動生成を組み込む"
emoji: "🖼️"
type: "tech"
topics: ["zola", "ogp", "satori", "sharp", "nodejs"]
published: true
---

## はじめに

Rust製の静的サイトジェネレーター[Zola](https://www.getzola.org/)と[tabi](https://github.com/welpo/tabi)テーマで運用しているブログに、Zennの記事のように記事タイトルが入ったOGP画像を自動生成する仕組みを導入しました。OGP画像が未設定だと、SNSで記事を共有してもデフォルト画像が表示され、どの記事なのか判別できません。記事ごとにタイトル入りの画像を自動生成することで、この問題を解消しました。

![対応前：すべての記事で同じデフォルト画像](/images/zola-ogp-auto-generation/before.webp)
*対応前：どの記事を共有しても同じ画像*

![対応後：記事タイトル入りのOGP画像](/images/zola-ogp-auto-generation/after.webp)
*対応後：記事ごとにタイトル入りの画像が表示される*

この記事では、Zola環境でタイトル入りOGP画像を自動生成するにあたっての設計判断と、[satori](https://github.com/vercel/satori) + [@resvg/resvg-js](https://github.com/thx/resvg-js) + [sharp](https://sharp.pixelplumbing.com/)による実装の技術的な詳細を解説します。同様の課題を抱えるZolaユーザーの参考になれば幸いです。

## Zolaの画像処理の制約

Zolaの組み込み画像処理は [`resize_image()`](https://www.getzola.org/documentation/content/image-processing/) 関数のみです。リサイズ、クロップ、フォーマット変換は可能ですが、テキストの描画機能はありません。OGP画像のように「記事タイトルを画像に合成する」用途には対応できません。

tabiなどのテーマ側にはOGP画像の「参照」機構があります。tabiの `social_media_images.html` テンプレートは、frontmatterの `[extra] social_media_card` で指定された画像パスから `og:image` 等のメタタグを出力します。ただし画像ファイルの生成は行わないため、ファイルは別途用意する必要があります。

つまり、Zola + tabiの構成では「画像を生成する仕組み」だけが欠けている状態です。

## 生成方式の選定

ZolaブログでOGP画像を自動生成するアプローチは、大きく3つあります。

| 方式 | ツール例 | 長所 | 短所 | 判定 |
|------|----------|------|------|------|
| スクリーンショット | [shot-scraper](https://shot-scraper.datasette.io/) | ページの見た目をそのままOGPにできる | ブラウザとZolaサーバーの起動が必要 | x 運用が煩雑 |
| サーバーレス動的生成 | Cloudflare Functions | ビルド不要、リクエスト時に生成 | 外部サービスへの依存、ランニングコスト | x コスト |
| ビルド時生成 | [satori](https://github.com/vercel/satori) + [sharp](https://sharp.pixelplumbing.com/) | 高速、ビルドに組み込める | Node.js依存 | **◎ 採用** |

スクリーンショット方式はtabiテーマの作者（welpo氏）が[自身のブログで採用](https://osc.garden/blog/automating-social-media-cards-zola/)しています。shot-scraperでブラウザを起動し、OGP用テンプレートページのスクリーンショットを撮影するアプローチです。ページのレンダリング結果がそのままOGP画像になるため、デザインの一貫性は高いです。ただし、ヘッドレスブラウザの起動とZola開発サーバーの起動がビルドの前提となり、CIパイプラインが複雑になります。

サーバーレス方式はCloudflare FunctionsやVercel Edge Functionsでリクエスト時にOGP画像を動的生成するアプローチです。ビルドプロセスは不要になりますが、外部サービスへの依存が発生します。個人ブログ規模であれば無料枠に収まることが多いものの、サービスの仕様変更やAPI廃止のリスクは残ります。

今回はビルド時生成を採用しました。Node.jsへの依存は増えますが、`npm run ogp` の1コマンドで完結し、CIパイプラインもシンプルに保てます。生成済みの画像をGitにコミットするため、ホスティング側に特別な要件も発生しません。

## 背景画像の選択戦略

OGP画像のデザイン方式にも判断が必要です。

- Zenn.devのように固定フレーム画像にタイトルを合成する方式
- 各記事のカバー画像にタイトルを合成する方式

固定フレーム方式はすべての記事で統一感が出ますが、記事ごとの個性は薄くなります。カバー画像方式は記事の内容が視覚的に伝わる反面、画像のない記事には対応できません。

今回はハイブリッド方式を採りました。記事ディレクトリにOGP背景として十分なサイズ（1200x630以上）の画像があればそれを使い、なければサイト共通のデフォルト画像を使います。

背景候補の選択には「ファイルサイズが最大の画像」というヒューリスティクスを用いています。一般にファイルサイズが大きい画像ほど高解像度で、記事のメイン画像である可能性が高いためです。出力済みの `ogp.webp` 自体は候補から除外します。

```javascript
// 記事ディレクトリ内の画像から背景候補を選択
const images = await getImageFiles(articleDir); // ogp.webpを除外
const largest = await getLargestImage(images); // 最大ファイルサイズ
const usable = largest && (await meetsMinSize(largest)); // 1200x630以上か
const background = usable ? largest : DEFAULT_BG_IMAGE;
```

この方式により、画像の有無を人が判断する必要はなく、スクリプトが自動で振り分けます。

## 技術スタックと画像生成パイプライン

採用した技術スタックは以下の3つです。それぞれの役割が明確に分かれています。動作確認時のバージョンはsatori `0.19.1`、@resvg/resvg-js `2.6.2`、sharp `0.34.5`です。

| ライブラリ | 役割 | ライセンス |
|-----------|------|-----------|
| [satori](https://github.com/vercel/satori)（Vercel製） | JSX風オブジェクトからSVGを生成 | MPL-2.0 |
| [@resvg/resvg-js](https://github.com/thx/resvg-js) | SVGをPNGにラスタライズ | MPL-2.0 |
| [sharp](https://sharp.pixelplumbing.com/) | 背景リサイズ、オーバーレイ合成、WebP出力 | Apache-2.0 |

satoriを選んだ理由は、Vercel/Next.jsのOG Image生成と同じコア技術であり、実績が十分なことです。Reactは不要で、純粋なJavaScriptオブジェクトでテンプレートを定義できます。日本語フォントにも対応しており、フォントデータをBufferとして渡すことで任意のフォントを使用可能です。

sharpは背景画像のリサイズからオーバーレイの合成、WebP出力までを1つのパイプラインで処理できます。satoriが出力するSVGは直接sharpに渡せないため、中間のラスタライズに@resvg/resvg-js（Rust製SVGレンダラのNode.jsバインディング）を挟んでいます。

パイプライン全体の流れは以下のとおりです。

```
satori(テンプレート) → SVG → @resvg/resvg-js → PNG（オーバーレイ）
                                                        ↓
sharp(背景画像) → resize(1200x630) → composite(オーバーレイ) → WebP出力
```

実装コードです。

```javascript
async function createOgpFromImage(imagePath, outputPath, title, fontData) {
  // 1. satoriでテンプレートからSVGを生成
  const template = createOverlayTemplate({
    title,
    author: DEFAULT_AUTHOR,
    blogName: BLOG_NAME,
  });
  const svg = await satori(template, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "My Font", // 使用するフォント名
        data: fontData, // フォントファイルのBuffer
        weight: 400,
        style: "normal",
      },
    ],
  });

  // 2. SVGをPNGにラスタライズ（オーバーレイ用）
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const overlayPng = resvg.render().asPng(); // Uint8Array

  // 3. 背景画像にオーバーレイを合成してWebP出力
  await sharp(imagePath)
    .resize(1200, 630, { fit: "cover", position: "center" })
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .webp({ quality: 85 })
    .toFile(outputPath);
}
```

`--dry-run` で生成対象の確認、`--force` で既存画像の上書きに対応しています。既に `ogp.webp` が存在する記事は通常スキップされるため、新規記事の分だけ差分生成される設計です。

## satoriテンプレートの設計

satoriのテンプレートは `React.createElement` 風のオブジェクト構造ですが、Reactへの依存はありません。レイアウトエンジンはflexboxベースであり、`display: grid` は使えない制約があります。`position` は `relative`、`absolute`、`static` に対応しています（デフォルトは `relative`）。ただし `position: absolute` は常にルート要素を基準に配置される既知の制限があり、ネストした要素での相対配置には注意が必要です。`display` のデフォルト値は `flex` です。

テンプレートの構造は、左上にブログ名、下部に半透明背景ボックス付きの記事タイトル、右下に著者名を配置するレイアウトです。

```javascript
export function createOverlayTemplate({ title, author, blogName }) {
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "40px",
      },
      children: [
        // ブログ名（左上）
        {
          type: "div",
          props: {
            style: { display: "flex", justifyContent: "flex-start" },
            children: {
              type: "span",
              props: {
                style: {
                  color: "white",
                  fontSize: "28px",
                  fontWeight: "bold",
                  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
                },
                children: blogName,
              },
            },
          },
        },
        // 下部コンテナ（タイトル + 著者名）
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: [
              // タイトル（半透明背景ボックス）
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    borderRadius: "12px",
                    padding: "24px 32px",
                    marginBottom: "20px",
                    maxWidth: "90%",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        color: "white",
                        fontSize: "42px",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      },
                      children: title,
                    },
                  },
                },
              },
              // 著者名（右寄せ）
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        color: "white",
                        fontSize: "24px",
                        opacity: 0.9,
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
                      },
                      children: author,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}
```

設計上のポイントは2つあります。

1つ目は視認性の確保です。背景画像の上にテキストを重ねるため、タイトル部分は半透明の黒背景ボックス（`rgba(0, 0, 0, 0.6)`）で囲み、ブログ名や著者名には `textShadow` を付与しています。

2つ目は日本語タイトルへの対応です。`wordBreak: 'break-word'` を指定することで、長い日本語タイトルが適切に折り返されます。`maxWidth: '90%'` でタイトルボックスの幅を制限し、右端に余白を確保しています。

## 日本語フォント対応

satoriはフォントデータをBufferとして直接受け取る設計です。Webフォントの自動読み込みのような機構はないため、フォントファイルを明示的に用意する必要があります。

```javascript
const FONTS_DIR = path.join(__dirname, "fonts");
const FONT_EXTENSIONS = [".ttf", ".otf"];

async function findFontFile() {
  const files = await fs.readdir(FONTS_DIR);
  const fontFile = files.find((f) =>
    FONT_EXTENSIONS.includes(path.extname(f).toLowerCase()),
  );
  if (!fontFile) {
    throw new Error(
      "フォントが見つかりません。scripts/fonts/ に .ttf または .otf を配置してください。",
    );
  }
  return path.join(FONTS_DIR, fontFile);
}
```

フォントファイルは `.gitignore` で除外し、各開発環境で個別に配置する運用にしています。筆者は有償の日本語フォントを使用しており、ライセンス上リポジトリに含められないという事情もあります。CI/CDに組み込まずローカルで手動実行する運用であれば、好みのフォントを自由に選べるのもこの方式の利点です。Noto Sans JPなどの無償フォント（SIL Open Font License）を使えばCI/CDへの組み込みも可能です。

:::message alert
有償フォントを使用する場合は、画像への埋め込みやWeb公開がライセンスの許諾範囲に含まれているか確認が必要です。
:::

スクリプト起動時に `scripts/fonts/` 内の `.ttf` / `.otf` を自動検出するため、フォントの差し替えもファイルを入れ替えるだけで対応できます。

注意点として、satoriに渡す `weight` 値と実際のフォントファイルを一致させる必要があります。Regular体のフォントに `weight: 700` を指定すると、satoriが太字をレンダリングしようとしてフォールバックが発生し、表示が崩れます。

## frontmatter一括更新

tabiテーマでOGP画像を認識させるには、各記事のfrontmatterに `social_media_card = "ogp.webp"` を追加する必要があります。既存記事への一括適用のために `add-ogp-frontmatter.mjs` を作成しました。

ZolaのfrontmatterはTOML形式で `+++` で囲まれています。処理ロジックは以下のとおりです。

- 既に `social_media_card` がある記事はスキップする
- `[extra]` セクションがある場合、その直後に `social_media_card = "ogp.webp"` を挿入する
- `[extra]` セクションがない場合、frontmatter終端の `+++` の前に `[extra]` セクションごと追加する

```javascript
if (content.includes("social_media_card")) {
  // スキップ
} else if (content.includes("[extra]")) {
  content = content.replace(
    /(\[extra\]\n)/,
    '$1social_media_card = "ogp.webp"\n',
  );
} else {
  content = content.replace(
    /(\n\+\+\+\n)/,
    '\n[extra]\nsocial_media_card = "ogp.webp"\n+++\n',
  );
}
```

このスクリプトも `--dry-run` に対応しており、変更対象を事前に確認できます。

## まとめ

Zolaには画像にテキストを描画する機能がないため、satori + @resvg/resvg-js + sharpを組み合わせてOGP画像を自動生成する仕組みを構築しました。

設計判断のポイントは以下の3つです。

- 生成方式としてビルド時生成を選択し、CIパイプラインのシンプルさを優先した
- 背景画像のハイブリッド方式により、画像の有無を問わず全記事に対応した
- satori + resvg-js + sharpの3段パイプラインにより、テンプレート定義から最終出力まで明確に責務を分離した

実装の全体像は[GitHubリポジトリの `scripts/` ディレクトリ](https://github.com/yostos/blog-yostos/tree/main/scripts)を参照してください。

:::message
導入の経緯や運用面の話は[ブログ記事](https://blog.yostos.org/blog/2026/02/ogp-image-generation/)に書いています。
:::

## 参考リンク

- [Zola Image Processing](https://www.getzola.org/documentation/content/image-processing/)
- [Automating social media cards for Zola（tabi作者のアプローチ）](https://osc.garden/blog/automating-social-media-cards-zola/)
- [Generating OGP cards with Cloudflare Functions（Cloudflare Functions方式）](https://127.io/2024/11/16/generating-opengraph-image-cards-for-my-zola-static-blog-with-cloudflare-functions-and-rust/)
- [satori - GitHub](https://github.com/vercel/satori)
- [sharp](https://sharp.pixelplumbing.com/)
- [@resvg/resvg-js - GitHub](https://github.com/thx/resvg-js)
