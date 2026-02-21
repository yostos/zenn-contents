---
title: "Cloudflare無料プランだけで個人サイトのセキュリティが完結した話"
emoji: "☁️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["cloudflare", "network", "security"]
published: true
---

## TL;DR

Cloudflareのアドバンテージは、次の3点です。

- 無料プランだけでWAF・ボット対策まで揃う、セキュリティの充実度
- DNS統合だからこそ、煩雑でリスクの高い設定をワンクリックで実現
- AIクローラー対策やページ先読みなど、最新トレンドへの即応

---

つい3日前に[Cloudflareへ移転した](https://zenn.dev/yostos/articles/migration-to-cloudflare)ばかりです。構成はシンプルで、Cloudflareでドメインを取得し、GitHubリポジトリと連携して静的コンテンツをCloudflare Pages[^2]へデプロイしています。この構成だけでも思いの外多くの恩恵が得られたので、まとめておきます。

## Cloudflareでの設定

Cloudflareのダッシュボードで有効にした機能を、カテゴリごとに紹介します。いずれも無料プランで利用でき、ほとんどがトグルひとつで有効にできるものです。なお、本記事の機能名やβ表記は2026年2月時点のCloudflare管理画面のUIに基づいています。

### Edge Certificates

Cloudflareが発行・管理するSSL/TLS証明書と、HTTPS通信に関する設定です。

| 項目                                | 説明                                                                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Always Use HTTPS                    | HTTP でアクセスが来た場合に自動的に HTTPS へ301リダイレクトしてくれるので、暗号化されていない通信を防げる。                                           |
| HSTS                                | `.dev` ドメイン[^1]を使用しているので私の場合あまり恩恵がないが、ブラウザレベルでHTTPSが強制できる。                                                  |
| Minimum TLS Version                 | サイトに接続する際に許可するTLSプロトコルの最低バージョンの指定。TLS 1.0 と 1.1 は既知の脆弱性があるので、私はTLS1.2にしている。                      |
| Opportunistic Encryption            | HTTPでアクセスしてきたブラウザに対して「暗号化接続も利用可能ですよ」と通知する仕組み。`.dev` の場合、HTTPアクセスが発生しないので実質的に意味がない。 |
| TLS 1.3                             | Minimum TLS Version を 1.2 に設定し、この TLS 1.3 をオンにしておけば、「最低 1.2、対応していれば 1.3 を使う」という構成になる。                       |
| Automatic HTTPS Rewrites            | `http://` をCloudflare が自動的に `https://` に書き換えて「混在コンテンツ（mixed content）」の問題を防いでくれる。                                    |
| Certificate Transparency Monitoring | 自分が意図していない証明書が第三者によって発行された場合（ドメインの不正利用や乗っ取りの兆候）通知してくれる                                          |

[^1]: `.dev` ドメインはGoogleが管理しているTLDで、HSTS Preload ListにTLD単位で登録済みなので最初からHTTPSが強制される。

### Security

ボット対策、DDoS防御、WAFなど、サイトを外部の脅威から守るための設定です。

| 項目                                 | 説明                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AI Labyrinth                         | まだβ機能だが、robots.txt 等のクロールルールを無視して勝手にサイトをスクレイピングするボットに対して偽コンテンツを読ませて学習データを汚染させるという「ハニーポット」的な機能 |
| Block AI bots                        | AI学習用クローラーをブロックする機能                                                                                                                                           |
| Bot fight mode                       | 悪意のあるボット（スパム、クレデンシャルスタッフィング、DDoS等）を検知すると、JavaScriptチャレンジを出して人間かどうかを確認する                                               |
| Browser Integrity Check              | 訪問者のHTTPヘッダーを検査して、不正なUser-Agentやスパムボットによく見られる異常なヘッダーパターンを検出し、脅威が見つかった場合はブロックページを表示する。                   |
| Challenge passage                    | チャレンジ（CAPTCHA等）をクリアした訪問者が、再度チャレンジを求められるまでの有効時間                                                                                          |
| HTTP DDoS attack protection          | HTTPレイヤーのDDoS攻撃を自動検知・緩和する。無料プランでもCloudflare Free Managed Ruleset（基本的なWAFルール）が付属する                                                       |
| Manage your robots.txt               | Cloudflare が robots.txt を自動管理するβ機能。Content Signals Policyを選択すると、コンテンツの利用意図を用途別（検索・AI入力・AI学習）に宣言できる                             |
| Network-layer DDoS attack protection | DDoS保護                                                                                                                                                                       |

### DNS

DNS応答の改ざん防止やメールのなりすまし対策など、ドメインの信頼性を高める設定です。

| 項目           | 説明                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| DNSSEC         | DNSレスポンスに暗号署名を付与して、DNS応答の偽造（DNSキャッシュポイズニング等）を防ぐ                    |
| Email Security | 有効にしてDMARCの設定。メール送信の予定はないので、SPFは"v=spf1 -all"で設定。DMARCは"v=DMARC1; p=reject" |

### Speed

通信プロトコルの最適化やページ先読みなど、サイト表示を高速化するための設定です。

| 項目                                            | 説明                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Web analytics using real user measurement (RUM) | 実際の訪問者のブラウザからパフォーマンスデータ（ページ読み込み時間など）を収集する。Cookieを使わないプライバシー重視の計測方式 |
| Speed Brain                                     | ユーザーがリンクをクリックする前にページを先読みする機能。Speculation Rules API を使い、体感的なページ遷移が高速になる         |
| HTTP/2                                          | HTTP/1.1の後継。1つの接続で複数リクエストを並行処理（多重化）でき、ページ読み込みが高速になる                                  |
| HTTP/3                                          | HTTP/2の次世代版。TCPの代わりにQUICプロトコルを使い、接続確立が高速でパケットロス時の劣化も少ない                              |
| HTTP/2 to Origin                                | Cloudflareとオリジンサーバー間の通信にもHTTP/2を使う設定                                                                       |
| 0-RTT Connection Resumption                     | TLS 1.3で接続済みのクライアントが再訪問時にハンドシェイクの最初の往復を省略でき、再訪問者の初回リクエストが速くなる            |

## 以前のプラットフォームとの比較

昨年までAmazon Amplify、先月までGitHub Pagesで運用していました。
上記で挙げたCloudflareの機能が、それぞれの環境ではどうだったかを比較してみます。特にセキュリティ列の差に注目してください。

- ○: 標準/無料で利用可能
- △: 別途設定や追加費用で対応可能
- ×: 非対応
- −: 該当なし

| 機能                                 |   Amplify + CloudFront   |      GitHub Pages       | コメント                                                              |
| ------------------------------------ | :----------------------: | :---------------------: | --------------------------------------------------------------------- |
| Always Use HTTPS                     |            ○             |            ○            |                                                                       |
| HSTS                                 |      △（手動設定）       |            ○            | AWSだけ手動設定の手間がかかる                                         |
| Minimum TLS Version                  |            ○             |            ×            | GitHub Pagesは古いTLSを拒否できず、セキュリティポリシーを徹底しにくい |
| Opportunistic Encryption             |            ×             |            ×            | HTTP接続の暗号化への誘導は他のサービスでは提供されていない            |
| TLS 1.3                              |            ○             |            ○            |                                                                       |
| Automatic HTTPS Rewrites             |            ×             |            ×            | 他では混在コンテンツを自分で探して直す必要がある                      |
| Certificate Transparency Monitoring  |      △（ACMの一部）      |            ×            | 不正な証明書発行の早期発見に差が出る                                  |
| AI Labyrinth                         |            ×             |            ×            | ワンクリックでAIスクレイピングに対抗できる機能は他にない              |
| Block AI bots                        |   △（WAFルールで対応）   |            ×            | AWSは自前でルールを書く手間とWAF費用がかかる                          |
| Bot fight mode                       | △（WAF Bot Control有料） |            ×            | AWSで同等機能を得るにはBot Control（月額$10〜＋リクエスト従量課金）が必要 |
| Browser Integrity Check              |     △（WAFで部分的）     |            ×            | AWSでは同等ルールの自作が必要で、運用負荷が高い                       |
| Challenge passage                    |         △（WAF）         |            ×            | Cloudflareはチャレンジの有効期間まで細かく制御できる                  |
| HTTP DDoS attack protection          |      △（WAFは有料）      |            ×            | 無料でWAFまで付くのはCloudflareの大きな強み                           |
| Manage your robots.txt               |            ×             |            ×            | 増え続けるAIクローラーへの対応を自動化できる機能は他にない            |
| Network-layer DDoS attack protection |   ○（Shield Standard）   |            ○            |                                                                       |
| DNSSEC                               |      ○（Route 53）       | △（DNS providerに依存） | Cloudflareはワンクリック、DNS一体管理なので設定が圧倒的に楽           |
| Email Security                       |      ○（Route 53）       | △（DNS providerに依存） | 同上。DNS管理とセットなのでSPF/DMARCの設定も迷わない                  |
| Web analytics (RUM)                  | △（CloudWatch RUM有料）  |            ×            | Cloudflareは追加費用なしでCookie不要の計測が使える                    |
| Speed Brain                          |            ×             |            ×            | ページ先読みによる体感速度向上は他のサービスでは提供されていない      |
| HTTP/2                               |            ○             |            ○            |                                                                       |
| HTTP/3                               |            ○             |            ×            | GitHub Pagesは2026年2月時点でHTTP/3未サポート                         |
| HTTP/2 to Origin                     |            ○             |            −            | オリジンサーバーがある構成でのみ意味がある                            |
| 0-RTT                                |            ×             |            ×            | 再訪問時の体感速度に差が出る。他のサービスでは無料で提供されていない  |

## AI時代のコンテンツ保護

Cloudflareの無料プランには、AIクローラーに対応する機能が複数用意されています。これらは独立した機能ですが、組み合わせると多層的な防御になります。

| 機能 | レイヤー | 役割 |
|------|----------|------|
| Content Signals Policy | 意思表示 | robots.txt内でコンテンツの用途別に許可/拒否を宣言する。強制力はなく、善意あるクローラーへの「お願い」 |
| Block AI bots | 技術的ブロック | Cloudflareが「AI学習用」と分類するクローラーをWAFレベルでブロックする。検索エンジンやAIアシスタントは対象外 |
| AI Labyrinth | 欺瞞防御 | ブロックを無視するクローラーに偽コンテンツを読ませ、学習データを汚染させるハニーポット |

ポイントは、Content Signals PolicyとBlock AI botsの役割分担です。Content Signals Policyでは `search=yes, ai-input=yes, ai-train=no` のように宣言し、「検索やAI回答での引用はOKだが、モデルの学習には使うな」という意思を伝えます。しかし宣言はあくまで「お願い」なので、AI学習用クローラーに対してはBlock AI botsがWAFレベルで実際にアクセスを遮断します。それでもすり抜けてくるクローラーにはAI Labyrinthが偽データを食わせます。

さらに、AI Crawl ControlのCrawlersタブではクローラーごとに個別のAllow/Blockを設定できます。たとえば「ChatGPT-Userは許可するがBytespiderはブロックする」といった細かい制御も可能です。

この多層構成により、AI検索からの流入を確保しつつ学習目的のスクレイピングは拒否するという運用が、無料プランだけで実現できます。

## Cloudflareの評価

比較表を振り返ると、Cloudflareの強みは大きく3つあります。

1つ目は、無料プランでのセキュリティの充実度です。AWSで同等のボット対策やWAFを実現しようとすると、AWS WAFやBot Controlの追加費用と自前でのルール作成が必要でした。GitHub Pagesではユーザーが設定できるセキュリティ機能はほとんどありません。Cloudflareでは、AIボットのブロック、Bot fight mode、WAFまで無料プランに含まれており、しかもダッシュボードのトグルひとつで有効にできます。

2つ目は、DNS・証明書・セキュリティ・CDNがひとつのダッシュボードに統合されている点です。AWSではRoute 53、CloudFront、ACM、WAFと複数サービスをまたいで設定する必要がありました。GitHub PagesではDNSが外部依存のため、DNSSECやSPF/DMARCの設定は利用するDNSプロバイダ次第でした。Cloudflareではドメイン取得からDNSSEC、メールセキュリティ、デプロイまで一箇所で完結するため、設定の見通しがよく管理も楽です。

3つ目は、他のサービスでは提供されていない独自機能です。前述のとおり、Content Signals PolicyからBlock AI bots、AI Labyrinthまで、AIクローラーへの多層的な対応が無料プランだけで揃います。加えて、Speculation Rules APIを活用したSpeed BrainやTLS 1.3の0-RTT再接続など、パフォーマンス面でも独自の機能が提供されています。特にAIクローラー対策は今後ますます重要になる領域であり、「意思表示」と「技術的ブロック」と「欺瞞防御」を組み合わせた構成がワンクリックで手に入るのは大きな安心感があります。

個人の静的サイトという用途では、Cloudflareの無料プランだけで「やりたいことが全部できる」状態になりました。以前はAWSの複数サービスを組み合わせて実現していたことが、Cloudflareではひとつのダッシュボードで、しかも無料で手に入ります。移行してよかったと素直に思います。

[^2]: Cloudflare Pagesは現在、Cloudflare Workersとの[統合が進んでいる](https://blog.cloudflare.com/pages-and-workers-are-converging-into-one-experience/)。将来的にはWorkersの静的アセット機能に一本化される見込みだが、Pages自体も引き続き利用可能。
