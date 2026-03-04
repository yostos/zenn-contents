---
title: "Billboard 125曲の音響分析で見えた「ヒット曲のLoFi化」— librosaで特徴量を抽出・可視化する"
emoji: "🎵"
type: "tech"
topics: ["Python", "librosa", "matplotlib", "音声処理", "データ分析"]
published: true
---

## はじめに

私はギターを弾くのですが、近年のギターはアンプシミュレーターの普及でかつてないほどHiFi化しています。ところが音楽全体を見ると、LoFi Hip Hopやチルウェイブが台頭し、ヒット曲の音作りもウォームでダークな方向に向かっている。ギターはHiFi化しているのに、音楽はLoFi化している？　マジかよ、と思ったので、データで検証してみることにしました。

Billboard Hot 100のトップ5曲（2000〜2024年、計125曲）をPythonで音響分析した結果、スペクトル系の4指標がすべて年との負の相関を示し、[ヒット曲のLoFi化はデータで裏付けられました](https://codedchords.dev/blog/2026/03/hifi-guitar-lofi-music/)。

本記事ではこの分析に使った技術面、つまりlibrosaによる音響特徴量の抽出とmatplotlibによる可視化の実装を解説します。

https://codedchords.dev/blog/2026/03/hifi-guitar-lofi-music/

分析コードはGitHubで公開しています。

https://github.com/yostos/music-trend-analysis

:::message
**著作権についての注記**

本記事の音響分析は、著作物の「思想又は感情」を享受しない情報解析にあたります。日本の著作権法30条の4は、このような目的での著作物の利用を権利者の許諾なく認めています。
:::

## librosaとは

[librosa](https://librosa.org/)はPythonの音声・音楽信号分析ライブラリです。音声ファイルの読み込みから、スペクトル分析、ビートトラッキング、特徴量抽出まで、音響分析に必要な機能が揃っています。

```bash
pip install librosa numpy
```

## 抽出する音響特徴量

今回の分析では6つの特徴量を抽出しました。

| 特徴量 | 単位 | 意味 |
|--------|------|------|
| RMS Loudness | dB | 音圧（音量感） |
| Spectral Centroid | Hz | スペクトル重心（音の明るさ） |
| Spectral Rolloff | Hz | エネルギーの85%が集中する周波数上限 |
| Spectral Bandwidth | Hz | スペクトルの広がり |
| Tempo | BPM | テンポ |
| Zero Crossing Rate | — | 信号がゼロを横切る頻度（テクスチャのノイジーさ） |

このうちSpectral Centroid、Spectral Rolloff、Spectral Bandwidth、Zero Crossing Rateの4指標は、値が低いほど高周波成分が少なくLoFi的な音になるため、音楽のLoFi化を測る指標として機能します。

## 特徴量抽出の実装

音声ファイルからこれらの特徴量を抽出する関数です。

```python
import numpy as np
import librosa

def analyze_audio(filepath: str) -> dict:
    """librosaで音声特徴を分析"""
    y, sr = librosa.load(filepath, sr=None)

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    rms = librosa.feature.rms(y=y)
    rms_db = float(20 * np.log10(np.mean(rms) + 1e-10))
    sc = librosa.feature.spectral_centroid(y=y, sr=sr)
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    zcr = librosa.feature.zero_crossing_rate(y)
    bw = librosa.feature.spectral_bandwidth(y=y, sr=sr)

    return {
        "duration_sec": round(len(y) / sr, 1),
        "tempo": round(float(tempo[0]), 1),
        "rms_db": round(rms_db, 2),
        "spectral_centroid": round(float(np.mean(sc)), 0),
        "spectral_rolloff": round(float(np.mean(rolloff)), 0),
        "zero_crossing_rate": round(float(np.mean(zcr)), 5),
        "spectral_bandwidth": round(float(np.mean(bw)), 0),
    }
```

ポイントを順に解説します。

## 音声の読み込み

```python
y, sr = librosa.load(filepath, sr=None)
```

`librosa.load`は音声ファイルを読み込み、波形データ`y`（1次元のNumPy配列）とサンプルレート`sr`を返します。`sr=None`を指定するとリサンプリングせず元のサンプルレートを保持します。デフォルトでは22050Hzにリサンプリングされますが、音響特徴量の精度を保つために元のサンプルレートを使用しています。

また、デフォルトでは`mono=True`のため、ステレオ音声は自動的にモノラルにダウンミックスされます。曲全体の特徴量を分析する今回の用途ではこの挙動で問題ありません。

## 音圧の分析 — RMS Loudness

```python
rms = librosa.feature.rms(y=y)
rms_db = float(20 * np.log10(np.mean(rms) + 1e-10))
```

`librosa.feature.rms`は各フレームのRMS（Root Mean Square）エネルギーを計算します。返り値は`(1, n_frames)`の2次元配列で、フレームごとの音圧を表します。

`np.mean(rms)`で全フレームの平均を取り、`20 * log10()`でdBスケールに変換しています。`1e-10`はlog(0)を防ぐためのイプシロンです。

今回はlibrosaにLUFS計算機能がないためRMSを採用しています。厳密なラウドネス比較が必要な場合は、次のコラムで紹介するLUFSを使うのが望ましいでしょう。

:::message
**RMSとLUFSの違い**

RMSは純粋な信号エネルギーの平均ですが、音圧の業界標準はLUFS（Loudness Units Full Scale）です。LUFSはITU-R BS.1770で標準化された指標で、人間の聴覚特性に基づくK特性フィルタで周波数の重み付けを行ったうえでラウドネスを算出します。

現在の主要な音楽配信サービスはLUFSを基準にラウドネスノーマライゼーションを適用しています。

| サービス | 基準値 |
|----------|--------|
| Spotify | -14 LUFS |
| YouTube | -14 LUFS |
| Apple Music | -16 LUFS |

基準を超える音圧の楽曲は自動的に音量が下げられるため、過度な音圧競争（ラウドネスウォー）は配信時代には意味が薄れつつあります。

Pythonでは`pyloudnorm`を使えばLUFSを算出できます。

```python
import pyloudnorm as pyln

meter = pyln.Meter(sr)  # サンプルレートを指定
loudness = meter.integrated_loudness(y)  # LUFS値を返す
```
:::

## 音色の分析 — スペクトル系3指標

Spectral Centroid、Spectral Rolloff、Spectral Bandwidthの3つは、いずれも周波数スペクトルの特性を異なる角度から捉える指標です。

**Spectral Centroid（スペクトル重心）** は周波数スペクトルの「重心」で、音の「明るさ」に対応します。値が高いほど高周波成分が多く明るい音（シンバル、ディストーションギターなど）、低いほど暗く丸い音（サブベース、パッドなど）です。

```python
sc = librosa.feature.spectral_centroid(y=y, sr=sr)
spectral_centroid = float(np.mean(sc))  # sc.shape => (1, n_frames)
```

**Spectral Rolloff（スペクトルロールオフ）** は全エネルギーの85%（デフォルト）が集中する周波数の上限です。Centroidが「平均的な明るさ」を表すのに対して、Rolloffは「エネルギーがどの周波数まで届いているか」という上限を表します。ローパスフィルターのカットオフ周波数に近い概念です。

```python
rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
spectral_rolloff = float(np.mean(rolloff))
```

**Spectral Bandwidth（スペクトル帯域幅）** はスペクトル重心の周りにエネルギーがどの程度広がっているかを示します。バンドサウンドのように多くの楽器が広い帯域を埋めるプロダクションでは大きくなり、ボーカルと808ベースだけのシンプルなトラップビートでは小さくなります。

```python
bw = librosa.feature.spectral_bandwidth(y=y, sr=sr)
spectral_bandwidth = float(np.mean(bw))
```

## テクスチャの分析 — Zero Crossing Rate

```python
zcr = librosa.feature.zero_crossing_rate(y)
zero_crossing_rate = float(np.mean(zcr))
```

信号の振幅がゼロライン（正から負、または負から正）を横切る頻度を表します。高周波成分やノイズが多いほど値が大きくなり、スムーズでクリーンな信号ほど値が小さくなります。

ディストーションギターやシンバルが多い楽曲では高く、オートチューンボーカルとサブベース主体のトラップでは低くなります。

## リズムの分析 — テンポ推定

```python
tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
```

`librosa.beat.beat_track`はオンセット検出に基づいてビートを推定します。返り値はテンポ（BPM）とビートフレームの位置です。

:::message
librosa 0.10以降では`tempo`が`numpy.ndarray`として返されるようになりました。スカラー値が必要な場合は`tempo[0]`でインデックスアクセスします。

また、ビートトラッキングは倍テンポ・半テンポの誤検出が起こりやすく、特にハーフタイムのヒップホップやトラップでは実際のテンポの倍の値を返すことがあります。今回の分析でもテンポの相関が弱かった（r=0.193）のは、この誤検出の影響が含まれている可能性があります。
:::

## フレームレベルの特徴量と平均化

librosaのfeature系関数は、いずれもフレーム単位で特徴量を返します。デフォルトでは2048サンプルのウィンドウを512サンプルずつスライドさせて計算しています。

```python
# 例: 3分の曲 (sr=44100) の場合
# フレーム数 ≈ (44100 * 180) / 512 ≈ 15,500フレーム
sc = librosa.feature.spectral_centroid(y=y, sr=sr)
print(sc.shape)  # (1, 15500) のような形状
```

今回はフレームごとの時間変化ではなく曲全体の傾向を見たいため、`np.mean()`で全フレームの平均を取っています。時間変化を追いたい場合は、この平均化を行わずにフレームごとの値をそのまま使います。

## 可視化の実装

抽出した特徴量をmatplotlibで可視化します。125曲分のデータが入ったCSVを読み込み、個別のトラック（散布図）と年ごとの平均（折れ線グラフ）を重ねて描画しています。

```python
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib

matplotlib.rcParams["font.family"] = "Hiragino Sans"

df = pd.read_csv("data/audio_features.csv")

metrics = {
    "rms_db": {
        "label": "RMS Loudness (dB)",
        "desc": "音圧（高い=大きい）",
    },
    "spectral_centroid": {
        "label": "Spectral Centroid (Hz)",
        "desc": "音の明るさ（高い=HiFi寄り、低い=LoFi寄り）",
    },
    "spectral_rolloff": {
        "label": "Spectral Rolloff (Hz)",
        "desc": "エネルギー上限周波数",
    },
    "spectral_bandwidth": {
        "label": "Spectral Bandwidth (Hz)",
        "desc": "周波数の広がり（広い=HiFi、狭い=LoFi）",
    },
    "tempo": {
        "label": "Tempo (BPM)",
        "desc": "テンポ",
    },
    "zero_crossing_rate": {
        "label": "Zero Crossing Rate",
        "desc": "ノイズ感・パーカッシブさ",
    },
}

yearly_avg = df.groupby("year")[list(metrics.keys())].mean()
```

年ごとの平均は`groupby("year").mean()`で算出しています。各年5曲なので、年ごとの外れ値の影響を受けやすい点には留意が必要です。

## グラフ描画関数

```python
def plot_metric(df, yearly_avg, key, meta, output_path):
    """個別指標のグラフを1枚のPNGとして出力"""
    fig, ax = plt.subplots(figsize=(14, 4))

    ax.scatter(
        df["year"], df[key],
        alpha=0.35, s=30, color="steelblue",
        label="Individual tracks", zorder=2,
    )
    ax.plot(
        yearly_avg.index, yearly_avg[key],
        color="crimson", linewidth=2,
        marker="o", markersize=5,
        label="Yearly average", zorder=3,
    )

    ax.set_ylabel(meta["label"], fontsize=11)
    ax.set_title(f"{meta['label']} — {meta['desc']}", fontsize=13)
    ax.set_xlabel("Year", fontsize=11)
    ax.set_xticks(range(2000, 2025))
    ax.tick_params(axis="x", rotation=45)
    ax.legend(loc="upper right", fontsize=9)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close()
```

散布図（`scatter`）で個別トラックのばらつきを見せつつ、折れ線グラフ（`plot`）で年平均のトレンドを重ねる構成です。`zorder`で折れ線を散布図の上に描画し、`alpha=0.35`で個別トラックを半透明にすることでトレンドラインが埋もれないようにしています。

各指標について同じ関数で描画できるように、メトリクスの定義を辞書にしてループで回しています。

```python
for key, meta in metrics.items():
    plot_metric(df, yearly_avg, key, meta, f"docs/images/{key}.png")
```

## 分析結果

このコードでBillboard Hot 100のトップ5曲を分析した結果がこちらです。

**RMS Loudness** — 年との相関はr=+0.319で、音圧は上昇傾向にあります。いわゆるラウドネスウォーが数値で裏付けられました。

![RMS Loudness (dB) の推移](/images/librosa-audio-feature-analysis/rms_db.png)

**Spectral Centroid** — 年との相関はr=-0.327で、2000年代の3,000〜3,200Hz付近から2020年代には2,600Hz付近まで低下しました。ヒット曲の音色が確実に「暗く」なっています。

![Spectral Centroid (Hz) の推移](/images/librosa-audio-feature-analysis/spectral_centroid.png)

**Zero Crossing Rate** — 年との相関はr=-0.343で、今回の分析で最も強い相関を示しました。高域成分が減り、クリーンでスムーズなテクスチャのプロダクションへ移行していることがわかります。

![Zero Crossing Rate の推移](/images/librosa-audio-feature-analysis/zero_crossing_rate.png)

6指標すべての相関をまとめると以下の通りです。

| 特徴量 | 相関係数 (r) | 傾向 |
|--------|-------------|------|
| RMS Loudness | +0.319 | 音圧は上昇 |
| Spectral Centroid | -0.327 | 音は暗く |
| Spectral Rolloff | -0.319 | エネルギーが低域にシフト |
| Spectral Bandwidth | -0.316 | 帯域幅は縮小 |
| Tempo | +0.193 | 明確な傾向なし |
| Zero Crossing Rate | -0.343 | 最も強い相関（テクスチャがスムーズに） |

スペクトル系の4指標がすべて負の相関を示しており、ヒット曲は高周波成分を抑えたウォームでダークな方向に向かっています。ロックバンドのフルバンドサウンドが支配的だった2000年代から、808ベースとオートチューンボーカルを中心としたヒップホップ/トラップが主流になった変化が、数値にそのまま表れています。

分析結果のさらに詳しい考察（ジャンルごとの音響特性の対応、ラウドネスウォーの実態、LoFi化の背景など）は[ブログ記事](https://codedchords.dev/blog/2026/03/hifi-guitar-lofi-music/)にまとめています。

## まとめ

librosaを使えば、数行のコードで音声ファイルから多角的な音響特徴量を抽出できます。今回使用した特徴量をまとめると以下の通りです。

| 関数 | 返り値 | 用途 |
|------|--------|------|
| `librosa.load()` | 波形配列, サンプルレート | 音声読み込み |
| `librosa.feature.rms()` | フレームごとのRMS | 音圧分析 |
| `librosa.feature.spectral_centroid()` | フレームごとの重心周波数 | 音色の明るさ |
| `librosa.feature.spectral_rolloff()` | フレームごとのロールオフ周波数 | エネルギー分布 |
| `librosa.feature.spectral_bandwidth()` | フレームごとの帯域幅 | スペクトルの広がり |
| `librosa.feature.zero_crossing_rate()` | フレームごとのゼロ交差率 | テクスチャ分析 |
| `librosa.beat.beat_track()` | テンポ, ビート位置 | リズム分析 |

これらを組み合わせることで、音楽のトレンド分析だけでなく、ジャンル分類、楽曲の類似度計算、プレイリスト自動生成など、さまざまな応用が可能です。
