---
title: "Claude Platform on AWSに見る新時代のハイパースケーラー"
emoji: "☁️"
type: "idea"
topics: ["AWS", "Anthropic", "Claude", "Cloud", "AI"]
published: true
published_at: 2026-05-13 20:00
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/05/claude-platform-aws/) からの転載です。
:::

## TL;DR

2026年5月11日にGA(General Availability、一般提供)された「Claude Platform on AWS」は、AnthropicのClaudeをAWSアカウントから直接呼べる新サービスです。発表が示すのは機能追加というより、AIサービスにおけるAWSの立ち位置の構造的な変化です。

- 推論はAnthropic基盤で動き、データもAWS境界の外で処理される。引き換えにAnthropic本家と同等の最新機能がリリース同日(Day-0)から使える
- AWSは認証・請求・監査の窓口に徹する構造。Bedrockのようにモデル運用主体としては立たない
- AWSの役回りが「推論を自社運用する側」から「外部ベンダーの推論を企業へ売る窓口」へ広がる兆候として読める
- 提案現場では、データ境界、機能追随速度、ベンダー多様性という軸を軸にBedrockとClaude Platform on AWSを使い分ける整理が必要になる

## はじめに

2026年5月11日、AnthropicとAWSは「Claude Platform on AWS」を一般提供開始しました。Anthropic本家のMessages APIやConsoleの体験そのものを、AWSアカウントから直接利用できる新しい入口で、東京リージョンも初日から対応しています。ただし本稿で読み解きたいのは、機能の追加そのものではなく、この発表が示すAWSの立ち位置の構造的な変化です。Bedrockとの違い、Cloud 2.0レイヤーでの位置づけ、AWS提案の現場への影響という3つの角度から見ていきます。

## Claude Platform on AWSとは何か

新サービスの概要は次のとおりです。Anthropicが運用するClaude Platformそのものを、AWSアカウントの認証情報と請求経路を介して利用できるようにしたものです。利用者から見えるエンドポイントもSDKの作法も、Anthropic本家のそれとほぼ共通しています。

具体的には、SDKに `ANTHROPIC_BASE_URL=https://aws-external-anthropic.<region>.api.aws` と `anthropic-workspace-id` ヘッダーを設定するだけで、Anthropic向けに書いたコードがそのままAWS経路で動きます。認証はAWSのIAM資格情報で行ない、別途Anthropicアカウントを取る必要はありません。利用料はAWS Marketplace経由で計上され、Cost Explorerでモニタリングでき、Enterprise Discount ProgramなどのAWSコミット消化対象にもなります。

使える機能はAnthropic本家とほぼ同等です。Messages APIから最新のエージェント関連機能まで一通り揃い、モデルもClaude Opus 4.7、Sonnet 4.6、Haiku 4.5を同日提供しています。新モデルや新機能がリリース当日(Day-0)から使えるという点こそ、これまでBedrock側の取り込みを待たされてきた構図が崩れた、今回の本質的な変化です。

監査はCloudTrailのManagement Eventsがデフォルトで記録され、推論呼び出しそのものはオプションでData Eventsとして流せます。

:::message
Workspaceは、APIキー・権限・課金・月次上限を環境やチーム単位で分離できる、Anthropic Console固有の論理単位です。
:::

もう一点、Workspaceという新しい概念が入りました。これはプロジェクト・環境・チームを切り分けつつ請求単位も分けられるIAMリソースで、Anthropic Consoleにあるワークスペースの仕組みをAWS IAMの語彙で組み込んだものです。

## Bedrockと何が違うのか

AnthropicのモデルならBedrock経由で既に使えるのに、なぜ別の経路を用意したのか。本サービスをBedrockと比較したときのPros/Consは次のとおりです。

- **Pros**: AWSの統制・監査基盤の上で、Anthropic本家とほぼ同等の機能と最新モデルをDay-0で使える
- **Cons**: データがAWS外で扱われるため別建てのデータ管理が必要になる。加えてClaude専用のため、マルチモデル戦略は取れない

機能面の違いを並べると次のとおりです。

| 観点                                | Amazon Bedrock         | Claude Platform on AWS |
| :---------------------------------- | :--------------------- | :--------------------- |
| 推論データの処理者・処理境界        | AWS(AWS境界内)         | Anthropic(AWS境界外)   |
| 新モデル・新機能の追随              | 数週〜数か月遅れ       | Day-0で揃う            |
| モデルベンダー多様性                | 多ベンダー(十数社)     | Claudeのみ             |
| AWS IAM / Marketplace / CloudTrail  | 統合あり               | 統合あり               |

違いは大きく分けて、データの境界と機能の追随速度という2点に集約できます。

Bedrockの構造では、AWSが推論基盤までを自社で運用し、データ処理者としての責任を負います。推論はAWSのセキュリティ境界の内側で行われ、入力データはAnthropicへは共有されません。推論にAWSのデータ統制を要求するエンタープライズ用途に向いた構造です。

一方、Claude Platform on AWSは、認証と請求と監査こそAWSが提供しますが、推論サービス自体はAnthropicが運用する基盤で動きます。データはAWSのセキュリティ境界の外側、Anthropicの管理下で処理されます。この差はコンプライアンス上、本質的です。データレジデンシーやAWS境界内処理を契約で求めている組織には、Bedrockのほうが依然として現実解です。

逆に、Anthropicが最新モデルや新機能をリリースした瞬間からそれを使いたい組織には、Claude Platform on AWSが勝ります。Bedrockでは、Anthropic本家のAPIで先行した機能(extended thinkingやFiles APIなど)が、AWS側のコモディティ化を経て登場するまで数週間から数か月のラグが生じることも珍しくありませんでした。今回のサービスは、その間隙を埋める性格のものです。

選択軸が「データ境界と機能の速さ、どちらを優先するか」に整理されてきたことが分かります。

## AIサービスにおけるAWSの役回りの変化

ここからが本稿の本題です。新サービスを技術仕様として眺める以上に、AWSがどんな役回りを引き受けたのかという視点で見るほうが示唆に富みます。

Claude Platform on AWSが構造的に行っているのは、レイヤーの分離です。推論というサービス本体はAnthropicの外部基盤に置きつつ、認証(IAM)、請求(Marketplace)、監査(CloudTrail)、コミット消化といった企業ガバナンスの足回りだけをAWSが提供しています。

この構造は、Cloudflare Workersに `ANTHROPIC_API_KEY` を環境変数で渡して、Anthropic本家のAPIを叩いているのと本質的に変わりません。違いは、認証がAPIキーではなくIAMで、請求がクレジットカードではなくAWS請求書で、ログがWorkers TraceではなくCloudTrailであることです。エンタープライズの調達と監査の要件を満たすかどうかという、その一点だけが違います。

ここでAWSが押さえている価値は、コンピュートやストレージではありません。請求と身元と監査ログを束ねる「企業の窓口」としての地位です。AWSはこれまで、Cloud 1.0期に積み上げた抽象化レイヤー、つまりEC2やS3やLambdaといったプリミティブで稼いできました。今回はそれと並行して、自社では運用していない外部の推論サービスの請求と統制を引き受けるという、新しい収益面を開いています。

これは戦略的譲歩なのか、新収益モデルなのか。私の見立ては、両面を同時に成立させる賢い設計、というところです。譲歩の側面はあります。AnthropicのモデルをBedrockに統合してきたこれまでの路線とは異なり、推論基盤の主導権をAnthropic側に残したまま窓口だけ引き受ける形だからです。一方でAWSは、Enterprise Discount Programの消化先を増やせますし、新モデル待ちでAWSを離れる顧客を引き留められます。失う主導権の代わりに、エンタープライズの窓口という地位を補強する取引です。

## Cloud 0.5/1.0/2.0で見るとどこに位置するか

[以前の記事](https://zenn.dev/yostos/articles/cloudflare-cloud-2-0)で、Cloudの時代区分を「Cloud 0.5(仮想化インフラ)」「Cloud 1.0(Cloud Native)」「Cloud 2.0(Agentic Cloud)」の3段で整理しました。Claude Platform on AWSはこの枠組みのどこに位置づけられるでしょうか。

:::message
本記事における「Cloud 2.0」の定義について。LLMエージェントがCloudのワークロードの主役となる新しいレイヤーを指す、本記事独自の用語として用います。
:::

Cloud 1.0期のハイパースケーラーは、抽象化レイヤーの提供者でした。物理インフラを覆い隠して、IAMやVPCやマネージドサービスといったプリミティブを通じて開発者に売る役割です。AWSがその役割で群を抜いたことが、Cloud 1.0時代の覇権をもたらしました。

Cloud 2.0期に入ると、ワークロードの主役はLLMエージェントになります。エージェントは、推論基盤、軽量実行環境、永続記憶、版管理ストレージといったプリミティブを使い倒します。ここで重要なのは、これらのプリミティブを必ずしも一社で提供する必要はないという点です。エージェントは複数のサービス境界を越えて動きますし、エンタープライズが推論をAnthropicに、実行環境をCloudflareに、ストレージをAWSにというような組み合わせを選ぶことも当たり前になりつつあります。

そう考えると、前節で論じたAWSの役回り変化は、Cloud 2.0レイヤー全体に起きている地殻変動の一場面として位置づけられます。Cloud 1.0期に培った企業ガバナンス基盤を、自社で運用しない外部の推論サービスにも貸し出す。これが今、Cloud 2.0レイヤーでハイパースケーラーが取りうる役回りのひとつで、Bedrockを併存させているのは内製と外部窓口の両方をAWSが押さえにいくという意思の表れです。

## AWS提案の現場で起きる変化

ここから少し業界寄りの話です。AWSのソリューション提案を生業にしてきた人々への影響を見ておきます。

これまでのBedrock案件では、「Anthropic、OpenAI、Meta、Mistralを統一APIで使い分けられる」というマルチモデル統合の価値が前面に出てきました。データレジデンシーやIAM統合と並んで、Bedrockを選ぶ理由のひとつとして語られてきた論点です。

Claude Platform on AWSの登場は、このうち「Anthropicの最新モデルを使いたい」という需要を、Bedrock以外で吸収できることを意味します。Claudeしか使わないユースケースに対しては、「Bedrockでマルチモデルを集約する」という売り文句の説得力が下がります。同じAWSの中に、Anthropic直叩きと変わらない経路が用意されたからです。

提案のロジックも組み替えが要ります。要件ごとの選択は次のように整理できます。

- データレジデンシーやAWS境界内処理が契約上の必須要件 → Bedrock
- Day-0でClaudeの新機能を使いたい、またはWorkspace単位の請求分離が必要 → Claude Platform on AWS
- 複数モデルベンダーをユースケース別に使い分けたい → Bedrock
- ClaudeとOpenAIの両方を本家経路で使いたい → BedrockとClaude Platform on AWSの併用

選択軸が一段細かくなりました。

元AWS ProServeの目で見ると、これは案件の議論を健全にする方向の変化です。Bedrockを「とりあえずの安全牌」として薦める提案には、本来の要件と噛み合わないものが含まれていました。選択肢が増えたことで、データ境界要件か機能の追随速度かを正面から議論できるようになります。

逆に、SI側の付加価値の置き場所は前より難しくなります。「マルチモデル統合のための設計」だけでは差別化が薄まり、業務要件を踏まえてどちらの経路を選ぶか、両者をどう使い分けるかという、より上位の意思決定支援に価値が移っていきます。Cloud 1.0期にインフラ選定で稼いだロジックは、Cloud 2.0期には設計者・選定者の判断力という形に少しずつ姿を変えています。

## Anthropicのキャパシティ戦略との符合

最後に、Anthropic側からこの取引を眺めておきます。

Anthropicは2026年に入ってから、AWSと$100Bを超える複数年コンピュート契約を交わし、5GW級のTrainium容量にコミットすると発表しています。一方でMicrosoft AzureやGoogle Cloudとも並行して提携を結んでおり、推論キャパシティを複数のハイパースケーラーに分散させる戦略を取っています。

:::message
TrainiumはAWSが自社開発するAI学習・推論用カスタムチップです。Nvidia GPUへの依存を減らす狙いがあり、Anthropicの大型契約はその外販ボリュームの一翼を担います。
:::

このキャパシティを最終的に消費するのは、世界中のエンタープライズが回す推論ワークロードです。Anthropic本家APIだけでは、その消費を支えるだけの調達経路を企業に提供しきれません。クレジットカードでの直接契約は、ガバナンスの観点でエンタープライズが選びにくい経路だからです。

Claude Platform on AWSは、Anthropicからすれば「エンタープライズの調達窓口」を一気に拡張する装置です。AWSアカウントを持っている企業の調達担当は、新しいベンダーを通すことなく、既存のMarketplace経由でClaudeを使い始められます。Anthropicは推論基盤の主導権を保ったまま、AWSのエンタープライズ顧客基盤に直結できます。

AWS側から見れば、AnthropicがTrainiumに払うコンピュート料金が、別経路でエンタープライズ向けの推論売上として戻ってきます。Anthropicが請求の上流、AWSが下流という関係です。両者は競合ではなく、調達面で組み合っている構造になっています。

ここまで読むと、Claude Platform on AWSは単発のサービス発表というよりも、Anthropicの分散キャパシティ戦略とAWSの窓口ポジション戦略が噛み合った結果として出てきた仕組みであることが見えてきます。

## まとめ

Claude Platform on AWSは、機能カタログの一行というよりも、ハイパースケーラーの役回りが変わりつつあることを示す構造的なサインだと感じています。

Bedrockがそうであるように、AWSは引き続き「自社の推論基盤を売る側」でもあります。同時に、外部ベンダーの推論サービスに対して「請求と身元と監査の窓口」を引き受ける役割も併せ持つようになりました。Cloud 1.0期に培った企業ガバナンスの足回りが、Cloud 2.0期では別のベンダーの実行レイヤーを支える土台として再利用されています。

エンタープライズの調達担当やSIの提案担当にとっては、選択肢が増えた分だけ判断軸を明確にする必要が出てきます。データ境界要件か、機能の追随速度か、ベンダー多様性か。それぞれの要件に対して、Bedrock、Claude Platform on AWS、あるいは両者の併用という選択を素直に評価できるようになりました。

今後、同じ仕組みでOpenAIやGoogleがAWS上に乗ってくる可能性も含めて、ハイパースケーラーの窓口化はゆっくりと進む流れだと見ています。Cloud 2.0期にAWSがどの地位を確保するのか、その答えのひとつがこの発表に入っているのではないでしょうか。

## References

- AWS Machine Learning Blog. [Introducing Claude Platform on AWS, Anthropic's native platform through your AWS account](https://aws.amazon.com/blogs/machine-learning/introducing-claude-platform-on-aws-anthropics-native-platform-through-your-aws-account/)
- AWS. [Claude Platform on AWS](https://aws.amazon.com/claude-platform/) (製品ページ)
- AWS What's New. [Claude Platform on AWS is now generally available](https://aws.amazon.com/about-aws/whats-new/2026/05/claude-platform-aws/)
- Anthropic. [Anthropic and Amazon expand collaboration for up to 5GW of Trainium compute](https://www.anthropic.com/news/anthropic-amazon-compute) (2026年4月20日)
- About Amazon. [Amazon and Anthropic expand strategic collaboration](https://www.aboutamazon.com/news/company-news/amazon-invests-additional-5-billion-anthropic-ai)
