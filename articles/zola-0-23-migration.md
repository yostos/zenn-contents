---
title: "Zola 0.23への移行 — ショートコード廃止とコンポーネントへの一本化"
emoji: "🧩"
type: "tech"
topics: ["zola", "tera", "静的サイト", "tabi"]
published: true
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/09/zola-0-23-migration/) からの転載です。
:::

![Cover](/images/zola-0-23-migration/cover.webp)

筆者のブログ（[codedchords.dev](https://codedchords.dev/)）は、静的サイトジェネレーターのZolaと、そのテーマであるtabiで作っています。tabiに更新が来ていないか確認したところ、最新のv5.0.0はZola 0.23を必須にしていました。Zola 0.23は、作者自身が「おそらくZolaで最も破壊的なバージョン」と書くほど大きな変更を含んでいます。この記事では、Zola 0.23とtabi v5で何が変わったのかを整理し、今回のバージョンアップがユーザーにとってどういう意味を持つのかを考えます。

## Zola 0.23の変更点

Zola 0.23.0は2026年8月5日に公開されました。最大の変更は、テンプレートエンジンのTeraがv2に上がったことと、それに伴ってショートコードが廃止されたことです。

これまでのZolaでは、Markdownの本文に書けるのはショートコードだけで、テンプレート側の部品はマクロという別の仕組みで書いていました。0.23では本文そのものがTeraで処理されるようになり、ショートコードとマクロはTera 2の「コンポーネント」に一本化されました。同じコンポーネントを、テンプレートからも記事の本文からも呼び出せます。

記事の中での書き方は次のように変わります。

```text
# 旧: インライン
{{ youtube(id="dQw4w9WgXcQ", autoplay=true) }}
# 新: インライン
{{< youtube id="dQw4w9WgXcQ" autoplay={true} />}}

# 旧: 本文を持つブロック
{% quote(author="Vincent") %}
A quote
{% end %}
# 新: 本文を持つブロック
{% <quote author="Vincent"> %}
A quote
{% </quote> %}
```

`{{ }}`の中に`< />`を重ねた形は冗長に見えますが、それぞれに役割があります。`{{ }}`や`{% %}`はTeraに処理させる箇所の目印で、これがないとTeraは中身を見ません。`{{ }}`は従来どおり式の出力にも使うため、`< />`で「式ではなくコンポーネントの呼び出し」であることを区別しています。Teraの移行ガイドによると、この書き方はJinjaXから着想を得たJinja2とJSXの折衷です。引数もJSXと同じ考え方で、文字列以外の値は`{true}`のように波括弧で囲みます。

本文全体がテンプレートとして処理されるようになったことには、副作用もあります。記事の中にそのまま`{{ }}`や`{% %}`を書くと、コードブロックの中であってもTeraが解釈しようとしてエラーになります。GitHub Actionsの`${{ secrets.X }}`を載せた記事などは、`{% raw %}`と`{% endraw %}`で囲む必要があります。ファイル単位で処理を止める`skip_content_templating`という設定も追加されました。

ショートコードの廃止以外にも、0.23では多くの機能が追加されました。ブログの運用に関係しそうなものを挙げます。

- これまで`@/`で始まるリンクではMarkdownしか指せなかったが、画像ファイルも対象となった。これにより他の記事の画像を`@/`リンクで指定できる
- ページやセクションに`hidden`を指定すると、一覧から除外できる
- フロントマターの`include_in_feeds`で、個別の記事をRSSやAtomのフィードから外せる
- 読了時間の計算が言語ごとの読む速さを使うようになった
- `get_page`や`get_section`に、対象がなくてもエラーにしない`allow_missing`引数が付いた
- シンタックスハイライトの配色を定義するCSSは、これまでサイト直下の`static/`に生成され、ビルド時に出力先の`public/`へコピーされていた。0.23からは`public/`に直接生成され、`static/`には書き出されなくなった

## tabi v5の変更点

筆者のブログで使っているテーマtabiも、Zola 0.23に対応したv5.0.0を2026年9月13日にリリースしました。

v5.0.0では、テーマが提供していたショートコードがすべてコンポーネントに置き換わり、テンプレートの内部で使っていたマクロもなくなりました。記事から`admonition`や`references`などを呼び出す書き方も、Zola 0.23の構文に変わります。

```text
# 旧
{% admonition(type="warning", title="注意") %}
ここに警告メッセージを書きます。
{% end %}

{% references() %}
- [サイト名](URL). 「記事タイトル」
{% end %}

# 新
{% <admonition type="warning" title="注意"> %}
ここに警告メッセージを書きます。
{% </admonition> %}

{% <references> %}
- [サイト名](URL). 「記事タイトル」
{% </references> %}
```

あわせて、後方互換のためだけに残されていた設定が廃止されました。日付の書式も、`%Y-%m-%d`のようなstrftimeの形式ではなく、`y-MM-dd`のようなUnicodeの書式（UTS #35）で書く必要があります。こうした設定やテンプレートの書き換え方は、作者が[tabiのサイト](https://welpo.github.io/tabi/blog/upgrading-to-zola-0-23/)で移行ガイドとしてまとめています。

## 新しい形式でコンポーネントを作る

筆者のブログでは、出典付きの引用を`<blockquote>`で手書きしていました。記事ごとに出典の書き方がばらばらで、HTMLの中に書いたMarkdownのリンクがリンクにならず、文字のまま表示されている記事もありました。そこで、0.23の新しい形式で引用用のコンポーネントを作ってみました。

コンポーネントは`templates/components/`に置いたファイルで定義します。

```html:templates/components/blockquote.html
{% component blockquote(cite = "", source = "", author = "") %}
{%- set link_open = '<a href="' ~ (cite | escape_html) ~ '">' if cite else "" -%}
{%- set link_close = "</a>" if cite else "" -%}
<figure class="blockquote">
<blockquote{% if cite %} cite="{{ cite }}"{% endif %}>
{{ body | markdown | trim | safe }}
</blockquote>
{%- if source or author %}
<figcaption>—
{%- if author %} {% if not source %}{{ link_open | safe }}{% endif %}{{ author }}{% if not source %}{{ link_close | safe }}{% endif %}{% endif %}
{%- if author and source %}、{% elif source %} {% endif %}
{%- if source %}<cite>{{ link_open | safe }}{{ source }}{{ link_close | safe }}</cite>{% endif %}</figcaption>
{%- endif %}
</figure>
{% endcomponent blockquote %}
```

`component`の行で引数とそのデフォルト値を宣言し、ブロックの中に書いた本文は`body`という変数で受け取ります。本文は`markdown`フィルタで変換しているので、引用文の中にリンクやリストをMarkdownで書けます。呼び出す側での`import`は不要です。

記事からは次のように呼び出します。引数はすべて省略でき、出典は「— 著者、出典」の形で表示されます。`cite`を指定すると、`<blockquote>`の`cite`属性に入るとともに、出典名がそのURLへのリンクになります。

```text
{% <blockquote cite="https://www.mofa.go.jp/mofaj/fp/un/pageit_000001_03218.html" source="第81回国連総会における 高市早苗内閣総理大臣の一般討論演説"> %}
同時に、81年を経た国連憲章も、見直されなければなりません。
{% </blockquote> %}
```

出力されるHTMLは次のとおりです。

```html
<figure class="blockquote">
<blockquote cite="https://www.mofa.go.jp/mofaj/fp/un/pageit_000001_03218.html">
<p>同時に、81年を経た国連憲章も、見直されなければなりません。</p>
</blockquote>
<figcaption>— <cite><a href="https://www.mofa.go.jp/mofaj/fp/un/pageit_000001_03218.html">第81回国連総会における 高市早苗内閣総理大臣の一般討論演説</a></cite></figcaption>
</figure>
```

作るうえで注意が必要なのは、コンポーネントの出力がMarkdownの変換より前に本文へ埋め込まれることです。出力するHTMLの途中に空行があると、その後のインデントされた行がコードブロックとして扱われてしまいます。そのため、制御タグを`{%- ... %}`のように書いて、余計な改行を出さないようにしています。

## まとめ

Zola 0.23は、テーマやテンプレートを書く人にとっては大きな改善です。ショートコードとマクロに分かれていた部品がコンポーネントに一本化され、同じ部品をテンプレートと記事の両方から呼び出せるようになりました。引数に型を付けられるので、渡す値の誤りはビルド時にエラーとして見つかります。Tera 2ではオプショナルチェーンや三項演算子なども使えるようになり、エラーメッセージも呼び出し元までたどれる形になりました。

一方で、記事を書くだけの立場では、恩恵を感じる場面はあまりありません。呼び出しは`{{< name ... />}}`という長い書き方になり、本文全体がテンプレートとして処理されるため、コード例に`{{ }}`が出てくるたびに`raw`で囲む手間も増えました。記事から使える機能の追加や、サイトの言語を`ja`にすれば日本語の読む速さで読了時間を計算してくれる点はありがたいものの、既存の記事をすべて書き換える作業量に見合うほどではありません。

## References

- [getzola/zola](https://github.com/getzola/zola/blob/master/CHANGELOG.md). "CHANGELOG"
- [Keats/tera](https://github.com/Keats/tera/blob/master/MIGRATION.md). "v1 -> v2 migration guide"
- [welpo/tabi](https://github.com/welpo/tabi/blob/main/CHANGELOG.md). "CHANGELOG"
- [tabi](https://welpo.github.io/tabi/blog/upgrading-to-zola-0-23/). "Upgrade your tabi site to Zola 0.23"
