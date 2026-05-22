---
title: "Amazon S3からCloudflare R2への移行"
emoji: "☁️"
type: "tech"
topics: ["Cloudflare", "AWS", "CloudflareWorkers", "R2", "S3"]
published: true
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/05/cloudflare-r2/) からの転載です。
:::

## TL;DR

ブログに最後まで残っていたAWSリソースは、有償WEBフォントを配信するためのS3バケットとCloudFrontでした。これをCloudflare R2へ移した記録です。個人ブログのスタティックなリソースをS3とR2のどちらに置くか、という選択の話でもあります。

- 公開URLを持たないR2バケットにフォントを置き、WorkerのR2 Binding経由でのみ読ませる構成にした
- S3 + CloudFront時代に必要だったReferer制限(CloudFront Function・バケットポリシー・CORS)をすべて廃止できた
- 実装はWorkerスクリプト1つとR2バケット1つに収まり、Cloudflareの無料枠で十分にまかなえる
- `wrangler deploy` 時のR2バケット存在確認でCIトークンの権限不足に当たり、`Workers R2 Storage: Edit` の追加が必要だった
- 個人ブログのスタティックなリソースは、すでにCloudflareを使っているならR2が素直な選択

## はじめに

以前「[ブログをZolaに移行、AWSの後始末](https://zenn.dev/yostos/articles/blog-zola-migration-aws-cleanup)」で、Next.js + Amplify構成のブログをZolaへ移し、Amplifyを含む大半のAWSリソースを削除しました。ただ、そのとき1つだけ削除せずに残したものがあります。有償のWEBフォントを配信するためのS3バケットとCloudFrontです。

本記事では、この最後のAWSリソースをCloudflare R2へ移した記録をまとめます。題材はフォント1つですが、個人ブログのスタティックなリソースをS3とR2のどちらに置くか、という選択の話でもあります。

## 移行前の構成

配信していたのは有償のWEBフォントです。このフォントはライセンス上、誰でもwoff2ファイルをダウンロードできる状態にしておくわけにはいきません。一方でWEBフォントである以上、ブラウザからは取得できる必要があります。この相反する要件を、移行前はAWS側で次のように満たしていました[^oac]。

- woff2ファイルをS3バケットに保管し、その前段のCloudFrontから配信
- CloudFront FunctionでリクエストのRefererヘッダを検査し、ブログのドメイン以外からのアクセスを遮断
- S3バケットポリシーにも同じReferer条件を設定し、CloudFrontを経由しないS3への直接アクセスも遮断
- フォントがCloudFrontのドメイン(ブログとは別オリジン)から読み込まれるため、S3側のCORS設定でブログのドメインからの要求のみを許可

ブログのCSSでは、すべての `@font-face` がこのCloudFrontのURLを参照していました。

## Cloudflare R2 への移行

ブログのワークロードは、すでにCloudflareに移っていました。ホスティングはCloudflare Workersの静的アセット配信で動いており、フォントだけをAWSに残しておく理由は薄くなっていました。配信元をS3 + CloudFrontからCloudflare R2に移すと、次のメリットがあります。

- AWSとCloudflareに分かれていたインフラの一本化
- Referer制限のための仕組み(CloudFront Function・バケットポリシーの条件・CORS)の全廃
- フォントの同一オリジン配信化(別オリジンへの `preconnect` やCSP調整が不要)
- R2のストレージ無料枠(10GB)に収まる配信コスト

特に大きいのは2番目です。R2バケットは、公開設定を有効にしない限り外部から到達できるURLを持たず、フォントへのアクセス手段はWorkerからのR2 Bindingだけになります。S3 + CloudFrontでは、公開バケットへのアクセスをReferer条件で絞り込む必要がありました。R2では公開URLがそもそも存在しないため、アクセス元を判定する仕組み自体が要らなくなります。守るための要素が減ることは、設定ミスの余地が減ることでもあります。

## 移行後の保護モデル

新しい構成では、フォントの保護を4つのレイヤーで担保しています。

| #   | レイヤー                 | 設定の実体                                                    | 防ぐ脅威                                         |
| --- | ------------------------ | ------------------------------------------------------------- | ------------------------------------------------ |
| 1   | バケット非公開           | r2.dev 無効・カスタムドメイン未割当・CORS なし                | バケット URL の直接スクレイプ、検索エンジンの索引 |
| 2   | R2 Binding 経由のみ      | `[[r2_buckets]]` 宣言により同一 Cloudflare アカウント内に限定 | 他アカウントや外部ネットワークからの参照         |
| 3   | Worker が公開面を制限    | `/fonts/<file>` パスのみを公開し、不正なキーは弾く            | パストラバーサル、任意キーの READ、バケット列挙   |
| 4   | 長寿命クレデンシャル不在 | R2 API トークンを発行しない                                   | コミットや CI ログ経由のトークン漏洩             |

設計の本質は、ライセンス違反が最も起きやすい経路、つまり公開バケットのURLがクローラに拾われて検索結果に載ることを消す点にあります。閲覧者がDevToolsからフォントを保存する行為や、第三者サイトからのホットリンクは別レイヤーの問題で、WEBフォント配信の仕組み上、完全には防げません。必要ならWorkerにReferer許可リストを足すこともできますが、今回は入れていません。私が利用しているフォントのライセンスでは、ライセンシーのドメインから配信することが求められていて、リクエスト元の検査までは要件になっていないためです。ただし、これはフォントごとに異なります。CORSやドメイン制限を技術的保護措置としてEULAで義務づけているフォントもあるので、利用するフォントのライセンスは必ず確認してください。

## Worker と R2 の構成

実装は驚くほど小さく収まりました。まずR2バケットを作成します(ここでは `web-fonts` という名前にします)。公開設定は無効のままにし、S3と同じキー名でwoff2をアップロードします。あとはWorkerからbindingでつなぐだけです。

`wrangler.toml` にR2バケットのbindingを宣言します。

```toml:wrangler.toml
name = "blog"
main = "src/index.js"
compatibility_date = "2026-02-17"

[assets]
directory = "./public"
binding = "ASSETS"

[[r2_buckets]]
binding = "FONTS"
bucket_name = "web-fonts"
```

Worker本体は、`/fonts/` で始まるリクエストをR2に取り次ぎ、それ以外は静的アセットに渡すだけです。

```js:src/index.js
const FONTS_PREFIX = "/fonts/";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname.startsWith(FONTS_PREFIX)) {
      const key = decodeURIComponent(url.pathname.slice(FONTS_PREFIX.length));
      // Only flat keys in R2 (no subdir, no traversal). Anything else falls
      // through to static assets — the theme also publishes under /fonts/.
      if (key && !key.includes("..") && !key.includes("/")) {
        const obj = await env.FONTS.get(key);
        if (obj) {
          const headers = new Headers();
          obj.writeHttpMetadata(headers);
          headers.set("Content-Type", "font/woff2");
          headers.set("Cache-Control", "public, max-age=31536000, immutable");
          headers.set("ETag", obj.httpEtag);
          return new Response(obj.body, { headers });
        }
      }
    }

    return env.ASSETS.fetch(req);
  },
};
```

最後にCSSの参照先を書き換えます。`@font-face` の `src` は、これまでCloudFrontの絶対URLを指していましたが、同一オリジンの相対パス `/fonts/` に変わります。

```css:custom.css
@font-face {
  font-family: "WebFont";
  src: url("/fonts/WebFont-Regular.woff2")
    format("woff2");
  font-display: swap;
  font-weight: 400;
  font-style: normal;
}
```

CSS内のすべての `@font-face` で、CloudFrontの絶対URLを `/fonts/` で始まる相対パスに置き換えます。デプロイはmainへのpushでGitHub Actionsが `wrangler deploy` を実行する流れに乗せます。

## つまずいた点

デプロイ用のAPIトークンの権限不足でつまずきました。GitHub Actionsが使う `CLOUDFLARE_API_TOKEN` は旧構成(静的アセット配信のみ)のときに発行したもので、Workers Scriptsの編集権限しかありませんでした。R2 bindingを含むWorkerを `wrangler deploy` すると、宣言したバケットの存在確認でR2のAPIを呼び出すため、初回のpushは `code: 10000 Authentication error` で失敗しました。

幸い、Cloudflare Workersのデプロイは原子的です。失敗時は旧Workerが稼働し続けるため、復旧作業中もサイトは旧CloudFront経由でフォントを配信し続け、見た目は保たれていました。

対応として、APIトークンにAccountスコープの `Workers R2 Storage: Edit` を追加しました。最終的に付与した権限セットは次のとおりです。

| スコープ | パーミッション           | 用途                                |
| -------- | ------------------------ | ----------------------------------- |
| Account  | Workers Scripts: Edit    | Worker スクリプトのデプロイ         |
| Account  | Workers R2 Storage: Edit | R2 binding 宣言時のバケット存在確認 |
| Account  | Account Settings: Read   | アカウント情報の照会                |
| Zone     | Workers Routes: Edit     | カスタムルートの設定                |
| User     | Memberships: Read        | `/memberships` API の呼び出し       |
| User     | User Details: Read       | `wrangler whoami` 相当の照会        |

Cloudflare公式の「Edit Cloudflare Workers」テンプレートにはR2の権限が含まれていません。新しいbinding(R2 / D1 / KV / Queuesなど)をWorkerに足すときは、デプロイ前にCIトークンの権限を見直すのが安全です。トークンを差し替えたあとは、失敗したジョブだけを再実行しました。

```bash
DEPLOY_ID=$(gh run list --branch main \
  --workflow="<デプロイ用ワークフロー名>" --limit 1 \
  --json databaseId --jq '.[0].databaseId')
gh run rerun "$DEPLOY_ID" --failed
```

## AWS リソースの撤去

R2配信が本番で安定したことを確認してから、AWS側を停止しました。撤去対象はCloudFrontディストリビューション、CloudFront Function、S3バケットの3つです。ディストリビューションIDは `aws cloudfront list-distributions`、バケット名は `aws s3 ls` で確認できます。以降のコマンドでは、それぞれの識別子を変数に入れてあるものとします。

```bash
DIST_ID="<対象ディストリビューションのID>"
FUNCTION_NAME="<Referer を検査していた CloudFront Function 名>"
BUCKET="<フォントを置いていた S3 バケット名>"
```

CloudFrontディストリビューションは、いきなり削除できません。先に `Enabled = false` で無効化し、設定が全エッジに伝播するのを待ってから削除します。

```bash
aws cloudfront get-distribution-config --id "$DIST_ID" \
  > /tmp/dist-config.json
jq -r '.ETag' /tmp/dist-config.json > /tmp/dist-etag.txt
jq '.DistributionConfig | .Enabled = false' /tmp/dist-config.json \
  > /tmp/dist-config-disabled.json
aws cloudfront update-distribution --id "$DIST_ID" \
  --if-match "$(cat /tmp/dist-etag.txt)" \
  --distribution-config "file:///tmp/dist-config-disabled.json"
```

`update-distribution` は `Status: InProgress` を返します。`Status: Deployed` に戻るまで伝播を待ちます(実測で約3分)。

```bash
until [ "$(aws cloudfront get-distribution --id "$DIST_ID" \
  --query 'Distribution.Status' --output text)" = "Deployed" ]; do
  sleep 30
done
```

`Deployed` に戻ったら削除します。

```bash
ETAG=$(aws cloudfront get-distribution --id "$DIST_ID" \
  --query 'ETag' --output text)
aws cloudfront delete-distribution --id "$DIST_ID" --if-match "$ETAG"
```

CloudFront Functionの削除では、`describe-function` で取得した現在のETagを `delete-function` に渡します。注意点として、FunctionはDEVELOPMENTとLIVEの2つのステージを持ち、両者を別々に更新しているとETagが食い違います。私の環境ではDEVELOPMENT側が新しく、`describe-function --stage DEVELOPMENT` で取ったETagでなければ `PreconditionFailed` になりました。

```bash
ETAG=$(aws cloudfront describe-function --name "$FUNCTION_NAME" \
  --stage DEVELOPMENT --query 'ETag' --output text)
aws cloudfront delete-function --name "$FUNCTION_NAME" --if-match "$ETAG"
```

最後にS3バケットを空にして削除します。

```bash
aws s3 rm "s3://$BUCKET" --recursive
aws s3api delete-bucket --bucket "$BUCKET"
```

ACM証明書は、CloudFrontのデフォルトドメイン(`*.cloudfront.net`)のまま運用していて発行していなかったため、削除対象はありませんでした。これでフォント配信に関わるAWSリソースはすべて無くなり、配信はR2経由に一本化されました。

## 移行して変わったこと

移行の前後で、AWS側にあったCloudFrontディストリビューション、CloudFront Function、S3バケット、バケットポリシー、CORS設定がすべて消えました。残ったのはR2バケット1つと、ごく短いWorkerスクリプト1つです。

今回移したのはフォント一式というごく小さなリソースで、Cloudflareの無料枠の範囲で十分にまかなえています。コスト面より、管理対象のサービス数が減ったことのほうが効きます。フォント1種類のためにCloudFrontとS3とFunctionの3サービスを横断して設定を追っていた状態から、Cloudflareのダッシュボード内で完結する状態になりました。

今回はフォントが題材でしたが、結論はもっと一般的だと考えています。個人ブログのスタティックなリソースの置き場所としては、Amazon S3 + CloudFrontよりもCloudflare R2のほうが向いています。R2なら公開URLを持たせずにWorkerから読め、S3のように公開バケットを設定で囲い込む手間がいりません。ホスティングがCloudflareにあれば置き場も同じプラットフォームにまとまり、費用も無料枠と転送料無料で個人規模なら気になりません。

S3が劣るという話ではありません。ただ、個人ブログの規模で、すでにCloudflareを使っているなら、スタティックなリソースはR2に置くのが素直な選択だと思います。

[^oac]: より確実な構成にするなら、S3バケットを非公開にしてOAC(Origin Access Control)経由でのみ読ませる方法もありました。ただしWEBフォントはページの一部としてブラウザに読み込まれる以上、閲覧者によるダウンロードまで完全に防ぐことはどのみちできません。完全な防御は不可能だという前提で、ある程度は妥協した構成でした。
