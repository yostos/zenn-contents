---
title: "Google Cloud Generative AI Leader（GAIL）認定を4時間の学習で取得する"
emoji: "🏅"
type: "tech"
topics: ["GoogleCloud", "生成AI", "資格", "Gemini", "VertexAI"]
published: true
published_at: 2026-09-02 09:00
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/09/gail-certification/) からの転載です。
:::

![カバー画像](/images/google-cloud-gail-certification/cover.webp)

2025年5月からGoogleが提供している **[Google Cloud Generative AI Leader（GAIL）](https://cloud.google.com/learn/certification/generative-ai-leader?hl=ja)** (以下、GAILと記載)を受験し合格できました。1週間ほど前にAWS Certified Generative AI Developer - Professional (AIP-C01)を取得した後、思いつきでGAILの受験を申込んだものです。学習時間は準備期間を含めて4時間程度でした。

試験対策で資料をまとめたので、GitHubで公開しています。

## GAILとはどういう試験か

GAILは2025年5月14日に提供が始まった認定です。Google Cloudの認定体系ではCloud Digital Leaderと同じ基礎レベルに置かれていて、前提となる資格や実務経験は必要ありません。

問われるのは、生成AIをビジネスにどう使うかという戦略と判断です。設定手順やコードは出題されません。求められる製品知識も、要件に対してどの製品を選ぶかというビジネスレベルの深さにとどまります。

| 項目     |                                     内容 |
| -------- | ---------------------------------------: |
| 出題数   |                                 50〜60問 |
| 出題形式 |                   多肢選択式（択一のみ） |
| 試験時間 |                                     90分 |
| 受験料   |                           99 USD（税別） |
| 提供言語 |   英語、日本語、スペイン語、ポルトガル語 |
| 実施形式 | オンライン監督付き または テストセンター |
| 前提条件 |                                     なし |
| 有効期間 |                                      3年 |

出題形式は択一選択問題だけです。正解を2つ以上すべて選ぶ複数選択問題はありません。並べ替えやマッチングの形式もないので、解答操作に慣れておく手間がかかりません。AIP-C01には複数選択問題がありましたから、この点はGAILのほうが素直です。

出題範囲は4つのセクションに分かれています。

| セクション                                      |  配点 |
| :---------------------------------------------- | ----: |
| 1. 生成AIの基礎                                 | 約30% |
| 2. Google Cloud の生成AI製品                    | 約35% |
| 3. 生成AIモデル出力を改善する手法               | 約20% |
| 4. 生成AIソリューションを成功に導くビジネス戦略 | 約15% |

基礎と生成AI製品で65%を占めます。生成AIの一般的な概念を押さえたうえで、要件からGoogle Cloudの製品を引けるかどうかが得点の中心です。

学習で一番戸惑ったのは製品名でした。例えば、Vertex AIはGemini Enterprise Agent Platformに、Vertex AI SearchはAgent Searchに改称され、試験ガイドは現行の名称で書かれています。一方で公式模擬試験はVertex AIのまま出題されていました。本番でどちらの名称が使われるか分からないので、一応両方を覚えておくようにしました。

## 私のプロフィール

読者が自分との距離を測れるように、私の前提を書いておきます。

私は元AWSコンサルタントです。Associateレベルの3つの認定を持ち(内2つはExpireしています)、数年の実務経験があります。

生成AIはClaude Codeを常用しており、Anthropic、OpenAI、Google Cloud、VoyageなどのAPIを使用するツールは書いています。AWS Certified Generative AI Developer - Professional (AIP-C01)を取得したばかりです。

Google Cloudに関しては2024年にGoogle Cloud Digital Leaderを取得した程度で、AWSと比較するとほぼ使用していません。

## 使った教材と学習の進め方

教材は公式のものだけです。使ったのは次の3つでした。

- [公式試験ガイド](https://services.google.com/fh/files/misc/generative_ai_leader_exam_guide_english.pdf)（PDF、英語）
- 公式模擬試験（Googleフォームで提供される。日本語版もあり、認定ページからたどれる）
- Google Cloudの製品ドキュメント

やったことは単純で、試験ガイドと模擬試験を通して引っかかった製品を公式ドキュメントで確認し、その内容をClaude Codeに渡してAsciiDocのノートに積み上げただけです。[AIP-C01のとき](https://zenn.dev/yostos/articles/aws-genai-developer-aip-c01)と同じやり方です。

そこに、Google Cloudの製品とAWSのサービスの対応を追記しました。下表のように並べておくと、AWS側の知識をそのまま流用できます。私のようにAWSから来る人にとっては、製品名を単体で覚えるより速い方法だと思います。

![GCPとAWSの対比表の一部](/images/google-cloud-gail-certification/gcp-aws-mapping.webp)
_ノートの付録に置いたGCP↔AWS対比表（抜粋）_

まとめたノートはGitHubで公開しています。PDFとHTMLをReleasesに置いてあります。

https://github.com/yostos/gail-materials

:::message
**個人の学習ノートです。** 私が自分の理解を整理するために書いたものであり、Google LLC が作成・監修・承認したものではありません。記載内容の正確性は保証しません。判断に使う前に、公式の試験ガイドと製品ドキュメントで一次情報を確認してください。
:::

学習時間はノートをまとめる時間を含めて4時間程度です。試験前に一度読み返しました。

## 試験当日と結果

会場はテストセンターです。試験時間は90分で、私が受けた回の問題数は45問でした。公式には50〜60問と案内されているので、回によって振れ幅があるようです。実際にかかったのは見直しと終了後アンケートを含めて15分程度でした。

提出すると画面に暫定の合否が表示されるようです。私はそれに気付かないまま終了操作を進めてしまいました。**うっかり見過ごしやすい**ので、最後の画面は落ち着いて読んでください。正式な結果はGoogle Cloud側の確認を経て、7〜10日で確定します。

数日は待つものと諦めていたのですが、Credlyから試験終了の30分後にはバッジが確認できました。

出るのは合否だけで、AWSのようなスコアもセクション別の評価もありません。

## 誰にとって価値のある認定か

体感では、エンジニアであれば半日程度の学習で余裕を持って取れます。生成AIを日常的に触っている人なら、実質的に覚えるのはGoogle Cloudの製品名と、それぞれがどの要件に対応するかの対応表だけです。

そのうえで、この認定が向いているのは、生成AIの導入を企画したり予算を通したりする側の人です。技術者と会話するための共通語彙を短時間で揃えられます。逆に、実装する側のエンジニアがGoogle Cloudでの生成AI開発力を示す材料にはなりません。

生成AIに特化したGoogle Cloudの認定は、これまでGAILだけでした。ここが2026年9月に変わります。**[Professional Agentic Architect](https://cloud.google.com/learn/certification/agentic-architect)** のベータ登録が9月3日に始まります。Google Cloud上で自律的なエージェントのワークフローを設計・運用する技術者向けの認定で、Pearson配信の約80問・3時間の多肢選択試験に加えて、Google Skills上のハンズオンラボの両方に合格する必要があります。ベータの受験料は120 USD、提供言語は英語のみ、有効期間は1年です。

現役のエンジニアであれば、GAILではなくこちらを狙う価値があります。

## まとめ

- 学習は、公式試験ガイド、公式模擬試験、製品ドキュメントで足りる
- 得点の中心は、要件からGoogle Cloudの製品を引けるかどうかである
- 製品名は改称の途上にある。新旧を対にして覚えておく
- AWS経験者は、AWSのサービスとの対応表を作るのが速い
- 実装する側のエンジニアは、ベータ版でもProfessional Agentic Architectにチャレンジすべき。生成AIがあるいま、英語はハードルではない

思いつきで申し込んだ試験でしたが、Google Cloudの生成AI製品を要件から引ける形で一度整理できたのは収穫です。AWSとGoogle Cloudで、同じ課題に対する解き方の並びがきれいに対応することも確認できます。

生成AIの主導権を握っているのは米国のプラットフォーマーで、日本のベンダーにはありません。案件の基盤がAWSになるかGoogle Cloudになるか、あるいはOpenAIのAPIを直接叩くことになるかは、エンジニアの側では選べず、プロジェクトごとに変わります。ひとつを深く知っているだけでは足りません。どれが来ても要件から製品を引ける程度には、それぞれを知っておくことが、これからは効いてくると思います。

## References

- [Google Cloud](https://cloud.google.com/learn/certification/generative-ai-leader?hl=ja). "Generative AI Leader認定資格"
- [Google Cloud](https://services.google.com/fh/files/misc/generative_ai_leader_exam_guide_english.pdf). "Generative AI Leader Certification exam guide"
- [Google Cloud](https://www.skills.google/paths/1951). "Generative AI Leader Certification（学習パス）"
- [Google](https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/generative-ai-leader-certification/). "Become a certified Generative AI Leader with a first-of-its-kind credential from Google Cloud"
- [Google Cloud](https://support.google.com/cloud-certification/answer/9438208?hl=ja). "Google Cloud認定資格に関するよくある質問"
- [Google Cloud](https://cloud.google.com/learn/certification/agentic-architect). "Professional Agentic Architect Certification"
