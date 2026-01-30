---
title: "ブログをZolaに移行、AWSの後始末"
emoji: "🔧"
type: "tech"
topics: ["zola", "aws", "amplify", "ssg"]
published: true
published_at: 2026-01-31 19:00
---

:::message
この記事は元々 [blog.yostos.org](https://blog.yostos.org/blog/2026/01/blog-to-zola-aws-cleanup/) で公開されたものの転載です。

:::

技術検証目的で1年ほどNext.js + Amazon Amplify構成のブログを運用していました。目的も達成したので静的サイトジェネレーター（以下、SSGと記載）に移行しましたが、意外と移行先の選定やAWSの後始末に手間取りました。その記録を残します。

## Zolaへの移行

移行先のSSGには [Zola](https://www.getzola.org/) を選びました。

Python系（[Pelican](https://getpelican.com/), [Nikola](https://getnikola.com/)）は以前使った経験があり、遅さに辟易していたので避けました。[Hugo](https://gohugo.io/) も使用経験があるため、比較的新しく人気のあるZolaを選びました。Rust製のシングルバイナリで、node_modulesやpip installが不要です。

MDX形式の200記事程度あったので、Markdownへの変換は、Claude Codeで作成した [移行ツール](https://github.com/yostos/blog-yostos/blob/main/tools/convert_mdx.py) で対応しました。

ホスティング先はCloudflareを想定していました。

| サービス         | Zola 対応      | 備考                              |
| ---------------- | -------------- | --------------------------------- |
| Cloudflare Pages | V1 のみ        | V2/V3 で `zola: not found` エラー |
| Netlify          | あり           | 2025年9月〜 月20デプロイ制限      |
| GitHub Pages     | GitHub Actions | 制限なし、無料                    |

しかし、Cloudflare PagesはV2以降で `ZOLA_VERSION` 環境変数を無視する問題があり、[Issue](https://github.com/cloudflare/pages-build-image/issues/3) も2年放置されています。Netlifyは無料プランのデプロイ制限が厳しいため、GitHub Pages + Cloudflare CDNを採用しました。

## AWSリソースの調査と閉鎖

移行で最も手間がかかったのはAWSの閉鎖です。Amplifyは便利ですが、裏でCloudFront、S3、IAMロールなど多くのリソースを自動生成します。管理コンソールでは複数サービスの画面を行き来することになり、見落としやすいと感じました。そのため、今回はすべてCLIで調査・削除しました。

まず、Amplifyが作成した可能性のあるリソースを網羅的に確認します。

```bash
# Amplify アプリ一覧（リージョン指定必須）
aws amplify list-apps --region ap-northeast-1

# CloudFront ディストリビューション
aws cloudfront list-distributions \
  --query 'DistributionList.Items[*].[Id,Origins.Items[0].DomainName,Status]' \
  --output table

# S3 バケット（Amplify が作成したバケットを探す）
aws s3 ls | grep -E 'amplify|blog'

# IAM ロール（Amplify 関連）
aws iam list-roles \
  --query 'Roles[?contains(RoleName,`amplify`)].RoleName' --output table

# ACM 証明書（カスタムドメイン用、us-east-1 固定）
aws acm list-certificates --region us-east-1 \
  --query 'CertificateSummaryList[*].[DomainName,CertificateArn]' \
  --output table
```

今回確認されたリソースと、Amplifyアプリ削除時の自動削除有無は以下の通りです。

| サービス   | リソース                             | 自動削除 |
| ---------- | ------------------------------------ | -------- |
| Amplify    | blog-yostos アプリ                   | -        |
| CloudFront | Amplify 管理のディストリビューション | ✓        |
| S3         | amplify-xxx-deployment バケット      | ✓        |
| IAM        | AmplifySSRLoggingRole 等             | ✗        |
| ACM        | blog.yostos.org 証明書               | ✗        |

調査が終わったら、リソースを削除していきます。

:::message alert
以下ではコマンド例を示していますが、実際の削除作業では各コマンドの出力を目視で確認し、削除対象が正しいことを1つ1つ確かめながら進めました。AWSリソースの削除は取り消しができないため、慎重に作業することをおすすめします。

:::

Amplify Hosting（WEB_COMPUTEタイプ）の場合、アプリを削除するとCloudFrontとS3バケットは自動削除されます。

```bash
# アプリ ID を確認して削除
aws amplify list-apps --region ap-northeast-1 \
  --query 'apps[?name==`blog-yostos`].appId' --output text
aws amplify delete-app --app-id <APP_ID> --region ap-northeast-1
```

IAMロールは自動削除されないため、手動で削除します。ロールを削除する前に、アタッチされているポリシーをすべてデタッチする必要があります。

```bash
# ロールにアタッチされたポリシーを確認
aws iam list-attached-role-policies --role-name <ROLE_NAME>
aws iam list-role-policies --role-name <ROLE_NAME>

# ポリシーをデタッチしてからロールを削除
aws iam detach-role-policy --role-name <ROLE_NAME> --policy-arn <POLICY_ARN>
aws iam delete-role --role-name <ROLE_NAME>
```

ACM証明書はCloudFrontで使用中だと削除できないため、CloudFront削除後に実行します。ACM証明書はus-east-1リージョン固定です。

```bash
aws acm list-certificates --region us-east-1 \
  --query 'CertificateSummaryList[?DomainName==`blog.yostos.org`]'
aws acm delete-certificate --certificate-arn <CERT_ARN> --region us-east-1
```

DNSはFastmailで管理していたため、Amplify用のCNAMEレコードを削除し、GitHub Pages用の設定に変更しました。

削除後は、各リソースが消えていることを確認します。CloudTrailで削除イベントも確認できます。

```bash
# CloudFront（Amplify 管理分が消えていること）
aws cloudfront list-distributions \
  --query 'DistributionList.Items[*].Id' --output text

# S3（amplify 関連バケットが消えていること）
aws s3 ls | grep amplify

# CloudTrail で削除イベントを確認
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteApp \
  --region ap-northeast-1
```

## まとめ

Zolaはシングルバイナリで依存関係がなく、node_modulesの管理から解放されます。Rust製で高速、テンプレートエンジンもJinja2ライクで書きやすいです。プラグインなしでSASSコンパイルやシンタックスハイライトまで対応しており、長期運用での保守コストの低さも魅力です。GitHub Pages + Cloudflare CDNの構成も安定しています。

Amazon Amplifyは構築が簡単な反面、閉鎖時には複数サービスにまたがるリソースの確認が必要です。CloudFrontとS3はAmplifyアプリ削除時に自動削除されますが、IAMロール、ACM証明書、DNSレコードは手動での削除が必要です。管理コンソールでは見落としが発生しやすく、かといって個人ブログでCloudFormationを使うほどでもない。そんなケースではCLIで網羅的に確認し、ログに残しながら作業を進めると安心です。
