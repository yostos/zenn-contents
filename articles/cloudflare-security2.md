---
title: "Cloudflare無料プランの「Basic Features」ボタン一発で有効になる11機能を全解説"
emoji: "☁️"
type: "tech"
topics: ["cloudflare", "security", "network"]
published: true
---

## はじめに

前回の記事「[Cloudflare無料プランだけで個人サイトのセキュリティが完結した話](https://zenn.dev/yostos/articles/cloudflare-benefits)」では、Cloudflareのダッシュボードで個別に有効化した機能を1つずつ紹介しました。

実は、Cloudflareのダッシュボードには**Basic Features**というボタンがあり、これを押すだけで無料プランの基本11機能を一括で有効にできます。

![Basic Featuresボタン](/images/cloudflare-security2/basic-features-button.webp)
_「Activate 11 core speed and security features included in your Free plan.」— ダッシュボードに表示されるBasic Featuresカード_

前回わざわざ個別に設定していた機能の多くが、このボタン1つでカバーできたのです。

本記事では、Basic Featuresで有効になる11機能の全体像を示したうえで、前回触れなかった4つの機能を掘り下げます。

## Basic Featuresの11機能一覧

Basic Featuresで有効になる11機能は、下図の通りです。

Basic FeaturesでActivateボタンを押すとモーダルが開き、有効化される11機能がチェックボックス付きで一覧表示されます。個別に選択・解除もできますが、デフォルトですべてにチェックが入っています。`Activate selections`ボタン一発で設定できます。

![Activate basic featuresモーダル](/images/cloudflare-security2/basic-features-modal.webp)
_11機能が一覧表示され、「Activate selections」で一括有効化できる_

前回紹介した機能の内7機能は、すべてこのボタンの範囲に含まれていました。
この機能を使えば、個別にトグルを切り替えていた作業の大半はボタンひとつで済んだわけです。

## 前回の記事でカバーしていた7機能

前回記事で詳しく紹介しているため、ここでは要点だけをまとめます。詳細は[前回記事](https://zenn.dev/yostos/articles/cloudflare-benefits)を参照してください。

| 機能                        | 要点                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| Always Use HTTPS            | HTTPアクセスをHTTPSへ301リダイレクト。暗号化されていない通信を防ぐ             |
| TLS 1.3                     | 最新のTLSプロトコル。ハンドシェイクの高速化とセキュリティの強化                |
| HTTP/2 to Origin            | Cloudflareとオリジン間の通信にHTTP/2を使い、多重化で高速化                     |
| HTTP/3 (with QUIC)          | QUICプロトコルで接続確立が高速。パケットロス時の劣化も少ない                   |
| 0-RTT Connection Resumption | TLS 1.3で接続済みのクライアントの再訪問時にハンドシェイクを省略                |
| Browser Integrity Check     | HTTPヘッダーを検査し、不正なUser-Agentやスパムボットを検出・ブロック           |
| Web Analytics (RUM)         | Cookieを使わないプライバシー重視の計測。実ユーザーのパフォーマンスデータを収集 |

## 前回の記事で触れていなかった4機能

Basic Featuresに含まれていながら、前回記事では触れなかった4つの機能を掘り下げます。

### Normalize incoming URLs

Normalize incoming URLsは、Cloudflareに到達したURLを正規化（Normalization）する機能です。

URLには同じリソースを指す複数の表記が存在します。たとえばパスの中にエンコードされた文字（`%2F`など）が含まれていたり、`/../`や`/./`のようなパストラバーサル的な表記が混ざっていたりする場合があります。攻撃者はこうした表記の揺れを利用して、WAFのルールをすり抜けようとします。

Normalize incoming URLsを有効にすると、CloudflareがURLを標準的な形式に統一してからWAFルールを評価します。WAFルールで`/admin`をブロックしていても、`/%61dmin`のようなエンコード表記ですり抜けるといった手口を防げるわけです。

この機能には「Normalize incoming URLs」と「Normalize URLs to origin」の2つのオプションがあります。前者はCloudflare側のルール評価前に正規化を行い、後者はオリジンサーバーへのリクエスト転送時にも正規化されたURLを使います。Basic Featuresでは前者が有効化されます。

静的サイトであっても、WAFルールの回避対策として有効にしておくべき機能です。

### WebSockets

WebSocketsは、CloudflareのプロキシがWebSocket接続を通過させる機能です。

通常のHTTP通信はリクエストとレスポンスの一往復で完結しますが、WebSocketはHTTPのアップグレードリクエストで始まり、その後は双方向のリアルタイム通信を維持します。チャット、ライブダッシュボード、オンラインゲーム、リアルタイム通知など、サーバーからの即時プッシュが必要な場面で使われるプロトコルです。

Cloudflareはリバースプロキシとして動作するため、この設定が無効だとWebSocketのアップグレードリクエストがCloudflareで遮断され、オリジンサーバーとの間でWebSocket接続を確立できません。

静的サイトの場合はWebSocketを使う場面がないので、この機能の恩恵は直接的にはありません。ただし有効にしておいてもオーバーヘッドはなく、将来的にCloudflare Workersでリアルタイム機能を追加する際にはそのまま使える状態になります。

### Onion Routing

Onion Routingは、Tor（The Onion Router）ネットワーク経由のアクセスをCloudflareが適切に処理する機能です。

:::message
**Torとは**通信を複数のリレーノードで暗号化しながら中継し、アクセス元のIPアドレスを匿名化するネットワークです。ジャーナリスト、活動家、プライバシーを重視するユーザーなどが利用しています。
:::

通常、Torからのアクセスは出口ノードのIPアドレスを使うため、複数のユーザーが同一IPから来ているように見えます。そのためボット対策やレート制限の誤検知が起きやすく、Torユーザーは頻繁にCAPTCHAを求められたり、アクセスをブロックされたりします。

Onion Routingを有効にすると、CloudflareはTorネットワーク内で`.onion`アドレスを公開し、Torブラウザからのアクセスをこのアドレス経由でルーティングします。Tor出口ノードを経由せずCloudflareへ到達するため、出口ノードの共有IPによる誤検知が減り、CAPTCHAの表示頻度が下がります。

この機能は「Torユーザーを許可する」というよりも「Torユーザーの体験を改善する」という位置づけです。有効にしても通常のアクセスには影響がなく、プライバシーを重視するユーザーへの配慮として意味があります。

### Hotlink Protection

Hotlink Protectionは、他のサイトが自分のサイトの画像やリソースに直接リンク（ホットリンク）するのを防ぐ機能です。

ホットリンクとは、外部サイトが自分のサーバーにある画像のURLを`<img>`タグに直接指定して表示する行為です。画像のデータは自分のサーバーから配信されるため、帯域やリクエスト数を消費するのはリンクされた側です。意図しない帯域の消費や、場合によってはコンテンツの無断利用につながります。

Hotlink Protectionを有効にすると、Cloudflareはリクエストの`Referer`ヘッダーを検査します。リクエストの参照元が自分のドメイン以外だった場合、画像の配信を拒否します。

ただし注意点があります。Cloudflareの公式ドキュメントに以下の記載があります。

> Hotlink protection has no impact on crawling, but it will prevent the images from being displayed on sites such as Google images, Pinterest, and Facebook.
> （Hotlink Protectionはクローリングには影響しないが、Google Images、Pinterest、Facebook等のサイトで画像が表示されなくなる）
> — [Cloudflare Docs: Hotlink Protection](https://developers.cloudflare.com/waf/tools/scrape-shield/hotlink-protection/)

Hotlink Protectionのブロック条件は、「`Referer`ヘッダーが自サイトのドメインでなく、かつ空でもない場合」です。つまり`Referer`を送信しないクローラーはブロックされませんが、自身のドメインを`Referer`に含めるクローラーはブロック対象になります。

回避策として、Cloudflareには`hotlink-ok`という名前のディレクトリに配置した画像をHotlink Protectionの対象外にする仕組みがあります。このディレクトリはパス上のどの階層に置いても有効なので、たとえば`/images/hotlink-ok/ogp.png`のように、OGP用画像だけをこのディレクトリにまとめる運用が可能です。

ただし、ファイル形式により影響が異なります。

| 影響 | 形式 |
|------|------|
| ブロック対象 | GIF, ICO, JPG/JPEG, PNG |
| 対象外 | WebP, AVIF, SVG, PDF, MP4, MP3 |

Cloudflare Pagesで配信している静的サイトの場合、画像はCloudflareのCDN経由で配信されるため帯域コストは発生しません。コンテンツの無断利用を防ぎたい場合には有効にする意味がありますが、OGP画像への影響を考慮したうえで判断してください。

## まとめ

Cloudflareの無料プランを使い始めたら、まず「Basic Features」ボタンを押しましょう。それだけで11の基本機能が一括で有効になります。

そのうえで、前回記事で紹介したHSTS、Minimum TLS Version、DDoS保護、AIクローラー対策、DNSSECといった機能を個別に設定していけば、無料プランの範囲で堅実なセキュリティ構成が完成します。

「まずボタンを押す、それから細かくチューニング」という順番が、Cloudflare無料プランの効率的な活用法です。
