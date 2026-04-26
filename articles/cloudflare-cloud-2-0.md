---
title: "Cloudflare Agents Week 2026が告げるCloud 2.0時代: エンタープライズの主戦場が移る"
emoji: "☁️"
type: "idea"
topics: ["Cloudflare", "AWS", "GoogleCloud", "Cloud", "AI"]
published: true
published_at: 2026-04-27 09:00
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/04/cloud2-0/) からの転載です。
:::

## TL;DR

Cloudflareの「Agents Week 2026」は、LLMエージェントが主役となる「Cloud 2.0」レイヤーの本格的な立ち上がりを示しました。GCPが先行、Cloudflareが追いつき、AzureとAWSは個別サービスを揃えつつも統合プラットフォームとしては準備段階という構図です。Cloud 1.0で築いた優位がそのままCloud 2.0に引き継がれない以上、エンタープライズの主戦場はインフラ設計から業務プロセスのエージェント向け再設計へ移ります。

## はじめに

Cloudflareは2026年4月13日〜17日に「Agents Week 2026」を開催して、10個以上の新機能を一気に発表しました。新機能の多くが、LLMエージェント(Claude Codeのような「目的を与えられたら、自律的に考え道具を使いタスクを完遂するLLMを使った仕組み」)に関連したものです。

Cloudflareがエージェント向けプラットフォームのロードマップを一気に開示しきった印象的な5日間でした。

## Cloud 2.0の時代

今回の発表をまとめて眺めると、Cloudの変遷は次のように整理できます。「Cloud x.0」という言い回しが使い古されているのは承知の上で、それでも今回の地殻変動を端的に表すのに「Cloud 2.0」はちょうど良い言葉だと感じています。

:::message
本記事における「Cloud 2.0」の定義について。LLMエージェントがCloudのワークロードの主役となる新しいレイヤーを指す、本記事独自の用語として用います。過去に同じ表記が別の意味で使われてきた経緯がありますが、本記事の主張とは無関係です。
:::

| 世代          | 呼称               | 本質的な役割         | 操作主体 (Who)        | 主な関心事・技術                                   |
| :------------ | :----------------- | :------------------- | :-------------------- | :------------------------------------------------- |
| **Cloud 0.5** | **仮想化インフラ** | **「場所」の移動**   | インフラ担当者 (手動) | リフト＆シフト、VM、データセンターの仮想化         |
| **Cloud 1.0** | **Cloud Native**   | **「構造」の最適化** | 開発者 (コード/API)   | マネージドサービス、K8s、サーバレス、IaC           |
| **Cloud 2.0** | **Agentic Cloud**  | **「意思」の自律化** | **AIエージェント**    | 自律的な推論、長期記憶、Tool Use、動的リソース制御 |

3つの世代を「場所→構造→意思」の流れで並べると、世代が進むごとに操作主体が一段上のレイヤーへ移っていくことが見えてきます。Cloud 0.5でインフラ担当者がVMを操作し、Cloud 1.0で開発者がAPIやIaC越しにマネージドサービスを操作してきたところに、Cloud 2.0ではLLMエージェント自身がインフラを叩く側に立ちます。今のエンタープライズが向き合っているのは、「LLMエージェントをいかに効率よく稼働させるか」を中心に据えた新しいITインフラストラクチャーの設計です。

ひとつ前提を強調しておきます。Cloud 2.0はCloud 1.0を置き換えるものではありません。銀行の勘定系、ECのバックエンド、SaaSの基盤といった既存のワークロードは、引き続きCloud 1.0のプリミティブの上で動き続けます。Cloud 2.0はその上に積み上がる新しいレイヤーとして立ち上がり、エージェントが必要に応じて下のCloud 1.0のアプリを呼び出すこともある、という関係です。

## LLMエージェントとは

**LLMエージェントとは、目的を与えられたら自分で考え道具を使いタスクを完遂するLLMを用いた仕組み**です。聞かれたことに答えるだけのチャットボットと違い、ゴールに向かって自分で手を動かしていきます。具体的にはAnthropicのClaude CodeやClaude Coworkのようなサービスです。

より正確に整理すると、エージェントは主に以下の4つの要素で構成されるシステムと定義されることが多いです。

- **脳 (Brain / Planning)**
  LLM本体である。与えられた大きな目標を、実行可能な小さなステップ(サブタスク)に分解する。過去の失敗から学び、計画を修正する能力もここに含まれる。
- **記憶 (Memory)**
  会話の文脈や現在の作業手順を保持する短期記憶と、外部データベース(RAGなど)を活用して膨大な情報を必要に応じて取り出す長期記憶の二段構え。
- **道具の使用 (Tool Use / Action)**
  エージェントの大きな特徴。LLMはテキストを生成するだけでなく、Web検索で最新情報を取得し、コード実行で計算やデータ分析を行ない、API連携でメール送信・カレンダー予約・ファイル操作といった外部ツールを呼び出す。
- **認識と判断 (Perception & Reflection)**
  実行した結果が正しかったか、目標に近づいているかを自己評価し、次の行動を決定する。

この4要素は、計画→実行→評価のループを回しながら、共通の記憶を参照・更新する形で連動します。

ChatGPTをはじめとするLLMが登場したとき、企業はいかにこれを業務システム(アプリケーション)に取り込むかを検討しました。RAGによる社内ナレッジ検索、お問い合わせの自動応答、議事録の要約など、LLMをアプリケーションの中の一機能として組み込む方向です。

しかしその方向での検討は正しい解ではありませんでした。LLMがアプリケーションを含めたさまざまな道具を使い、人間に成り代わって判断しながら業務を行なう。そういう世界が見えてきたのです。LLMを部品として埋め込む構図から、LLMが部品を使う側に立つ構図への反転です。

この転換の背景には、Anthropicが2024年11月に公開したMCP (Model Context Protocol) で得られた「LLMを外と繋げば爆発的に生産性が上がる」という体験があります。Claude Codeはこの延長線上で、もっとカジュアルにLLMに外の道具を使わせればMCPより更に効果的であるということを実証してみせました。

つまり、既存の業務システムは無くなりません。LLMエージェントから利用される対象になります。アプリケーションは引き続きそこに存在しますが、操作する主体が人間からエージェントに移る、という関係です。前節の表で操作主体をAIエージェントに置いたのは、まさにこの転換を指しています。

使われ方の面でも構造が変わります。Cloud 1.0までのアプリケーションは「1つのアプリが多数のユーザを捌く」one-to-manyの前提で設計されてきました。コードは共通で、水平スケールでスループットを上げ、コストはユーザ数に対してサブリニアに伸びる構造です。エージェントはこれを反転させ、1ユーザ(あるいは1タスク)に対して専用の実行環境を割り当てるone-to-oneのモデルになります。

| 軸         | Cloud 1.0 アプリ | LLMエージェント  |
| :--------- | :--------------- | :--------------- |
| 実行モデル | one-to-many      | one-to-one       |
| 実行環境   | ユーザ間で共有   | ユーザごとに専用 |
| コスト構造 | サブリニア       | ほぼリニア       |

この「1ユーザに専用環境」という前提が、次節で見るインフラ要件の起点になります。

## Cloud 2.0で必要なインフラ機能

前節で整理したLLMエージェントの4要素と、ユーザ1人に1つの実行環境を割り当てるone-to-oneのモデル。この2つを起点にすると、Cloud 2.0レイヤーが要求するインフラ機能は素直に導けます。

エージェントが実行時に取る活動を一段ずつ分解していくと、それぞれに対応するインフラ機能が見えてきます。

| エージェントの活動                         | 求められるインフラ機能                     |
| :----------------------------------------- | :----------------------------------------- |
| LLMの推論を回し続ける(脳・認識)            | 複数モデルを切り替えられる統合推論レイヤー |
| AIが書いたコードを安全に走らせる(道具)     | ミリ秒で立ち上がる軽量実行環境             |
| 長尺タスクやコーディング作業を進める(道具) | 永続的なフル機能Linux環境                  |
| 社内DBや業務APIに到達する(道具)            | エージェント単位のプライベートネットワーク |
| Webアプリを操作する(道具)                  | マネージドなブラウザ自動化                 |
| 大量のコードを生成・分岐・統合する(道具)   | Git互換の版管理ストレージ                  |
| 状態と過去のやり取りを保持する(記憶)       | コンテキスト外で保持できる永続記憶レイヤー |

ここで効いてくるのがone-to-oneのモデルです。1ユーザに1つの専用実行環境を割り当てるため、表に並べた各機能は「同時に大量に立ち上げ、短時間で捨てる」パターンに耐える必要があります。Cloudflareがブログ「[Welcome to Agents Week](https://blog.cloudflare.com/welcome-to-agents-week/)」で示した試算が分かりやすい例です。米国だけで1億人を超えるナレッジワーカーがそれぞれ数個のエージェントを15%の同時実行率で動かすと、同時セッション数は約2400万、CPU 1基あたり25〜50ユーザを想定すると米国分だけで50万〜100万CPU相当の容量が必要になる、という見積もりです。one-to-many前提の最適化のままでは、この規模には到底届きません。

つまりCloud 2.0レイヤーで必要なのは、上の表に並べたプリミティブを、one-to-oneでも破綻しないコスト構造で提供できるインフラです。次節では、このレイヤーで誰がどう動いているかを見ていきます。

## Cloud 2.0で変わる力関係

CloudflareはAgents Week 2026の発表で、前節で挙げたCloud 2.0要件のすべてに対応するサービスを揃えました。

| 要件(前節の表)                           | Cloudflareサービス | Agents Weekでの発表 | 説明                                                       |
| :--------------------------------------- | :----------------- | :------------------ | :--------------------------------------------------------- |
| 統合推論レイヤー                         | AI Gateway         | ○                   | 拡張(14社・70モデル、Workers AIバインディング追加)         |
| 軽量実行環境                             | Dynamic Workers    | ○                   | 今回発表の目玉。2026年3月24日に有料ユーザーへopen beta開放 |
| 永続Linux環境                            | Sandboxes          | ○                   | GA昇格(active CPU pricing、Outbound Workers等を追加)       |
| エージェント単位プライベートネットワーク | Cloudflare Mesh    | ○                   | 新規発表                                                   |
| ブラウザ自動化                           | Browser Run        | ○                   | 旧Browser Renderingを改名。Live View等を追加               |
| 版管理ストレージ                         | Artifacts          | ○                   | 新規ローンチ                                               |
| 永続記憶レイヤー                         | Agent Memory       | ○                   | プライベートベータ発表                                     |

7要件すべてが新規発表・GA昇格・拡張のいずれかに該当します。Agents Week 2026は、Cloudflareがこのレイヤーへの準備を一気に完了させたイベントとして位置づけられます。

次に、Cloud 1.0を制覇した3強(AWS、Google Cloud、Microsoft Azure)にCloudflareを加えて、同じ7要件のものさしで判定します。判定の3条件は次のとおりです。

1. GA: 一般提供されており、誰でも利用できる(プライベートベータや「未公開」は除外)
2. エージェント特化: 汎用クラウドサービスの流用ではなく、エージェント向けに設計されている
3. 統合プラットフォーム配下: 各社の「エージェントクラウド」ブランドや統合プラットフォームの一部として提供されている

3条件すべてを満たせば○、preview/beta段階なら△、該当サービスなし・汎用流用・受付終了なら×、と判定します。

| 要件                                     | Cloudflare | Google Cloud | Microsoft Azure | AWS |
| :--------------------------------------- | :--------: | :----------: | :-------------: | :-: |
| 統合推論レイヤー                         |     ○      |      ○       |        ○        |  ○  |
| 軽量実行環境                             |     △      |      ○       |        △        |  △  |
| 永続Linux環境                            |     ○      |      ○       |        △        |  △  |
| エージェント単位プライベートネットワーク |     △      |      △       |        △        |  ×  |
| ブラウザ自動化                           |     ○      |      ○       |        ×        |  ○  |
| 版管理ストレージ                         |     △      |      ×       |        ×        |  ×  |
| 永続記憶レイヤー                         |     △      |      ○       |        △        |  ○  |

判定の根拠とした各社のエージェント特化プラットフォーム/主要サービスは次のとおりです。

| 要件                                     | Cloudflare      | Google Cloud                       | Microsoft Azure                  | AWS                                |
| :--------------------------------------- | :-------------- | :--------------------------------- | :------------------------------- | :--------------------------------- |
| 統合推論レイヤー                         | AI Gateway      | Vertex AI Model Garden             | Azure AI Foundry Models          | Amazon Bedrock                     |
| 軽量実行環境                             | Dynamic Workers | Cloud Run / Vertex AI Agent Engine | Azure Container Apps             | Bedrock AgentCore Runtime          |
| 永続Linux環境                            | Sandboxes       | Vertex AI Code Interpreter         | Azure Container Apps             | Bedrock AgentCore Code Interpreter |
| エージェント単位プライベートネットワーク | Cloudflare Mesh | VPC + Vertex AI Agent Engine       | Azure Private Link + AI Search   | (PrivateLink等の汎用流用)          |
| ブラウザ自動化                           | Browser Run     | Vertex AI Browser Tool             | (エージェント特化サービス未確認) | Bedrock AgentCore Browser          |
| 版管理ストレージ                         | Artifacts       | (該当サービス未確認)               | (該当サービス未確認)             | (該当サービス未確認)               |
| 永続記憶レイヤー                         | Agent Memory    | Vertex AI Agent Engine Memory Bank | Azure AI Foundry Memory          | Bedrock AgentCore Memory           |

7要件のものさしで眺めると、Google Cloudはエージェント特化のサービスを最も成熟させています。CloudflareはAgents Week 2026で全領域を埋め、×は出していません。Microsoft Azureはエージェント特化の統合プラットフォームとしてはpreview段階のサービスが多い印象です。AWSはBedrock AgentCoreファミリー(Runtime / Memory / Code Interpreter / Browser / Gateway / Identity / Policy / Evaluations / Observability)でレイヤー横断のサービスを揃えています。特に2026年4月にAgentCore BrowserがOS-levelアクションを追加したことで、ブラウザ自動化は他社と並ぶ水準に到達しています。一方で、エージェント単位のプライベートネットワークとGit互換の版管理ストレージという2領域では、AgentCoreファミリーに対応するプリミティブが現時点で確認できません。

Cloudflareがone-to-one前提の課金モデル(Dynamic Workersのper-load課金、Sandboxesのactive CPU pricing)とisolateベースのms起動を統合的に提供しているのに対し、AWSはAgentCore側で個別プリミティブを揃える方向で追いついている段階です。Cloud 1.0期に確立した汎用プリミティブ(EC2、Lambda、VPC、IAM)はone-to-many前提で設計されていたため、one-to-oneのワークロードに対しては個別最適の積み上げで対応している、と位置づけられます。

Cloud 1.0時代、CDNとセキュリティのベンダーとして3強の外側に置かれていたCloudflareが、Cloud 2.0レイヤーでは3強と肩を並べる側へ上がってきました。Cloud 1.0はAWSが制覇したレイヤーでしたが、Cloud 2.0ではプレイヤーの力関係がリセットされるステージです。

## 主戦場は業務リエンジニアリングへ

エンタープライズはCloud 1.0の世界を捨てる必要はありません。基幹システムやSaaSバックエンドはAWS中心の運用を続ければよく、その領域でのインフラ・アーキテクチャの設計力はこれからも継続して必要です。

ただしCloud 2.0レイヤーは別の判断軸で組む必要があります。Cloud 1.0期に確立したベンダー選定の前提がそのままでは通じないからです。前節で見たとおり、Cloud 2.0ではGCPが先行、Cloudflareが追いつき、AzureとAWSは個別サービスを揃えつつも統合プラットフォームとしては道半ばです。「Cloud 1.0と同じベンダーで揃える」という発想を出発点にすると、コスト構造とプリミティブの噛み合わせで不利な選択を踏みやすくなります。

そしてCloud 2.0レイヤーで主戦場になるのは、インフラ・アーキテクチャではありません。プラットフォーム側がプリミティブを統合提供している以上、何をどう組み合わせるかが大きな差別化要因にはなりません。

ここで主戦場となるのは、業務プロセスをエージェント向けに再設計し、エージェントのスキルとして実装できる人材です。Cloud 1.0時代に「AWS特化のインフラ設計者」が握っていた価値の中心は、Cloud 2.0では「業務とエージェントの間を設計できる人」に移ります。

エンタープライズが今着手すべきは、エージェントが代替・補強できる業務プロセスの棚卸しと、それをエージェントに落とし込むケイパビリティの社内構築です。Cloud 2.0プラットフォームの選定は、その準備の一部であって目的ではありません。

## References

- Cloudflare. [Welcome to Agents Week](https://blog.cloudflare.com/welcome-to-agents-week/) (米国ナレッジワーカー試算の出典)
- Cloudflare. [Building the agentic cloud — Agents Week in Review](https://blog.cloudflare.com/agents-week-in-review/) (発表総まとめ)
- Cloudflare Developers. [Dynamic Workers open beta](https://developers.cloudflare.com/changelog/post/2026-03-24-dynamic-workers-open-beta/) (2026年3月24日open beta開放)
- Cloudflare. [Agents have their own computers with Sandboxes GA](https://blog.cloudflare.com/sandbox-ga/)
- Cloudflare. [Browser Run for AI Agents](https://blog.cloudflare.com/browser-run-for-ai-agents/)
- Cloudflare. [Introducing Agent Memory](https://blog.cloudflare.com/introducing-agent-memory/)
- Cloudflare Press. [Cloudflare Launches Mesh](https://www.cloudflare.com/press/press-releases/2026/cloudflare-launches-mesh-to-secure-the-ai-agent-lifecycle/)
- Anthropic. [Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) (2024年11月公開)
- AWS. [Amazon Bedrock AgentCore](https://aws.amazon.com/bedrock/agentcore/) (Runtime / Memory / Code Interpreter / Browser / Gateway / Identity / Policy / Evaluations / Observability)
- AWS. [AgentCore Browser adds OS-level interactions](https://aws.amazon.com/about-aws/whats-new/2026/04/agentcore-browser-os-actions/) (2026年4月8日)
