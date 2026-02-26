---
title: "ZolaブログにPagefindで日本語全文検索を導入する"
emoji: "🔍"
type: "tech"
topics: ["zola", "pagefind", "検索", "静的サイト"]
published: true
---

## はじめに（Zolaの検索事情）

静的サイトジェネレーターZolaには検索機能が組み込まれています。検索エンジンには[elasticlunr.js](http://elasticlunr.com/)が使われていますが、日本語のトークナイズに対応していません。elasticlunr自体が長期間更新されておらず、将来の対応も期待できない状況です。

そこで、日本語対応の検索エンジンを別途導入することにしました。

## 検索エンジンの選定

静的サイトで使える検索エンジンをいくつか比較検討しました。

| 候補 | 見送った理由 |
| --- | --- |
| Algolia | SaaS依存。無料枠に月10,000リクエスト制限。検索クエリが外部に送信される |
| Meilisearch | サーバーの常時稼働が必要で、静的サイトとは根本的に合わない |
| Fuse.js | 全インデックスをクライアントにダウンロードする設計。記事数の増加に弱い |
| Google PSE | 無料版は広告表示あり。サービス縮小傾向。プライバシーの懸念 |

最終的に選定したのは[Pagefind](https://pagefind.app/)です。

## Pagefindとは

[Pagefind](https://pagefind.app/)はCloudCannonが開発した静的サイト向けの全文検索ライブラリです。

サイトのビルド後にHTMLを解析して検索インデックスを静的ファイルとして生成し、検索時にはWebAssemblyで動作するクライアントサイドの検索エンジンが必要なチャンクだけを読み込んで結果を返します。外部サーバーへの通信は一切発生しません。

セグメンテーション（文章を単語に分割する処理）において、英語のように単語がスペースで区切られていない日本語・中国語・韓国語は、単語を区切る処理が必要です。

Extended版ではCJK（中国語・日本語・韓国語）のセグメンテーションに対応しており、`npx pagefind`を実行するだけでExtended版が自動的にダウンロードされます。検索UIコンポーネントも同梱されているため、数行のHTMLを追加するだけで検索ページを構築できます。

:::message
PagefindのセグメンテーションはMeCabのような品詞分解を行う形態素解析ではなく、Unicode標準に基づく単語境界の検出です。そのため「走る」で「走った」がヒットするような活用形の展開（ステミング）には対応していません。
:::

Pagefindを採用した決め手は次の点です。

- **日本語対応**: Extended版がCJKセグメンテーションに対応している
- **静的サイトとの親和性**: ビルド時にインデックスを静的ファイルとして生成する。外部サービスが不要
- **軽量**: インデックスはチャンク分割され、検索時に必要な部分だけが転送される
- **プライバシー**: 完全にクライアントサイドで動作する
- **コスト**: ゼロ

## Pagefindの実装

### インストールと設定

まずPagefindをインストールします。

```bash
npm install -D pagefind
```

次にプロジェクトルートにPagefindの設定ファイル`pagefind.yml`を作成します。

```yaml:pagefind.yml
site: public
glob: "blog/**/*.html"
force_language: ja
```

`glob`でインデックス対象を記事ページに限定し、トップページや固定ページは除外しています。`force_language: ja`は日本語のCJKセグメンテーションを強制する設定です。

### 検索ページの作成

検索ページはZolaのセクションとして作成します。`content/search/_index.md`でテンプレートを指定し、`templates/search.html`にPagefind UIを配置します。

```html:templates/search.html
{% extends "base.html" %}

{% block main_content %}
<main>
  <div class="container">
    <link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
    <div id="search"></div>
    <script src="/pagefind/pagefind-ui.js"></script>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        new PagefindUI({
          element: "#search",
          showSubResults: true,
          showImages: false,
          translations: {
            placeholder: "検索キーワードを入力…",
            zero_results: "[SEARCH_TERM] の検索結果はありません",
            one_result: "[SEARCH_TERM] の検索結果: 1件",
            many_results: "[COUNT] 件の検索結果",
            clear_search: "クリア",
          }
        });
      });
    </script>
  </div>
</main>
{% endblock main_content %}
```

`base.html`を継承することで、サイト全体のレイアウトがそのまま反映されます。`translations`で検索UIの日本語メッセージを指定しています。

### ビルドと実行

`zola build`の後にPagefindを実行するだけでインデックスが生成されます。

```bash
zola build
npx pagefind
```

CI/CDでも同様に、ビルド後にこの2ステップを追加すれば完了です。

```yaml
- name: Build
  run: zola build

- name: Build search index
  run: npx pagefind
```

## 実装時のハマりどころ

### minify_htmlの罠

`zola build`後にPagefindを実行したところ、多数のHTMLファイルを検出しながらインデックスされたページは0件、「Discovered 0 languages」という結果になりました。

原因の切り分けは次のように進めました。

1. 最小限のHTMLファイルを作成してPagefindを実行 → 正常動作
2. Zolaが実際に生成したHTMLをコピーしてPagefindを実行 → 再現
3. HTMLの要素を削りながら比較 → `</head>`の有無で結果が変わることを特定

Zolaの`config.toml`で`minify_html = true`を設定すると、HTML5の仕様上省略可能な`</head>`閉じタグが除去されます。これ自体はHTML5として合法ですが、Pagefind v1.4.0のHTMLパーサーは`</head>`がないとページを正しく解析できず、言語検出に失敗していました。

対処法は`config.toml`で`minify_html = false`に変更することです。

```toml:config.toml
minify_html = false
```

これはZolaの不具合ではなくPagefindのパーサー側の制約です。将来Pagefindが`</head>`省略に対応すれば`minify_html`を再度有効化できます。

### Pagefind UIとテーマのCSS競合

Pagefind UIにはCSS Custom Propertiesでスタイルをカスタマイズする仕組みがあります。テーマカラーに合わせるため`:root`で変数を宣言したところ、期待どおりに適用されませんでした。

原因はCSSのカスケード順序にあります。`pagefind-ui.css`が`custom.css`よりも後にカスケードされる場合、Pagefindのデフォルト値が`:root`宣言に勝ってしまいます。

セレクタを`.pagefind-ui`に変更し、クラスセレクタの詳細度で確実にオーバーライドすることで解決しました。

```css
.pagefind-ui {
  --pagefind-ui-primary: var(--primary-color);
  --pagefind-ui-text: var(--text-color);
  --pagefind-ui-background: var(--background-color);
  --pagefind-ui-border: var(--divider-color);
  --pagefind-ui-font: var(--sans-serif-font);
}
```

テーマのCSS変数を参照することで、ダークモードなどのカラースキーム切り替えにも自動で追従します。

## まとめ

Pagefindの導入により、Zolaで構築した静的サイトに日本語対応の全文検索を追加できました。

実装自体はシンプルですが、`minify_html`によるHTML構造の変化やテーマとのCSS競合など、組み合わせ固有の問題に注意が必要です。単独では正しく動くものが組み合わせると壊れるパターンは、静的サイトのツールチェーンではよくある話かもしれません。

現時点での制約として、日本語のステミングには未対応です。「走る」で検索しても「走った」はヒットしません。ただし単語単位の検索は安定しており、実用上十分です。

:::message
この記事は筆者のブログ（[codedchords.dev](https://codedchords.dev/blog/2026/02/zola-pagefind-search/)）に掲載した記事を、テーマやデプロイ環境に依存する内容を省いて再構成したものです。
:::
