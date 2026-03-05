---
title: 'AIエージェントが"同僚"になる時代 ── AWS ProServe変革と日本のSIerへの示唆'
emoji: "🤖"
type: "idea"
topics: ["AI", "AWS", "SI", "ITコンサルティング", "ProServe"]
published: true
---

:::message alert
筆者は2021〜2024年にAWS ProServeに在籍していましたが、本記事は公開情報（Business Insiderの報道等）および筆者の個人的な所感に基づいており、AWSの機密情報を開示するものではありません。記載内容は筆者個人の見解であり、AWSの公式見解を代表するものではありません。
:::

## TL;DR

次のBusiness Insiderの記事に基づいた考察です。

AWS ProServeがAIエージェントを「デジタル従業員」としてプロジェクトに組み込み、75%をFixed Price化する方針を打ち出しました。AIをツールでなく「要員」にする転換です。人月で価値を語ってきた日本のSIerは、成果で問われる時代への備えが急務です。

https://www.businessinsider.com/amazon-aws-cloud-customers-proserve-consulting-fees-ai-automates-work-2026-2

## AWS ProServeとは

AWS ProServeとはAWSの技術支援サービスです。

AWSのユーザーにとっては、「SA」（Solutions Architect）と呼ばれる無償の技術支援のほうが馴染み深いかもしれません。一方、AWS ProServe（Professional Services）は、有償の支援サービスです。

AWSの公式エキスパートが顧客のチームに入り、一緒にプロジェクトを成功させるコンサルティング部門です（ProServeについては[こちらの解説記事](https://note.com/jazzy_slug5355/n/n6d3fa6120c79)が分かりやすいです）。クラウド移行やモダナイゼーションといった技術コンサルティングに加え、DX戦略の策定やビジネス変革の支援まで幅広く対応しています。単なる代行ではなく、顧客が自らAWSを使いこなせるようになる「自走支援」に重点を置いている点が特徴です。

ProServeはAWSの収益創出に大きく貢献しています[^1]。内部文書によれば、売上1,290億ドル（2025年）のAWSを10年以内に5,000億ドル企業へ押し上げるドライバーとしてProServeを位置づけており、その重要度は増す一方です。

筆者は2021年から2024年まで日本のProServeに在籍していました。日本のProServeはまだ規模が小さく、米国本体に比べれば発展途上の組織です。しかしその分、一人ひとりの守備範囲が広く、技術・ビジネス両面で顧客に向き合う経験を積める環境でした。ProServeの役割は年々広がっており、技術支援にとどまらずビジネス変革の伴走へ変化してきたことを肌で感じていました。そのProServeが今、AIによってさらに大きく変わろうとしています。

## AIを「デジタル従業員」にするという衝撃

Business Insiderが入手したProServeの内部文書によると、方針の核心はシンプルです。AIエージェントを「**デジタル従業員（digital employees）**」と位置づけ、人間と同列の要員としてプロジェクトに組み込むというものです。

生成AIを便利なツールとして活用する企業は既に多くあります。筆者の古巣であるIBMも、[以前の記事](https://zenn.dev/yostos/articles/ibm-cobol-claude-irony)で取り上げたAIエージェント「IBM Bob」を社内10,000人超の開発者に展開しています。McKinseyのCEO Bob Sternfelsは、40,000人の人間の従業員に加え25,000のAIエージェントを「従業員」として数えていると発表しました。検索・分析タスクだけで年間150万時間を削減し、6か月で250万枚のチャートを生成したとしています。2026年末までにAIエージェント数を人間の従業員数と同数にする目標も掲げています。ただし、このエージェント数を誇るアプローチに対しては懐疑的な声もあります。競合のEYは「エージェント数が価値に直結するわけではない」、PwCのチーフAIオフィサーも「誤った測定基準だ」と指摘しています。PwC、EY、Boston Consulting Groupも含め、各社がAIエージェントの活用を進めてはいるものの、その位置づけはあくまで「人間の生産性を高めるツール」にとどまっています。

Business Insiderの報道が正しければ、ProServeが一線を画すのは、AIを「ツール」ではなく「デジタル従業員」として組織に位置づけようとしている点です。内部文書には具体的に以下のような施策が記載されていたとされています。

- 「Agentic AI」専任チームの設立と「Agent Operating Model」の導入
- AI Agent Service and Marketplaceの構築による、エージェントの開発・配備・管理の組織化
- 特定タスクの最大90%自動化を見込んだ生産性目標
- 人員を大幅に増やさず、従業員あたり収益を前年比20%増とする計画

実際、AWSは2025年11月に「[AWS Professional Service Agents](https://aws.amazon.com/blogs/machine-learning/accelerate-enterprise-solutions-with-agentic-ai-powered-consulting-introducing-aws-professional-service-agents/)」を公式に発表し、agent-first consultingの取り組みを公にしています。AWS Professional Services Delivery Agentは、提案書の作成を数週間から数時間に短縮し、生成AIアプリ開発プロジェクトの所要期間を6〜8週間から数日に圧縮したとされています。大規模な移行プロジェクトでも、従来12か月以上かかっていた期間を数か月に短縮できるとしています。

つまり、これは内部文書のリークだけの話ではなく、AWS自身が公式に推進している方針なのです。**プロジェクトの体制表に人間コンサルタントとAIエージェントが並ぶ**。これはツール導入の延長線上にはない、組織設計そのものの転換です。

この動きが日本のSIer・コンサルティング会社に示唆するものは大きいです。記事によれば、Booking.comやDanske Bankは既にProServeに対し「AI-delivered pricing」（AI前提の低価格）での契約再交渉を求めているとのことです。こうした圧力は遅かれ早かれ日本にも波及するのではないでしょうか。

ここで筆者が強く懸念しているのは、日本のSIer業界に根深い「人月モデル」の問題です。日本のSIerの多くは契約形態としては請負契約を採用していますが、実態としては人月単価を積み上げて見積りを作り、それを顧客への価値訴求の根拠としています。つまり「エンジニアが何人月かかるか」が価格の正当性そのものになっている構造です。

AIエージェントが要員として組み込まれ、同じ成果をより少ない人間の稼働で出せる時代になったとき、この価値訴求は成り立つでしょうか。「人が何人月かけたか」ではなく「どんな成果を出したか」で価値を問われるようになれば、人月を積み上げる以外の方法で自社のサービスの価値を顧客に説明できなければなりません。それができる日本のSIerがどれだけあるのか。筆者は正直、心許なく思っています。

AIエージェントを要員としてデリバリーに組み込む体制を前提としている日本の企業は、まだほとんどありません。ProServeの動きが本格化すれば、日本のSIer・コンサルティング会社にとってパラダイムシフトの始まりになり得ると筆者は考えています。

## 準委任からFixed Priceへの転換に思うこと

もう1つ、元ProServe社員として見過ごせない変化があります。課金モデルの転換です。

ProServeの内部文書は、2026年までにプロジェクトの75%をFixed Price（固定価格）にする目標を掲げていました。

AWS ProServeでは従来、準委任契約（Time & Materials）が主流でした。準委任は想定稼働時間にコンサルタント単価を掛けるシンプルな構造で、提供者側のリスクが比較的低いモデルです。それが75%をFixed Priceにするというのは、組織文化の根本的な転換を意味します。

顧客側の論理は明快です。「AIが作業を高速化・自動化しているのに、なぜ同じ料金を払わなければならないのか」。この問いに、成果で応えるモデルへ移行せざるを得なくなっているのです。

Fixed Priceへの移行は、提供者側に大きな能力変革を要求します。緻密なスコープ定義、正確な工数見積り、リスク管理、そしてビジネスケースの算出が不可欠です。筆者は日本IBM出身ですが、IBMのサービス事業では請負契約が主流であり、こうした見積り・リスク管理の規律が組織に染みついていました。一方、ProServe在籍時に感じていたのは、準委任が主流の環境ではそうした規律が育ちにくいということです。技術力は高くても、プロジェクトを経営的に組み立てる力は別物です。

ただし、ProServeには技術力の高さと、顧客の自走を支援するという明確なミッションがあります。この強みは、AI時代にも変わらない価値です。AIエージェントという新たな「要員」を得たことで、技術力を活かしながら成果ベースのデリバリーに挑む。ProServeの変革は、技術集団が経営的視点を獲得していく過程でもあると筆者は見ています。

## まとめ

Business Insiderが報じたProServeの変革は、2つの点で従来のAI活用と次元が異なります。

1つ目は、AIエージェントを「ツール」ではなく「デジタル従業員」として組織に位置づけたこと。2つ目は、それに伴い課金モデルを準委任からFixed Priceへ転換しようとしていることです。

日本のSIer・コンサルティング業界にとって、この報道は他人事ではありません。人月単価の積み上げで価値を訴求してきた従来のモデルは、AIが要員になる時代には通用しなくなる可能性があります。「何人月かけたか」ではなく「どんな成果を出したか」で問われる時代に、自社のサービスの価値をどう説明するのか。その問いに向き合う時期が来ていると感じています。

では、私たちは何から始められるでしょうか。筆者は3つのことを考えています。

- まず、自分たちの提供するサービスの価値を「人月」ではなく「成果」で言語化してみること。これは個人レベルでも今日から始められる
- 次に、AIエージェントを「便利なツール」ではなく「チームメンバー」として扱うプロジェクト運営を小さく試してみること。AIに任せられるタスクを洗い出し、人間とAIの役割分担を設計する経験は、来るべき変化への備えになる
- そして、技術力だけでなく、スコープ定義や見積り、ビジネスケースの組み立てといった「プロジェクトを経営する力」を意識的に磨くこと

ProServeの変革が示しているのは、AIの進化によってコンサルティングの価値の源泉が変わるということです。変化は脅威でもあり、機会でもあります。早く動いた者が、次の時代のスタンダードを作ることになるでしょう。

<!-- textlint-disable -->

[^1]: Business Insiderが入手した内部文書によると、ProServeのコンサルティング業務は2024年にAWSの約125億ドルの収益創出に貢献したとされています。

## References

- Business Insider. "[AI rewrites the economics of Amazon's cloud-consulting business](https://www.businessinsider.com/amazon-aws-cloud-customers-proserve-consulting-fees-ai-automates-work-2026-2)" (Eugene Kim, Feb 26, 2026)
- Business Insider. "[Amazon's cloud reboot shows the future of consulting in the AI era](https://www.businessinsider.com/amazon-cloud-reboot-future-consulting-ai-era-2026-3)" (Alistair Barr, Mar 4, 2026)
- AWS Machine Learning Blog. "[Accelerate enterprise solutions with agentic AI-powered consulting: Introducing AWS Professional Service Agents](https://aws.amazon.com/blogs/machine-learning/accelerate-enterprise-solutions-with-agentic-ai-powered-consulting-introducing-aws-professional-service-agents/)" (Nov 17, 2025)
- SiliconANGLE. "[AWS develops AI agents to speed up AWS ProServe consulting projects](https://siliconangle.com/2025/11/17/aws-develops-ai-agents-speed-aws-proserve-consulting-projects/)" (Nov 17, 2025)
- Dnyuz. "[McKinsey says it has 25,000 AI agents. Its rivals say that's not a metric of success.](https://dnyuz.com/2026/02/13/mckinsey-says-it-has-25000-ai-agents-its-rivals-say-thats-not-a-metric-of-success/)" (Feb 13, 2026)
- note. "[AWS ProServe（プロフェッショナルサービス）とは？](https://note.com/jazzy_slug5355/n/n6d3fa6120c79)"

<!-- textlint-enable -->
