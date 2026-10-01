---
title: "Cloudflare Web Analyticsで始めるCore Web Vitals改善"
emoji: "📊"
type: "tech"
topics: ["cloudflare", "performance", "zola", "web"]
published: true
---

:::message
この記事は [codedchords.dev の記事](https://codedchords.dev/blog/2026/03/zola-robust-image-shortcode/) をもとに加筆・再構成したものです。
:::

## Cloudflare Web Analytics

Cloudflare Pagesでサイトをホスティングしていると、Cloudflare Web Analyticsを追加設定なしで利用できます。Cloudflare PagesではJavaScriptビーコンがページに自動挿入されるため、スクリプトタグを手動で埋め込む必要がありません。Cookieを使わないプライバシーフレンドリーな設計で、無料プランでも利用可能です。

Cloudflare Web AnalyticsはRUM（Real User Monitoring）ベースの計測ツールです。Lighthouseのような合成モニタリングとは異なり、実際のユーザーが体験しているパフォーマンスをそのまま反映します。Cloudflareのダッシュボードからアクセス数に加えて、Core Web Vitalsの各指標も確認できます。

![Cloudflare Web Analytics画面](/images/zola-robust-image-shortcode/cls.webp)
_Cloudflare Web Analytics画面_

## Core Web Vitalsの見方

Core Web VitalsはGoogleが提唱するWebページのユーザー体験を測定する指標群です。以下の3つの指標で構成され、いずれもGoogleの検索ランキングに影響します。

- **LCP（Largest Contentful Paint）**：ページの主要コンテンツが表示されるまでの時間。2.5秒以下が良好
- **INP（Interaction to Next Paint）**：ユーザー操作から画面更新までの応答時間。200ミリ秒以下が良好
- **CLS（Cumulative Layout Shift）**：ページ読み込み中のレイアウトのずれ。0.1以下が良好

Cloudflare Web Analyticsのダッシュボードでは、各指標が「Good」「Needs Improvement」「Poor」の3段階で色分け表示されます。筆者のブログではLCPとINPは良好でしたが、CLSのスコアに問題がありました。

## CLSの改善

CLSはページの読み込み中にコンテンツが予期せずずれる現象を数値化した指標です。CLSが大きいと、ユーザーがリンクをクリックしようとした瞬間にコンテンツがずれて、意図しない要素をタップしてしまうといった問題が発生します。

CLSが悪化する代表的な原因は、画像などの要素にサイズ（`width`と`height`）が指定されていないことです。サイズが未指定の画像は、読み込まれるまでブラウザが表示領域を確保できません。画像の読み込みが完了した瞬間にページ全体がガクッとずれてしまい、ユーザーが読んでいた箇所を見失うことになります。

筆者のブログを調べてみると、ほぼすべての記事画像に`width`と`height`が設定されていませんでした。ブログは静的サイトジェネレーターのZolaで構築しており、記事はMarkdownで書いています。Markdownの画像記法では`width`や`height`を記述する手段がありません[^1]。

```markdown
![カバー画像](cover.jpg)
```

[^1]: ZolaはCommonMarkをベースとしたpulldown-cmarkというRustのライブラリを使用しているため画像にメタ情報を付与できませんが、Markdownの処理系によっては記述可能なものも存在します。

そこでZolaのショートコードを利用して、画像サイズなどのメタ情報を自動でセットする仕組みを作りました。以下はコードの抜粋です。

:::message
Zola 0.23でショートコードは廃止され、Tera Componentsへ移行しました。本記事のコードは0.22以前のZolaを前提としています。
:::

```html:templates/shortcodes/image.html
{%- set colocated_path = page.colocated_path | default(value="") -%}
{%- set resolved_path = colocated_path ~ src -%}
{%- set meta = get_image_metadata(path=resolved_path, allow_missing=true) -%}

{%- if meta -%}
    {#- Colocated path resolved successfully -#}
    {%- set image_url = get_url(path=resolved_path, cachebust=true) -%}
```

Zolaの`get_image_metadata`関数はビルド時に画像ファイルを読み取り、幅と高さを返してくれます。これを利用して`width`と`height`を`img`要素に指定しています。あわせて`get_url`関数の`cachebust=true`オプションでファイルのハッシュ値をURLに付与し、キャッシュバスティングにも対応しました。

あとはHTMLの`img`要素として画像サイズが出力されるように組み立てるだけです。

```html:templates/shortcodes/image.html
<img
  src="{{ image_url }}"
  alt="{{ alt_text }}"
  {%- if meta and meta.width %} width="{{ meta.width }}"{% endif %}
  {%- if meta and meta.height %} height="{{ meta.height }}"{% endif %}
  {%- if lazy_loading %} loading="lazy"{% endif %}
/>
```

この結果、記事には以下のように書くだけで、画像サイズとキャッシュバスティングに対応した`img`要素を自動出力できるようになりました。

```markdown
{{ image(src="cover.jpg", alt="カバー画像") }}
```

Zola依存にはなりますが、記述を複雑にせずCLS対策ができました。

## figure対応

記事内の画像にキャプションを付けたい場合もあります。そこで`caption`パラメータが指定された場合には、`img`要素を`figure`要素で囲み、`figcaption`要素でキャプションを出力するようにしました。`caption`を省略した場合は従来どおり`img`要素のみを出力します。

以下がショートコードの全容です。

<!-- textlint-disable -->
:::details imageショートコード
<!-- textlint-enable -->

```html:templates/shortcodes/image.html
{#- ============================================================
    image.html - Image shortcode for Zola

    Copyright (c) 2026 Toshiyuki Yoshida
    Released under the MIT License.
    https://opensource.org/licenses/MIT

     Repository: https://github.com/yostos/blog-yostos


    Renders an <img> tag with automatic path resolution,
    image metadata (width/height), cache busting, and lazy loading.

    Parameters:
      src          - Image path or remote URL (required)
      alt          - Alt text for accessibility (recommended)
      caption      - Caption text displayed below the image (optional)
                     When specified, wraps output in <figure>/<figcaption>
      lazy_loading - Enable lazy loading (default: true)
    ============================================================ -#}

{#- Strip leading "./" from src to normalize colocated paths
    e.g. "./photo.jpg" -> "photo.jpg" -#}
{%- set src = src | trim_start_matches(pat="./") -%}

{#- ---- URL resolution ---- -#}
{%- if src is starting_with("http") -%}
    {#- Remote image: use src as-is. Metadata cannot be retrieved
        for external URLs, so width/height will not be set. -#}
    {%- set image_url = src -%}

{%- else -%}
    {#- Local image: first try resolving relative to the page's
        colocated directory (e.g. content/blog/my-post/photo.jpg).
        This supports the co-location pattern where content and
        assets live in the same directory. -#}
    {%- set colocated_path = page.colocated_path | default(value="") -%}
    {%- set resolved_path = colocated_path ~ src -%}
    {%- set meta = get_image_metadata(path=resolved_path, allow_missing=true) -%}

    {%- if meta -%}
        {#- Colocated path resolved successfully -#}
        {%- set image_url = get_url(path=resolved_path, cachebust=true) -%}

    {%- else -%}
        {#- Fallback: treat src as an absolute path from the project root.
            This handles images placed under the static/ directory,
            e.g. src="/images/shared.jpg" -#}
        {%- set meta = get_image_metadata(path=src, allow_missing=true) -%}

        {%- if meta -%}
            {%- set image_url = get_url(path=src, cachebust=true) -%}
        {%- else -%}
            {#- Neither path worked. Output the URL anyway so the page
                does not break, but width/height will be omitted.
                This may indicate a missing or misspelled image path. -#}
            {%- set image_url = get_url(path=src, cachebust=true) -%}
        {%- endif -%}

    {%- endif -%}
{%- endif -%}

{#- ---- Attribute defaults ---- -#}

{#- Default alt to empty string so the attribute is always present.
    An explicit alt="" is valid for decorative images and is preferred
    over omitting the attribute entirely for accessibility. -#}
{%- set alt_text = alt | default(value="") -%}

{#- Lazy loading is enabled by default for better page performance -#}
{%- set lazy_loading = lazy_loading | default(value=true) -%}

{#- Caption: when specified, wrap in <figure>/<figcaption> -#}
{%- set caption_text = caption | default(value="") -%}

{#- ---- Output ---- -#}
{%- if caption_text -%}
<figure>
<img
  src="{{ image_url }}"
  alt="{{ alt_text }}"
  {%- if meta and meta.width %} width="{{ meta.width }}"{% endif %}
  {%- if meta and meta.height %} height="{{ meta.height }}"{% endif %}
  {%- if lazy_loading %} loading="lazy"{% endif %}
/>
<figcaption>{{ caption_text }}</figcaption>
</figure>
{%- else -%}
<img
  src="{{ image_url }}"
  alt="{{ alt_text }}"
  {%- if meta and meta.width %} width="{{ meta.width }}"{% endif %}
  {%- if meta and meta.height %} height="{{ meta.height }}"{% endif %}
  {%- if lazy_loading %} loading="lazy"{% endif %}
/>
{%- endif -%}
```

:::

## References

- Cloudflare. "[Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/)"
- web.dev.「[Cumulative Layout Shift(CLS)](https://web.dev/articles/cls)」
- web.dev.「[Core Web Vitals](https://web.dev/articles/vitals)」
- Zola. "[Overview - get_image_metadata](https://www.getzola.org/documentation/templates/overview/#get-image-metadata)"
