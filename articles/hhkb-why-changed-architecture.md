---
title: "HHKBはなぜアーキテクチャを変えたのか ― 「高品位」設計の考察"
emoji: "⌨️"
type: "idea"
topics: ["hhkb", "keyboard", "gadget"]
published: true
published_at: 2026-02-05 15:40
---

## TL;DR

- 初代HHKB（1996年）はシリンドリカルカーブド、Professional（2003年）はシリンドリカルステップという異なるキートップ構造を持つ。形状設計としてはカーブドが上位であり、一見するとProfessionalは劣化に見える
- しかし開発者・八幡氏の証言によれば、静電容量スイッチの技術的制約（距離精度が重要）によりカーブド構造は採用できなかった
- HHKBはキートップ形状ではなくスイッチ品質に全振りするため、ステップ構造を選択した。これは妥協ではなくリソース配分の最適化である
- 「高品位」の意味は文脈依存である。形状の贅沢さを指す場合と、スイッチによる打鍵品質を指す場合がある

---

## 1. 2つのキートップアーキテクチャ

**シリンドリカルカーブド（Cylindrical Curved）** は初代HHKB（1996年発売）に採用された構造です。各列のキートップが連続的な曲面を描き、キーボードを横から見るとなめらかな弧を描きます。列ごとに異なる角度のキーキャップ金型が必要で、金型数が多く製造時の調整もシビアなため、製造コスト・設計難易度は高くなります。

**シリンドリカルステップ（Cylindrical Step）** はHHKB Professional（2003年発売）以降に採用された構造で、現在のほとんどのメカニカルキーボードはこの方式です。各列は段差（ステップ）状に配置され、角度は離散的で列間に明確な段があります。金型の共用がしやすく量産性に優れ、コスト効率の良さが特徴です。

純粋にキートップ形状の設計贅沢度だけで評価すると、シリンドリカルカーブド ＞ シリンドリカルステップです。これは工学的事実です。カーブド構造は、指の動きに対してより自然な曲面を提供するために、より多くの製造コストと設計労力を投入しています。

---

## 2. 初代HHKBからProfessionalへの移行

| 項目           | 初代HHKB（1996年）     | HHKB Professional（2003年） |
| -------------- | ---------------------- | --------------------------- |
| キートップ構造 | シリンドリカルカーブド | シリンドリカルステップ      |
| スイッチ方式   | メンブレン             | 静電容量無接点              |
| 押下圧         | 約50g                  | 約45g                       |
| 製造コスト配分 | 形状設計に重点         | スイッチ機構に重点          |

PFUはProfessionalへの移行で「指の疲労に最も効くのは、キートップの曲面ではなく、スイッチ特性と荷重カーブである」という結論に達したと想像します。この判断に基づき、カーブド構造からステップ構造に簡略化し、浮いたコストと設計余力を静電容量無接点スイッチに全振りしました。これは「妥協」ではなく、リソース配分の最適化であると考えます。

[HHKB裏HISTORY 第一章 後編](https://happyhackingkb.com/jp/life/hhkb_life113.html)において、開発者の八幡氏は移行の理由を明確に語っています。

> 「これ、静電容量のキーだと出来ないので、そこからはステップになったんです」

この証言は、カーブドからステップへの移行が単なるコスト削減ではなく、静電容量スイッチの技術的制約に起因することを示しています。

静電容量スイッチの信号強度は距離の逆数（スプリングとPCB間の距離）に比例します。

```
静電容量センシングの原理：

┌─────────────┐
│   キーキャップ   │
└──────┬──────┘
       │
   ╱╲  │  ╱╲   ← ラバードーム
  ╱  ╲ │ ╱  ╲
       │
    ╱│╲│╱│╲   ← コニカルスプリング
   ╱ │ │ │ ╲
────┴─┴─┴────
    PCBパッド   ← 距離が重要（信号 ∝ 1/距離）
```

| 距離の変動 | 信号への影響 | 実用上の問題             |
| ---------- | ------------ | ------------------------ |
| ±0.1mm     | 有意         | 打鍵点のばらつき         |
| ±0.2mm     | 大きい       | キーフィールの不均一     |
| ±0.5mm     | 致命的       | 入力が認識されない可能性 |

カーブド筐体では各キー位置で距離が異なるため、均一なキーフィールの実現が困難です。ステップ構造では各列で距離を一定に保てるため、全キーで安定したセンシングが可能になります。

---

## 3. 画像解析による形状差の検証

初代HHKBとProfessional Classic Type-Sの側面写真を用いて、Python + OpenCVによるエッジ検出・相関分析と、Fiji (ImageJ) による角度分析の2手法で形状差を定量的に検証しました。

<!-- textlint-disable -->

:::details 解析スクリプト：プロファイル比較（Python）

```python
import cv2
import numpy as np
import matplotlib.pyplot as plt

def extract_top_profile(gray_img):
    """キーボード上端のプロファイルを抽出"""
    edges = cv2.Canny(gray_img, 50, 150)
    profile_points = []
    for x in range(gray_img.shape[1]):
        column = edges[:, x]
        edge_positions = np.where(column > 0)[0]
        if len(edge_positions) > 0:
            profile_points.append((x, edge_positions[0]))
    return np.array(profile_points)

def calculate_profile_difference(profile1, profile2):
    """2つのプロファイル間の統計的差異を算出"""
    common_x = np.linspace(0, 1, 500)
    y1_interp = np.interp(common_x, profile1[:, 0], profile1[:, 1])
    y2_interp = np.interp(common_x, profile2[:, 0], profile2[:, 1])
    return {
        'mean_difference': np.mean(np.abs(y1_interp - y2_interp)),
        'correlation': np.corrcoef(y1_interp, y2_interp)[0, 1]
    }
```

:::

:::details 解析スクリプト：角度分析（Python）

```python
def analyze_profile_angles(gray_img, window_size=50):
    """プロファイルに沿った局所的な傾斜角度を計算"""
    edges = cv2.Canny(gray_img, 50, 150)
    width = gray_img.shape[1]

    # 上端プロファイルを検出
    profile_y = []
    for x in range(width):
        col = edges[:, x]
        edge_pos = np.where(col > 0)[0]
        profile_y.append(edge_pos[0] if len(edge_pos) > 0 else np.nan)
    profile_y = np.array(profile_y)

    # スライディングウィンドウで局所角度を計算
    angles = []
    step = window_size // 2
    for i in range(step, width - step, step):
        y1, y2 = profile_y[i - step], profile_y[i + step]
        angles.append(np.degrees(np.arctan2(y2 - y1, window_size)))
    return angles
```

:::

:::details 解析スクリプト：Fiji/ImageJマクロ

```javascript
// プロファイル抽出と角度分析
open("HHKB-First.png");
run("8-bit");
run("Gaussian Blur...", "sigma=2");
run("Find Edges");

width = getWidth();
height = getHeight();
profile = newArray(width);

// 各列の上端エッジを検出
for (x = 0; x < width; x++) {
  for (y = 0; y < height / 2; y++) {
    if (getPixel(x, y) > 50) {
      profile[x] = y;
      break;
    }
  }
}

// 局所角度とSmoothness Indexを計算
smoothSum = 0;
prevAngle = 0;
for (x = 30; x < width - 30; x++) {
  dy = profile[x + 15] - profile[x - 15];
  angle = (atan2(dy, 30) * 180) / PI;
  if (x > 30) smoothSum += abs(angle - prevAngle);
  prevAngle = angle;
}
smoothnessIndex = smoothSum / (width - 61);
```

:::

<!-- textlint-enable -->

![プロファイル比較解析](/images/hhkb-why-changed-architecture/profile_comparison.webp)
_上段: 両モデルの側面写真とエッジ検出によるプロファイルライン。下段左: プロファイルのオーバーレイ比較（赤=初代カーブド、青=Professionalステップ）。下段右: 高さの差分と相関係数。_

初代HHKBのプロファイル（赤線）は滑らかな曲線を描くのに対し、Professional（青線）は階段状の段差が明確です。相関係数0.9215は「似ているが有意に異なる」ことを示しています。

| 解析手法                   | 初代（Curved） | Professional（Step） | 差分       |
| -------------------------- | -------------- | -------------------- | ---------- |
| プロファイル相関係数       | -              | 0.9215               | 有意差あり |
| Smoothness Index（Python） | 29.9           | 35.2                 | 17.7%      |
| Smoothness Index（Fiji）   | 2.64           | 3.34                 | 26.3%      |

Smoothness Index（隣接位置間の角度変化の標準偏差）は値が小さいほど滑らかな曲面を示します。初代の値が低く滑らかな遷移、Professionalは値が高く急な角度変化という結果は、八幡氏の証言を数値的に裏付けています。

---

## 4. 「高品位」とは何か ― 3つの評価軸

「高品位キーボード」を語る際、以下の3つの評価軸を区別しないと議論が噛み合いません。

1. **キー配列・キートップ形状の工学的完成度** — 曲面の連続性、人間工学的配慮、金型設計の精緻さ。この軸ではカーブドが上位
2. **製造コスト・金型コスト** — 量産性、コスト効率。この軸ではステップが合理的
3. **キーボード全体としての使用感（スイッチ含む）** — 長時間使用時の疲労度、打鍵フィードバックの質。この軸ではスイッチ方式が支配的要因

PFU公式が言う「高品位キー」は評価軸③を指していると考えられます。キートップ形状単体の話ではなく、静電容量無接点スイッチによる総合的な打鍵品質を意味します。

---

## 5. キーボード史における思想的位置づけ

HHKBの設計思想を理解するには、IBM Model MとTopre Realforceとの比較が有効です。

**IBM Model M（1985年）** はBuckling Spring（座屈バネ）スイッチを採用し、「入力の確実性」を設計思想としています。「人は間違える」という人間観から、誤入力を物理的フィードバックで防ぐアプローチを取っています。壊れない、狂わない、一生使える「事務機械」として設計されました。

**Topre Realforce（2000年代初頭）** は静電容量無接点方式を採用し、「疲労の最小化」を設計思想としています。「人は壊れる」という人間観から腱を守ることを重視し、「打鍵品質はスイッチで作る」という思想を体現しています。

**HHKB Professional（2003年）** は静電容量無接点方式（Realforce系）を採用し、「思考の流れを妨げない」を設計思想としています。「人は考える」という人間観から入力デバイスの存在を消すことを目指し、UNIX哲学に基づく配列とコンパクトさを追求しました。

| キーボード        | 主眼         | 人間観       |
| ----------------- | ------------ | ------------ |
| IBM Model M       | 入力の確実性 | 人は間違える |
| Topre Realforce   | 疲労軽減     | 人は壊れる   |
| HHKB Professional | 思考の流れ   | 人は考える   |

重要な点として、HHKBはModel MとRealforceの「中間」や「折衷」ではありません。配列思想はUNIX哲学（独自路線）、スイッチはRealforce系を採用、筐体・形状はModel M的な剛性・重量を意図的に捨てた合理主義です。

---

## 6. 結論

> 形状設計としてはカーブドの方が上だが、HHKBはスイッチに全振りするためステップ構造を選んだ

キートップ形状・製造贅沢度の観点ではシリンドリカルカーブド ＞ シリンドリカルステップですが、HHKBとしての総合的な「高品位」の観点ではProfessional（ステップ＋静電容量）＞ 初代HHKB（カーブド＋メンブレン）です。「高品位」の定義は文脈依存で、形状設計の贅沢さを指す場合もあれば、長時間使用時の総合的な打鍵品質を指す場合もあります。

HHKBの変遷は、「すべてを最高にする」のではなく「何に全振りするか」を選択した好例です。初代は形状設計に注力し（当時の技術的制約もあった）、Professionalはスイッチ品質に注力しました（形状は合理化）。この判断の背景には、「指の疲労はキートップ曲面よりスイッチ特性で決まる」という知見と、静電容量スイッチの技術的制約という2つの要因があります。

---

## 参考：現在入手可能な関連キーボード

初代HHKBのようなシリンドリカルカーブド構造を持つ完成品キーボードは、現行品ではほぼ存在しません。カーブド的な体験に近づける選択肢としては、SAプロファイルキーキャップ（背が高く深くスカルプチャされている）、MT3プロファイルキーキャップ（1970〜80年代のIBMターミナルにインスパイアされた設計）、Drop CTRL / ALT（MT3キーキャップとの組み合わせで販売）などがあります。ただし、これらはキーキャッププロファイルによる近似であり、初代HHKBの「プレート自体がカーブしている」構造とは異なります。

---

## 付録：事実検証と情報ソース

本文書の事実関係は2026年1月21日にWeb検索により検証済みです。

<!-- textlint-disable -->

:::details 検証済み項目一覧

| 項目                    | 記述内容                                | 検証結果                  | 情報ソース                                                                             |
| ----------------------- | --------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------- |
| 初代HHKB発売年          | 1996年                                  | ✅ 正確（1996年12月20日） | PFU公式、Wikipedia                                                                     |
| 初代HHKBスイッチ        | メンブレン                              | ✅ 正確                   | [PFU 初代HHKB仕様](https://happyhackingkb.com/jp/products/discontinued/hhkb_kb02/)     |
| 初代HHKB押下圧          | 約50g                                   | ✅ 正確（50g）            | [PFU 初代HHKB仕様](https://happyhackingkb.com/jp/products/discontinued/hhkb_kb02/)     |
| 初代HHKBキートップ      | シリンドリカルカーブド                  | ✅ 正確                   | [PFU 高品位キー仕様](https://happyhackingkb.com/jp/products/discontinued/keyspec.html) |
| HHKB Professional発売年 | 2003年                                  | ✅ 正確（2003年5月）      | [PFU HHKB History](https://happyhackingkb.com/jp/history/page4.html)                   |
| Professionalスイッチ    | 静電容量無接点                          | ✅ 正確（Topre方式）      | [PFU HHKB History](https://happyhackingkb.com/jp/history/page4.html)                   |
| Professional押下圧      | 約45g                                   | ✅ 正確                   | [PFU HHKB History](https://happyhackingkb.com/jp/history/page4.html)                   |
| Professionalキートップ  | シリンドリカルステップ                  | ✅ 正確                   | [PFU 高品位キー仕様](https://happyhackingkb.com/jp/products/discontinued/keyspec.html) |
| IBM Model M発売年       | 1985年                                  | ✅ 正確                   | [Wikipedia Model M](https://en.wikipedia.org/wiki/Model_M_keyboard)                    |
| Model Mスイッチ         | Buckling Spring                         | ✅ 正確                   | [Wikipedia Model M](https://en.wikipedia.org/wiki/Model_M_keyboard)                    |
| Topre Realforce         | 2000年代初頭                            | ✅ 正確（2001年）         | [東プレ公式](https://www.topre.co.jp/products/elec/keyboards.html)                     |
| MT3プロファイル         | 1970〜80年代IBMターミナルにインスパイア | ✅ 正確                   | [matt3o MT3 History](https://matt3o.com/mt3-keycap-profile-a-brief-history/)           |

:::

:::details 著者の分析・解釈として記載されている部分
以下は本文中で「想像する」「考える」と明示されており、公式見解ではなく著者の分析です。

- PFUが「指の疲労はキートップ曲面よりスイッチ特性で決まる」と判断したという推測
- カーブドからステップへの移行が「リソース配分の最適化」であるという解釈
- 3つの評価軸の定義と、PFU公式の「高品位」が評価軸③を指すという解釈
  :::

:::details 主要参考文献

- [PFU HHKB公式サイト](https://happyhackingkb.com/jp/)
- [PFU 初代HHKB仕様](https://happyhackingkb.com/jp/products/discontinued/hhkb_kb02/)
- [PFU 高品位キー仕様](https://happyhackingkb.com/jp/products/discontinued/keyspec.html)
- [PFU HHKB History](https://happyhackingkb.com/jp/history/page4.html)
- [Model M - Wikipedia](https://en.wikipedia.org/wiki/Model_M_keyboard)
- [東プレ キーボード](https://www.topre.co.jp/products/elec/keyboards.html)

  :::

:::details HHKB裏HISTORY（開発者座談会）
本文書の解釈を補強する一次情報として重要です。記事113で八幡氏は技術的制約による移行を明言し、記事129ではType-S開発でスイッチ特性改善への継続投資が語られ、記事112では「viやemacsを使うには文字だけ打てればよかった」というUNIX文化に根ざした設計思想の原点が語られています。

- [第一章 前編](https://happyhackingkb.com/jp/life/hhkb_life112.html) - 開発背景、UNIX文化との関係
- [第一章 後編](https://happyhackingkb.com/jp/life/hhkb_life113.html) - Professionalへの移行経緯、東プレとの協業
- [第二章 前編](https://happyhackingkb.com/jp/life/hhkb_life127.html) - 事業部移管、ブランド確立
- [第二章 後編](https://happyhackingkb.com/jp/life/hhkb_life129.html) - Type-Sにおけるスイッチ特性への継続投資
  :::

<!-- textlint-enable -->
