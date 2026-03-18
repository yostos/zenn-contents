---
title: "Mac環境のリフレッシュ — MacPawのGUIツールをCLIへ移行し、メニューバーとブラウザも整理した記録"
emoji: "🖥️"
type: "tech"
topics: ["Mac", "macOS", "CLI", "環境構築"]
published: true
---

見送っていたMac環境のリフレッシュを実施しました。

:::message
本記事は要約版です。完全版は個人ブログをご覧ください。
:::

https://codedchords.dev/blog/2026/03/mac-environment-refresh/

## MacPaw関連ソフトウェアの見直し

CleanMyMac[^1] XとGemini 2[^2]を使用していましたが、常駐してリソースを消費するのが気になっていました。今回はどちらもアンインストールし、CLI代替ツールに移行しました。

[^1]: macOSのメンテナンス・ユーティリティ

[^2]: 重複ファイル削除ツール。特に重複画像の検知が優秀

## Mole — macOSクリーンアップツール

https://github.com/tw93/mole

CleanMyMac Xの代替として導入しました。キャッシュ・ログの削除、アプリの完全アンインストール、ディスク使用量の可視化、リアルタイム監視など、マルウェアスキャン以外の機能をほぼカバーしています。すべてのコマンドで`--dry-run`オプションが使えるため、安心して運用できます。

具体的になコマンドは以下です。

```bash
mo uninstall  # アプリの完全アンインストール
mo optimize   # キャッシュ再構築・サービスリフレッシュ
mo analyze    # ディスク使用量の可視化
mo status     # CPU/GPU/メモリ/ディスク/ネットワークのリアルタイム監視
mo purge      # 開発プロジェクトのビルド成果物削除
mo installer  # Downloads内の.dmg/.pkgの整理
```

## Czkawka（チカフカ） — 不要ファイル検出ツール

https://github.com/qarmin/czkawka

Gemini 2の代替として導入しました。名前はポーランド語で「しゃっくり」の意味です。rmlintと異なり、パーセプチュアルハッシュによる類似画像検出をサポートしており、重複ファイル、空フォルダ、破損ファイルなど多彩な検出機能を備えています。

```bash
# 重複ファイル検出: -d 検索先 -e 除外先 -m 最小25B -s hash比較 -D aeo(最古以外を削除)
czkawka_cli dup -d ~/Documents -e ~/Documents/Archive -m 25 -x 7z rar IMAGE -s hash -f results.txt -D aeo
# 空フォルダ検出: 複数ディレクトリ指定可
czkawka_cli empty-folders -d ~/Documents ~/Downloads -f results.txt
# 巨大ファイル検出: -n 上位25件 -x VIDEO拡張子を除外
czkawka_cli big -d ~/Documents -e ~/Documents/Archive -n 25 -x VIDEO -f results.txt
# 類似画像検出: パーセプチュアルハッシュで視覚的に似た画像を検出
czkawka_cli image -d ~/Pictures -e ~/Pictures/Wallpapers -f results.txt
# 壊れたシンボリックリンク検出
czkawka_cli symlinks -d ~/Projects -e ~/Projects/.git -x jpg -f results.txt
# 破損ファイル検出: ヘッダが壊れたファイル等を検出
czkawka_cli broken -d ~/Downloads -f results.txt
```
