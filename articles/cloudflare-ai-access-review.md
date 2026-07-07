---
title: "CloudflareのAI対策見直しとAIエージェント対応度診断"
emoji: "🤖"
type: "tech"
topics: ["Cloudflare", "AI", "セキュリティ", "SEO"]
published: true
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/07/cloudflare-ai-access-review/) からの転載です。
:::

## TL;DR

CloudflareのAIボット対策を4か月ぶりに見直し、あわせて公式のAgent Readinessスキャンで筆者のブログの「AIエージェント対応度」も診断してみた記録です。

- 検索とAI学習を兼ねる「混在クローラー」(Googlebot、Applebot、BingBotなど)が、仕様変更でデフォルトのブロック対象に含まれる予定であることを確認した
- Agent Readinessスキャンの指摘の大半は、APIやエージェントサービスの運用を前提にした項目で、静的な個人ブログには該当しなかった
- 該当する指摘のうち実装可能なものは`Link`ヘッダーでライセンスとフィードの所在を明示する形で対応し、コストや標準化の状況から見送った項目もある

## はじめに

2026年2月、[以前の記事](https://zenn.dev/yostos/articles/cloudflare-benefits)で、AI学習クローラー対策としてContent Signals Policy、Block AI bots、AI Labyrinthという3層構成を紹介しました。あれから4か月、AIによるアクセスの重要性はさらに増しています。改めて筆者のブログのCloudflare設定を見直すとともに、Cloudflareが新しく公開したAgent Readinessスキャナーで「AIエージェントへの対応度」を診断してみました。

## Managed robots.txtまわりを再確認する

まず、AI Crawl Controlのダッシュボードを一通り確認しました。

Block AI training botsは「Block on all pages」のままで変更していません。筆者のブログのコンテンツはCC BY-NC-ND 4.0(非営利・改変禁止)で公開しているので、商用LLMの学習データとして使われることは元々ライセンスの意図と衝突します。学習目的のクローラーは全ページで拒否するのが一貫した方針です。

Content Signalsでは、Managed robots.txtをオンにしています。

AI Crawl ControlのCrawlers一覧では、クローラーごとの許可/ブロックを個別に確認しました。

| カテゴリ                 | 例                                                                          | 設定  |
| ------------------------ | --------------------------------------------------------------------------- | ----- |
| AI Crawler(学習用)       | GPTBot、ClaudeBot、Bytespider、Amazonbot、TikTok Spider、Meta-ExternalAgent | Block |
| AI Search / AI Assistant | Applebot、PerplexityBot、ChatGPT-User                                       | Allow |
| Search Engine Crawler    | Googlebot、BingBot                                                          | Allow |

Crawlers一覧の分類も、学習目的のクローラーを拒否するという方針のとおりでした。あわせてAI Labyrinth(クロールルールを無視するボットに偽コンテンツを読ませるハニーポット機能、Beta)も確認しましたが、2月から変わらずONのままでした。

## 「混在クローラー」という新しい論点

今回の見直しで、2月時点にはなかった変化に気づきました。レガシー機能「Block AI bots」の設定画面に、次のような予告が表示されていたのです。

> On September 15, mixed-purpose crawlers that are used both for search indexing and for training AI will be included in blocking AI training.

ここで言う混在クローラーとは、前段のCrawlers一覧でSearch Engine CrawlerやAI Searchに分類し、学習とは無関係としてAllowにしていたGooglebot、Applebot、BingBotのことです。検索とAI学習を1回のクロールで同時に行うため両者を切り分けられず、学習ブロックを選んでいるサイトでは最も制限の強いルールを適用する、というのが実質的な立場だと考えられます。そのままでは検索エンジン経由の流入もAI検索・AIアシスタント経由の露出も失うため、「Mixed purpose crawlers will continue to be allowed」を選び、混在クローラーは引き続き許可する設定にしました。

レガシー機能は9月15日に廃止され、後継の「Configure AI bot policies」に一本化されます。こちらはボットを3種類に分類し、それぞれ個別にAllow/Blockを選べる形になっていました。

| 分類     | 説明                                             | 設定                                          |
| -------- | ------------------------------------------------ | --------------------------------------------- |
| Search   | 検索エンジンのインデックス用ボット               | Allow(Recommended)                            |
| Agent    | ユーザーの質問への回答生成のために参照するボット | Allow(Recommended)                            |
| Training | AI学習用にコンテンツをスクレイピングするボット   | Block(Recommended値はBlock on pages with ads) |

Trainingだけ、広告のない筆者のブログの事情に合わせて推奨値の「Block on pages with ads」から「Block」に変更しました。

## AIエージェント対応度を診断してみた

Cloudflareは[isitagentready.com](https://isitagentready.com/)という無料の診断ツールを公開しています。

この診断ツールでは、サイトのAIエージェントへの対応度(Agent Readiness)を診断してくれます。

筆者のブログのURLでスキャンしたところ、次のようなものでした。

![Agent Readinessスキャン結果](/images/cloudflare-ai-access-review/agent-readiness.webp)

### 個人ブログサイトでは該当しない項目

改善項目として、10個の指摘を受けました。
ただし、10個のうち6個はいずれも「稼働しているAPIやエージェントサービスがあること」を前提にした指摘でした。

| 指摘                              | 規格                                      | 該当しない理由                                                                                            |
| --------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| DNS for AI Discovery (DNS-AID)    | IETFドラフト、Linux Foundation 2026年発表 | 他のAIエージェントから発見・接続されるエージェントサービス(チャットボット、MCPサーバー等)を運用していない |
| API Catalog                       | RFC 9727                                  | カタログ化すべきAPIが存在しない                                                                           |
| OAuth/OIDC discovery metadata     | RFC 8414 等                               | 認証保護されたAPIや会員機能がない                                                                         |
| OAuth Protected Resource Metadata | RFC 9728                                  | 同上                                                                                                      |
| auth.md                           | WorkOS提唱                                | OAuth Protected Resource Metadataを前提とする、同上の理由                                                 |
| MCP Server Card                   | SEP-1649(標準化進行中)                    | MCPサーバーを運用していない                                                                               |

筆者のブログは静的コンテンツを配信するだけのサイトで、APIやエージェント向けサービスは一切運用していません。この種の指摘は、SaaSやEC、API提供事業者向けのチェックリストとしては妥当ですが、個人ブログにはそもそも対象が存在しませんでした。

### 対応した項目

「ホームページにLink response header(RFC 8288)がない」という指摘もありました。ツールの提案は`rel="api-catalog"`や`rel="service-doc"`でAPIカタログやAPI仕様書を指すというものでしたが、筆者のブログにAPIはないので、この提案どおりに実装しても意味がありません。

代わりに、Linkヘッダーの仕組み自体は筆者のブログでも使い道があると考え、次の2つを指すヘッダーを追加しました。

```text:static/_headers
/
  Link: </license/>; rel="license", </atom.xml>; rel="alternate"; type="application/atom+xml"
```

`rel="license"`はIANA登録済みの正式なrelationで、CC BY-NC-ND 4.0を明記したライセンスページ(`/license/`)をAIエージェントが機械的に検出できるようにします。学習ボットのブロックと合わせて、コンテンツの利用条件を多層的に伝える形になりました。`rel="alternate"`はZolaが生成するAtomフィード(`/atom.xml`)へのリンクで、フィードの発見性を高めます。

### 対応を見送った項目

残る3個は、対応自体は可能でも今回は見送りました。

Markdown for Agentsは、`Accept: text/markdown`のリクエストにHTMLの代わりにMarkdownを返す機能です。CloudflareのAI Crawl Control上では確認できましたが、Proプラン以上限定(2026年7月時点で月$20〜25)のため、Freeプランの現状ではロックされていました。個人ブログの一機能としてはコストに見合わないと判断し、見送りました。

WebMCPは、ブラウザ内蔵のAIエージェントに`navigator.modelContext.provideContext()`でサイトの操作(検索など)を直接公開する仕組みです。現状はEarly Preview Program参加者限定の実験段階で、一般のブラウザではまだ有効化されていません。筆者のブログの操作対象もpagefindによる検索程度で薄く、標準化が進んだ段階で再検討することにしました。

Agent Skills discovery indexは、`/.well-known/agent-skills/index.json`にサイト固有の作業手順(SKILL.md)を公開する仕組みです。コンテンツサイト向けの想定用途は「文章校正」「カテゴリ分類の提案」といった編集アシスタント業務で、これは既に自分のClaude Code環境でローカルに完結しています。v0.2.0のドラフト段階でエコシステムの普及状況も未検証なため、こちらも見送りとしました。

## まとめ

Agent Readinessスキャンの10個の指摘を並べてみると、その多くはAPIやSaaS、エージェント向けサービスを運用している事業者を想定したチェックリストだと分かりました。静的な個人ブログにとって本当に意味のある「AI対応」は、実は範囲が絞られます。筆者のブログでの結論は次のとおりです。

- CC BY-NC-NDライセンスの意図に沿って、学習目的のクローラーは技術的にブロックする
- robots.txtのContent Signalsとライセンスページへの`rel="license"`で、利用条件を機械可読な形でも表明する
- 検索エンジンやAI回答エンジンからの参照は妨げず、露出の機会は残す
- WebMCPやAgent Skillsのようなドラフト段階の規格には、実際に普及するまで様子見の姿勢を崩さない

2月の記事で組んだ多層防御の骨格は変わっていませんが、Cloudflare側の仕様変更(混在クローラーの扱い)に合わせて設定を追随させ、Agent Readinessという新しい物差しで一度棚卸しをしたことで、筆者のブログのAI対応の現在地を再確認できました。

## References

- [Cloudflare](https://blog.cloudflare.com/content-signals-policy/). "Giving users choice with Cloudflare's new Content Signals Policy"
- [Cloudflare](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/). "robots.txt setting"
- [Cloudflare](https://blog.cloudflare.com/content-independence-day-ai-options/). "Your site, your rules: new AI traffic options for all customers"
- [Cloudflare](https://blog.cloudflare.com/agent-readiness/). "Introducing the Agent Readiness score"
- [Cloudflare](https://www.cloudflare.com/plans/pro/). "Pro Plan Overview"
- [IETF](https://www.ietf.org/archive/id/draft-mozleywilliams-dnsop-dnsaid-01.html). "DNS for AI Discovery"
- [DNS-AID](https://dns-aid.org/). "AI Agent Discovery via DNS"
- [IETF](https://www.rfc-editor.org/rfc/rfc9727). "RFC 9727: The api-catalog Well-Known URI and Link Relation Type"
- [IETF](https://www.rfc-editor.org/rfc/rfc8288). "RFC 8288: Web Linking"
- [WorkOS](https://workos.com/auth-md). "auth.md — Open Protocol for Agent Registration"
- [Model Context Protocol](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127). "MCP Server Card (SEP-1649)"
- [Cloudflare](https://github.com/cloudflare/agent-skills-discovery-rfc). "Agent Skills Discovery RFC"
- [Agent Skills](https://agentskills.io/). "Agent Skills"
- [Chrome Developers](https://developer.chrome.com/blog/webmcp-epp). "WebMCP Early Preview Program"
