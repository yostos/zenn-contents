---
title: "無料で始める Cloudflare セキュリティ対策"
emoji: "🛡️"
type: "tech"
topics: ["Cloudflare", "Security", "WAF", "Bot"]
published: true
published_at: 2026-03-24 08:30
---

:::message
この記事は[個人ブログ](https://codedchords.dev/blog/2026/03/cloudflare-free-security/)の要約版です。詳細は元記事をご覧ください。
:::

## TL;DR

個人ブログにAI Chat機能を追加した翌日、`.env`やWordPress管理画面を狙うスキャンボットが押し寄せました。Cloudflareの無料プランだけで実施できるBot Fight Mode、WAFカスタムルール、Rate Limitingの3つを組み合わせた結果、即日で不正アクセスを遮断できています。設定は10分程度で完了します。

## 公開翌日に何が起きたか

個人ブログに生成AIを使ったAskページを公開した翌日、CloudflareのObservabilityを確認したところ、攻撃と思われるリクエストが並んでいました。

主にWordPressなどのCMSやStripeなどの決済サービスを狙ったスキャンです。静的サイト＋Workerという構成なのでそんなサービスは乗せていないのですが。公開されているエンドポイントに対してよく狙われる既知のパスを片っ端から叩いているのでしょう。

実害はありませんが、放置するのも気持ちが悪いですし、Workers AIのNeuronsを無駄に消費されるのは避けたいところです。Cloudflareの無料プランのセキュリティ機能で対策しました。

## 対策1: Bot Fight Mode

最も手軽な対策です。Cloudflareダッシュボードの **Security > Bots** から、ワンクリックで有効化できます。

Bot Fight ModeはCloudflareが持つボットの行動パターンデータベースを使い、自動化されたアクセスを検出して計算コストの高いチャレンジを返します。検索エンジンのクローラーなど検証済みの正当なボットは通過させる仕組みです。

設定はON/OFFだけで、細かなチューニングは有料プラン（Super Bot Fight Mode）の機能になります。それでも、汎用的なスキャンボットの大半はこれで弾けます。

注意点として、Bot Fight Modeは外部サービスからのWebhookやRSSリーダーのフィード取得など、正当な自動アクセスもブロックする場合があります。無料プランではWAFルールによるバイパス（Skip）ができないため、これらのサービスに影響が出た場合はBot Fight Mode自体を無効にする必要があります。

## 対策2: WAF カスタムルール

Bot Fight Modeをすり抜けるアクセスに対しては、WAF（Web Application Firewall）のカスタムルールで対処します。無料プランでは5つまでルールを作成できます。

### ルール1: 許可パスの制限（ホワイトリスト）

最も効果が高いルールを最優先に配置します。ask.codedchords.devは `/`（フロントエンド）と `/api/`（Workers API）しか使わないので、それ以外を全てブロックします。

Actionは **Block**、Place atは **First** に設定します。

「正当なパスだけを許可する」ホワイトリスト方式なので、攻撃者がどんなパスを試してもすり抜けられません。ただし、対象サイトの構成を把握している必要があります。新しいパスを追加した際にルールの更新を忘れると自分自身のコンテンツがブロックされるため、サイト構成を変更したらルールも見直してください。

### ルール2: スキャンパスの遮断（ブラックリスト）

ルール1はaskサブドメイン限定です。
他の領域はスタティックなコンテンツしかありませんが、攻撃のパターンで出てきていたWordPressやphpMyAdminなどのパスへのアクセスを一括でブロックしておきます。

このルールはサイトの構成に依存しないため、Cloudflareで管理しているドメイン全体に適用できます。WordPressを使っていないサイトであれば、デメリットはありません。

## 対策3: Rate Limiting

Bot Fight ModeとWAFルールを通過したリクエストに対する最後の砦です。同一IPからの過剰なリクエストを制限します。

**Security > Security rules > Rate limiting rules** から設定します。

| 項目     | 設定値                               |
| -------- | ------------------------------------ |
| 対象     | `http.host eq "ask.codedchords.dev"` |
| 判定基準 | IP                                   |
| レート   | 10リクエスト / 10秒                  |
| Action   | Block（10秒間）                      |

無料プランではRate Limitingルールは1つまで、ブロック期間は最大10秒という制約があります。大規模な攻撃には有料プランのRate Limiting（より長いブロック期間、より多くのルール）が必要ですが、スキャンボット対策としては十分です。上記の設定値は一例です。ページ内のリソース数や想定されるアクセスパターンに応じて調整してください。

なお、今回はWorkers側にも `/api/ask` エンドポイントに対して同一IP 60秒間10リクエストの制限を入れています。CloudflareのRate Limitingはインフラ層での粗いフィルタリング、Workers側はアプリケーション層での細かな制御という役割分担です。

## 3層防御の全体像

設定した対策を整理します。

| レイヤー | 対策               | 役割                           |
| -------- | ------------------ | ------------------------------ |
| 第1層    | Bot Fight Mode     | 既知のボットパターンを自動検出 |
| 第2層    | WAF カスタムルール | 不正なパス・不要なパスを遮断   |
| 第3層    | Rate Limiting      | 過剰なリクエストを制限         |

いずれもCloudflareの無料プランで利用でき、設定はダッシュボードからの操作だけで完結します。

## まとめ

これらの設定を適用した直後から、Observability上でスキャン系のリクエストがブロックされていることを確認できました。Workers AIのNeuronsが無駄に消費されることもなくなっています。

個人サイトであっても、公開すればスキャンボットは来ます。「小規模だから狙われない」ということはありません。ボットは規模を問わず、見つけたエンドポイントを片っ端から叩きます。

Cloudflareを使っているなら、無料プランの範囲でもBot Fight Mode、WAFカスタムルール、Rate Limitingの3つを設定するだけで、大半の自動化されたスキャンは防げます。設定にかかる時間は10分程度です。特にWorkers AIやAPIエンドポイントを公開している場合は、不要なリクエストによるリソース消費を防ぐためにも早めの対策をおすすめします。

## References

- [Bot Fight Mode - Cloudflare Docs](https://developers.cloudflare.com/bots/get-started/free/)
- [Custom rules - Cloudflare Docs](https://developers.cloudflare.com/waf/custom-rules/)
- [Rate limiting rules - Cloudflare Docs](https://developers.cloudflare.com/waf/rate-limiting-rules/)
