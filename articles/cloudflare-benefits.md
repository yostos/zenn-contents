---
title: "Cloudflare無料プランだけで個人サイトのセキュリティが完結した話"
emoji: "☁️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["cloudflare", "network", "security"]
published: true
---

:::message
本記事の完全版（設定項目の詳細表・プラットフォーム比較表を含む）は、以下の個人ブログに移転しました。
:::

https://codedchords.dev/blog/2026/02/cloudflare-benefits/

## TL;DR

Cloudflareのアドバンテージは、次の3点です。

- 無料プランだけでWAF・ボット対策まで揃う、セキュリティの充実度
- DNS統合だからこそ、煩雑でリスクの高い設定をワンクリックで実現
- AIクローラー対策やページ先読みなど、最新トレンドへの即応

## 背景

Cloudflareでドメインを取得し、GitHubリポジトリと連携して静的コンテンツをCloudflare Pagesへデプロイするというシンプルな構成です。この構成だけでも思いの外多くの恩恵が得られたので、主要なポイントをまとめます。

## 無料プランで有効にした機能

Cloudflareのダッシュボードで有効にした機能は、大きく4カテゴリに分かれます。いずれも無料プランで利用でき、ほとんどがトグルひとつで有効にできるものです。

- **Edge Certificates** — Always Use HTTPS、HSTS、TLS 1.3、Certificate Transparency Monitoringなど、SSL/TLS証明書とHTTPS通信に関する7項目
- **Security** — AI Labyrinth、Block AI bots、Bot fight mode、WAF、DDoS保護など、サイトを外部の脅威から守る8項目
- **DNS** — DNSSECとEmail Security（SPF/DMARC）によるドメインの信頼性向上
- **Speed** — HTTP/2・HTTP/3、Speed Brain（ページ先読み）、0-RTT Connection Resumptionなどパフォーマンス最適化の6項目

## 以前のプラットフォームとの比較

昨年までAmazon Amplify + CloudFront、先月までGitHub Pagesで運用していました。比較すると、特にセキュリティ面の差が顕著です。

- **AWS** — 同等のボット対策やWAFを実現するにはAWS WAFやBot Controlの追加費用と自前でのルール作成が必要
- **GitHub Pages** — 設定可能なセキュリティ機能がほとんどなく、Minimum TLS VersionやHTTP/3も非対応
- **Cloudflare** — 上記の機能がすべて無料プランに含まれ、ダッシュボードのトグルひとつで有効にできる

## AI時代のコンテンツ保護

Cloudflareの無料プランには、AIクローラーに対応する多層的な防御が用意されています。

1. **Content Signals Policy**(意思表示) — robots.txt内でコンテンツの用途別に許可/拒否を宣言する
2. **Block AI bots**(技術的ブロック) — AI学習用クローラーをWAFレベルでブロックする
3. **AI Labyrinth**(欺瞞防御) — ブロックを無視するクローラーに偽コンテンツを読ませ、学習データを汚染させるハニーポット

この多層構成により、AI検索からの流入を確保しつつ学習目的のスクレイピングは拒否するという運用が、無料プランだけで実現できます。

## まとめ

個人の静的サイトという用途では、Cloudflareの無料プランだけで「やりたいことが全部できる」状態になりました。以前はAWSの複数サービスを組み合わせて実現していたことが、Cloudflareではひとつのダッシュボードで、しかも無料で手に入ります。

各機能の設定詳細やプラットフォーム比較表など、完全版はブログ記事をご覧ください。

https://codedchords.dev/blog/2026/02/cloudflare-benefits/
