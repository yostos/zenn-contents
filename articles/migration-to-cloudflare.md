---
title: "Zolaブログを新ドメイン取得 + Cloudflare移転"
emoji: "☁️"
type: "tech"
topics: ["Cloudflare", "GitHubPages", "Zola", "セキュリティ"]
published: true
---

## TL;DR（Zola利用者向け）

- Cloudflare ProxyとGitHub Pagesの組み合わせでは、Let's Encrypt証明書のHTTP-01チャレンジを妨げるリスクがある
- Cloudflare PagesのCI/CDはv2以降Zolaをサポートしていない（[issue #3](https://github.com/cloudflare/pages-build-image/issues/3)は2023年からOpen）。GitHub Actions + `wrangler deploy`で代替可能

## はじめに

以前、Amazon Amplify + Next.js + Tailwind CSSで運用していたブログをGitHub Pages + Zolaに移行しました。GitHub Pagesはシンプルで運用コストが低い一方、カスタムHTTPレスポンスヘッダーを設定できないという制約があります。[以前の記事](https://zenn.dev/yostos/articles/github-pages-security-headers)でも書きましたが、セキュリティスキャナーで警告が出る状態をずっと気にしていました。

では、Cloudflareに持っていくかと移転をはじめたところ、いくつかひっかかりポイントがあったので共有します。

## 新ドメインの取得

移転にあたり、新ドメイン`codedchords.dev`を取得しました。旧ドメインから変更した理由は2つあります。

- Cloudflareの無料プランではDNSをCloudflareに移管する必要がある。旧ドメインはFastMailでメール運用しておりDNSもFastMailに移管済みのため、Cloudflareへの再移管が難しい
- 旧ドメインは長年の運用とブログ改築の結果、404でインデックスされないページが多数あり、これを機に一新してもよい

TLDは`.dev`を選びました。`.dev`はGoogleが管理するTLDで、HSTSプリロードリストに登録されています。ブラウザレベルでHTTPS接続が強制されるため、セキュリティ面で最初から一段高い状態が保証されます。

## Cloudflare Workers への移行

セキュリティヘッダーを設定するために、Cloudflareを利用する方針で検討を進めました。最終的にCloudflare Workersの静的アセット機能に落ち着くまでに、2つのアプローチで挫折しています。

**案1: Cloudflare Proxy + Transform Rules（断念）**。最初に検討したのは、CloudflareのProxyを有効にしてTransform Rulesでレスポンスヘッダーを追加する方法です。GitHub Pagesをオリジンとし、Cloudflareを前段に配置する構成です。しかし、GitHub PagesのLet's Encrypt証明書は90日ごとにHTTP-01チャレンジで自動更新されます。Cloudflare Proxyが間に入るとチャレンジがGitHubへ届かず、更新が静かに失敗する可能性があります。証明書の期限切れでサイトが突然表示不能になるリスクがあり、静的ブログで証明書を定期監視するのは割に合いません。この案は見送りました。

**案2: Cloudflare Pages CI/CD（断念）**。次に、Cloudflare PagesのCI/CDでZolaをビルドしてそのままホスティングする方法を試みました。しかし、Cloudflare Pagesのv2ビルドシステムではZolaがサポート対象から外れており、ビルドが通りません。この問題は[GitHubのissue](https://github.com/cloudflare/pages-build-image/issues/3)で2023年から報告されていますが、2026年2月現在もOpenのままです。リポジトリにZolaバイナリを同梱するワークアラウンドも提案されていますが、スマートとは言えないためこの案も断念しました。

**案3: Cloudflare Workers 静的アセット（採用）**。最終的に採用したのが、Cloudflare Workersの静的アセット機能です。CloudflareはWorkersとPagesを統合する方針で、今後の機能開発はWorkersに集中されます。Workersの静的アセット機能は`_headers`ファイルをネイティブにサポートしており、セキュリティヘッダーの設定が可能です。SSL証明書もCloudflareが一元管理するため更新の問題は発生しません。ビルドはGitHub Actionsで行い、`wrangler deploy`でデプロイする構成にしました。Zolaのバージョンも自分で管理できます。

移行手順は以下のとおりです。

1. Cloudflare DashboardのWorkers & Pagesから「Upload your static files」でプロジェクトを作成。後で上書きされるので適当なファイルを1つアップロードするだけでよい
2. 既存のGitHub Actionsワークフロー（`deploy.yml`）を修正。Zolaのビルド部分はそのまま流用し、デプロイ先をCloudflare Workersに変更する。リポジトリに`wrangler.toml`を追加し、GitHub Repository SecretsにCloudflareのアカウントIDとAPIトークンを登録

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: "deploy"
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Setup Zola
        uses: taiki-e/install-action@v2
        with:
          tool: zola@0.22.1

      - name: Build
        run: zola build

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: "4"
          command: deploy
```

3. Workersにカスタムドメイン`codedchords.dev`を追加。CloudflareがDNSレコードを自動設定してくれる
4. GitHub Pagesを無効にする。Settings → PagesでSourceをNoneに変更するが、GitHub Actionsが選択されている状態ではNoneに変更できないため、一度Branchに切り替えてから設定する

移転後はGoogle Search Consoleに新ドメインのプロパティを追加し、サイトマップを送信しました。

## セキュリティヘッダーの設定

Cloudflare Workersの静的アセット機能は、ビルド出力に`_headers`ファイルを含めるとレスポンスヘッダーに自動適用します。Zolaの`static/_headers`に以下を配置しました。

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

CSPは見送りました。SoundCloud、YouTube、OpenStreetMap、GoatCounter、Giscus、はてなブログカードなど外部リソースが多く、許可リストの管理コストに対して静的サイトでの実益が限定的なためです。

## 旧ドメインからの転送

旧ドメインへのアクセスを新ドメインに転送する必要があります。旧ドメインのDNSはFastMailで管理しておりCloudflareへの移行は行わないため、Cloudflare Redirect Rulesは使えません。

そこで、リダイレクト専用の静的サイトを生成する方法をとりました。Zolaで`zola build`すると全ページのHTMLが生成されます。aliasesによるリダイレクトページも含まれるため、以前Next.jsで運用していた時代のパスもカバーされます。この全HTMLをmeta refreshリダイレクトページに差し替えて、別リポジトリに配置し、旧ドメインでGitHub Pages配信する構成です。

各リダイレクトページの内容は以下のようになります。

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="canonical" href="https://codedchords.dev/（対応パス）" />
    <meta
      http-equiv="refresh"
      content="0; url=https://codedchords.dev/（対応パス）"
    />
  </head>
  <body></body>
</html>
```

Pythonスクリプトで、Zolaビルドからリダイレクトページの差し替え、不要ファイルの削除、CNAME配置までを一括実行しています。通常ページ367件とaliasページ226件、合計593件のリダイレクトを生成しました。aliasページはZolaが生成したmeta refreshのリダイレクト先（正規パス）を読み取り、新ドメインの正規パスに直接転送します。GitHub Actionsでデプロイを自動化しています。

この方法であれば全ページ・全パスをカバーできます。GitHub Pagesではサーバーサイドの301リダイレクトが設定できないため、meta refresh + canonicalの組み合わせが現実的な最善策です。FastMailのDNS変更も不要で、既存のCNAME/Aレコードをそのまま利用できます。

## まとめ

GitHub PagesからCloudflare Workersへの移転で得た知見をまとめます。

- Cloudflare ProxyとGitHub Pagesの組み合わせでは、Let's Encrypt証明書のHTTP-01チャレンジを妨げるリスクがある
- Cloudflare PagesのCI/CDはv2以降Zolaをサポートしていない（[issue #3](https://github.com/cloudflare/pages-build-image/issues/3)は2023年からOpen）。GitHub Actions + `wrangler deploy`で代替可能
- Cloudflare Workersの静的アセット機能は`_headers`ファイルでセキュリティヘッダーを簡単に設定できる
- 旧ドメインからの転送は、meta refreshリダイレクトの静的サイトを生成する方法で全パスをカバーできる

`.dev`ドメインのHSTSプリロードに加え、Cloudflare Workers側でセキュリティヘッダーも設定できるようになり、セキュリティスキャナーの警告も解消されました。
