---
title: "生成AIの時代だからこそのEmacs"
emoji: "🦬"
type: "idea"
topics: ["emacs", "neovim", "orgmode", "claudecode", "editor"]
published: true
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/10/migrate-to-emacs/) からの転載です。
:::

![Cover](/images/migrate-to-emacs/cover.webp)

私は十数年ぶりにEditorをNeovimからEmacsに戻しました。

大半の開発者がVS Codeを使いVimでさえ少数派となりEmacsユーザーなどほとんど見かけなくなった今日、あえてのEmacsです。懐古趣味がないとは言えませんが、生成AIの時代だからこそEmacsを選ぶだけの理由があります。

## そもそもEmacsユーザーだった

私は2012年頃にSublime Textを使い始め、その流れでVimに移行しました。しかし、もともとはEmacsユーザーでした。

<!-- textlint-disable ja-technical-writing/no-exclamation-question-mark -->
1980年代、私はシャープのパソコンユーザー向けの雑誌『Oh!MZ』をよく読んでいました。誌面では人気ライターの祝一平氏がEmacsを絶賛し、CP/M上で動くクローンの[MINCE](https://en.wikipedia.org/wiki/MINCE)を紹介していました[^1]。私はCP/MでMINCEを使い、その後はDOSエクステンダー上のEmacs、Windows時代はMeadowと乗り継ぎ、macOSでも2011年頃まではEmacsを使っていました。
<!-- textlint-enable ja-technical-writing/no-exclamation-question-mark -->
## 今のEmacsはモダンなエディタになった

ここ数年Neovimを使っていた理由は、パッケージ管理の仕組みが優れていることと、LSPクライアントが使えることの2点でした。

私がEmacsを離れた2011年頃は、標準のパッケージマネージャーpackage.elがEmacs 24(2012年)で同梱される前でした。当時は、Lispファイルを手作業でダウンロードして `load-path` に置くか、auto-install.elやel-getで取得するのが一般的で、依存関係や更新の管理は利用者任せでした。

一方のVimには、優れたサードパーティ製のパッケージマネージャーが豊富にあり、 `.vimrc` に列挙したプラグインをGitリポジトリから一括で取得・更新できました。中でも日本のVimユーザーに大きな影響を与えたのが、Shougo氏(Shougo Matsushita)による `NeoBundle` や `dein.vim` です。プラグイン管理の完成度では、Vim/NeovimがEmacsを大きく上回っていました。

LSPへの対応も、Neovimが先行しました。Microsoftが2016年にLSPを公開すると、Vim/Neovimではvim-lsp(2016年)、LanguageClient-neovim(2017年)、coc.nvim(2018年)といったクライアントがすぐに登場しました。さらにNeovimは0.5(2021年)でLSPクライアントを本体に組み込み、追加のプラグインなしで言語サーバーを使えるようにしました。Emacsにもlsp-mode(2016年)やEglot(2018年)がありましたが、いずれもサードパーティ製のパッケージでした。EglotがEmacs本体に同梱されたのは、Neovimより2年遅いEmacs 29(2023年)です。

現在のEmacsでは、この2点はどちらも標準機能で解決できます。

- パッケージ管理: パッケージマネージャー本体は、Emacs 24から標準搭載のpackage.el。Emacs 29では設定用のマクロ `use-package` が同梱され、パッケージの導入から設定までを1つのブロックに宣言的に書けるようになった。use-packageは2012年頃から広く使われてきたサードパーティ製のパッケージで、それが本体に取り込まれた形である。Emacs 30では `:vc` キーワードで、Gitリポジトリから直接パッケージを導入できる。
- LSP: Emacs 29からLSPクライアントのEglotが同梱されている。 `M-x eglot` で言語サーバーに接続すれば、補完、定義ジャンプ、Flymakeによる診断表示がそのまま使える。Emacs 30では独自実装のJSONパーサーが入り、言語サーバーとの通信が速くなった。
- 構文解析: Emacs 29からtree-sitterを標準で利用できる。 `python-ts-mode` のような `*-ts-mode` 系のメジャーモードが、構文木に基づくハイライト、インデント、構造単位の移動を提供する。ただし言語ごとの文法ファイルは同梱されていないため、 `treesit-install-language-grammar` などで別途インストールする必要がある。

私の設定から、use-packageの例を3つ抜き出します。パッケージアーカイブから導入するMagit、Emacs本体に同梱されているEglot、そして `:vc` でGitHubから直接取得するclaude-code.elです。

```elisp:init.el
;; パッケージアーカイブから導入し、キーを割り当てる
(use-package magit
  :ensure t
  :bind (("C-x g" . magit-status)
         ("C-x M-g" . magit-dispatch)))

;; 同梱パッケージなので :ensure nil。Python のバッファで自動的に言語サーバーへ接続する
(use-package eglot
  :ensure nil
  :hook ((python-mode python-ts-mode) . eglot-ensure))

;; MELPA には無いので GitHub から直接取る
(use-package claude-code
  :ensure t
  :vc (:url "https://github.com/stevemolitor/claude-code.el" :rev :newest)
  :bind-keymap ("C-c k" . claude-code-command-map)
  :config
  (claude-code-mode 1))
```

パッケージの取得元、キー割り当て、フック、読み込み後の設定が1つのブロックにまとまっています。

ほかにも、Emacs 28でElispをネイティブコードにコンパイルする機能(native compilation)が入り、Emacs 30ではlibgccjitがあれば既定で有効になりました。Emacs 30では、キー操作の候補を表示するwhich-key、EditorConfigのサポート、入力中の補完候補をインライン表示する `completion-preview-mode` も標準になりました。2026年8月にリリースされたEmacs 31.1では、ミニバッファ補完やウィンドウ配置の操作がさらに改良されています。

一方のNeovimでは、パッケージ管理をめぐる状況が変わりました。私はlazy.nvimを組み込んだLazyVimを使ってきましたが、2026年3月のNeovim 0.12で標準のパッケージマネージャーvim.packが搭載されました。lazy.nvimを使い続けてよいのか、いずれvim.packに移行すべきなのか、LazyVimは今後どうなるのか。設定の土台が揺らいだように感じたことも、Emacsへの移行を考えた理由の1つです。

## 強力なOrg modeが使える

Emacsを使っていた頃、メモはhowmで書いていました。分類を考えずに書き溜めたメモが、キーワードのリンクで後からつながっていく。このhowmの考え方は、私にとって今でも理想のメモ環境です。

Org modeの上に構築されたorg-roamを使うと、howmに近いことができます。org-roamは、Zettelkasten方式のナレッジ管理を実現するパッケージです。各メモ(ノード)にIDを振ってSQLiteのデータベースで管理し、リンクとバックリンクをたどれるようにします。

- `org-roam-capture` で、タイトルを入力するだけで新しいノードを作れる。
- バックリンク用のバッファに、現在のノードを参照しているノードが一覧表示される。
- リンクされていないが同じ語句を含むノード(unlinked references)も表示できる。
- `org-roam-dailies` で、日付ごとのメモをhowmのように書き溜められる。

howmとまったく同じではありませんが、分類を後回しにして書き、リンクで知識をつなぐという使い方はorg-roamで再現できます。この記事もorg-roamのノードとして書いています。

Neovimを使っていた間は、コマンドラインのノート管理ツール[nb](https://xwmx.github.io/nb/)でナレッジを整理していました。nbはMarkdownのノートをGitで管理し、 `[[wiki-link]]` 形式のリンクやタグ、検索を備えた優れたツールです。それでもOrg modeに移ってみると、次の点でOrg modeのほうが優れていると感じます。

- 見出しの折りたたみ、移動、並べ替えがエディタと一体になっており、長い文書を構造ごと編集できる。
- 見出しにTODO状態、期限、タグ、プロパティを付けられ、アジェンダで横断的に一覧できる。
- `org-capture` で、作業中のどのバッファからでもすぐにメモを取れる。
- 計算のできる表、Babelによるコードブロックの実行、HTML/LaTeX/Markdownなどへのエクスポートまで、1つのファイル形式で完結する。

nbでは、ノートを書くのはエディタ、管理するのはコマンドと役割が分かれていました。Org modeではメモを書く、整理する、予定を管理する、公開するという作業がすべてEmacsの中で完結します。NeovimにもOrg modeを再現するorgmode.nvimがありますが、アジェンダやキャプチャ、エクスポート、Babelまで含めた成熟度では本家に及びません。

## Emacsは環境である

Vimがテキスト編集に特化して機能を磨いてきたのに対し、Emacsはエディタの上で何でもこなせる環境を目指してきました。テキストを扱う作業であれば、Emacsを離れずに済ませられます。

まず、メールクライアントとして使えます。私は昔から手に馴染んでいるMewを、今もそのまま使っています。RSSリーダーにはElfeedがあり、購読しているサイトの更新をEmacsのバッファで読めます。Webページの閲覧も、標準搭載のブラウザEWWで済ませられます。

AIとの連携もEmacsの中で完結します。claude-code.elを使えばClaude CodeをEmacsのバッファで動かせます。gptelを使えば、Claude、ChatGPT、Geminiといった汎用のLLMにエディタから直接問い合わせられます。gptelではモデルをメニューから切り替えられ、選択範囲やバッファの内容をそのままプロンプトに渡せます。

日本語入力にはDDSKKが使えます。SKKの入力処理がEmacsの中で完結するため、OSのIMEに頼る必要がありません。Vimでは、ノーマルモードへ戻ってもIMEが日本語入力のまま残り、コマンドが効かなくなるという問題があります。私はKarabiner-ElementsでEscキーを押すと英数入力に切り替わるように設定していたので、それほど困ってはいませんでした。それでも、エディタの外のツールに頼らなければ解決できない点は不便です。DDSKKなら、日本語入力の状態もEmacsの中で管理できます。

Gitの操作にはMagitがあります。Neovimで使っていたNeogitはMagitを手本に作られたもので、Magitはいわば本家です。操作の網羅性や安定性では、今もNeogitより一歩先を行っていると感じます。

そして、これらすべてをElispで自由に書き換えられます。Emacsは本体の大部分がElispで書かれており、動いているエディタの関数をその場で再定義できます。adviceを使えば、既存の関数に手を加えずに前後の処理を差し込んだり、振る舞いを差し替えたりもできます。NeovimのLuaによる設定は、本体が公開するAPIを通じた拡張が中心です。エディタ自体に手を入れられる範囲では、Elispの自由度が上回ります。

## GUIで動く

私はNeovimを、ターミナルエミュレーターのWezTerm上で使っていました。この構成では、フォントはWezTermの設定で指定し、カラースキームはWezTermとNeovimの両方で揃える必要がありました。見た目を変えるたびに、2つの設定ファイルを行き来することになります。

Neovim本体はターミナルで動くことを前提にしており、GUIで使うにはNeovideなどの別のフロントエンドを用意する必要があります。一方、Emacsは1つのプログラムでGUIとターミナルの両方に対応しています。GUIで起動すれば、フォントとテーマの指定がEmacsの設定だけで完結します。私の場合は、英数字にBerkeley Mono、日本語にSarasa Term J、絵文字にApple Color Emojiと、文字の種類ごとにフォントを割り当てています。

GUIで動くことで、表現力にも余裕が生まれます。ターミナルは同じ大きさの文字を格子状に並べて表示する仕組みのため、それを超える表現は苦手です。GUIのEmacsには、この制約がありません。

- 画像をバッファ内に表示できる。Org modeの文書に貼った図やスクリーンショットを、その場で確認できる。
- 等幅フォントとプロポーショナルフォントを混在させられる。文章は読みやすいプロポーショナルフォント、コードは等幅フォントといった使い分けができる。
- 見出しだけ文字を大きくするなど、要素ごとにフォントサイズを変えられる。
- Emacs 29で入った `pixel-scroll-precision-mode` で、トラックパッドによるピクセル単位の滑らかなスクロールができる。
- キー入力がターミナルを経由しないため、 `C-;` や `C-S-` 系のように、ターミナルでは区別しにくい修飾キーの組み合わせもそのまま使える。

なお、Emacsは `emacs -nw` で起動すればターミナルでも動きます。SSH先のサーバーで作業するときなど、必要に応じてターミナルでも使えるため、GUIを選んでも失うものはありません。

## Emacsはテキストのハブになる

コードの多くを生成AIが書くようになり、エディタに求められる役割は変わりつつあります。

テキストを編集する効率では、明らかにVimのほうが上です。少ないキー操作で素早く正確に編集できるモーダル編集は、今でもVimの真価です。しかし、Claude Codeのようなエージェントがコードを書き、人間はその結果を読んで判断する場面が増えると、手で編集する時間そのものが減ります。編集の速さは、以前ほど重要ではなくなりました。

代わって重要になったのは、さまざまな場所にあるテキストを集め、AIとの間でやり取りし、自分の成果物としてまとめ上げる作業です。Emacsでは、メール、RSS、Webページ、Claude CodeやLLMとの対話をすべて同じバッファとして扱えます。Emacsは、これらの間を取り持つテキストのハブになります。

たとえば、Elfeedで読んだ記事やMewで受け取ったメールの一部をOrg modeのメモに取り込み、gptelでLLMに要約や翻訳をさせ、その結果をさらにClaude Codeへの指示として渡す。こうした流れを、アプリケーションを切り替えることなく1つの環境の中で進められます。集めたテキストは、矩形編集やキーボードマクロ、Org modeの見出しの付け替え(refile)といったEmacsの編集機能で整理し、1つの文書に集約できます。

こうしたテキストを受け止めるのがorg-roamです。私の設定では、キャプチャテンプレートを2つ用意しています。 `d` は空のノードを作る通常のテンプレート、 `c` は呼び出したときに選択していた範囲( `%i` )を本文に取り込むテンプレートです。メールやRSSの記事で気になった部分を選択して `org-roam-capture` を呼べば、その部分がそのまま新しいノードになります。

```elisp:init.el
(use-package org-roam
  :ensure t
  :custom
  (org-roam-directory (file-truename "~/org/roam"))
  ;; ノード一覧にタグを表示する（分類はタグのみなので）
  (org-roam-node-display-template
   (concat "${title:*} " (propertize "${tags:20}" 'face 'org-tag)))
  (org-roam-capture-templates
   '(("d" "default" plain "%?"
      :target (file+head
               "%<%Y%m%d%H%M%S>.org"
               "#+title: ${title}\n#+filetags: \n#+date: %U\n#+startup: showall\n")
      :unnarrowed t)
     ("c" "clip" plain "%i\n\n%?"
      :target (file+head "%<%Y%m%d%H%M%S>.org"
                         "#+title: ${title}\n")
      :unnarrowed t)))
  ;; 日誌（org-roam-dailies）は 1 日 1 ファイル、1 回ごとに時刻付きの見出しを足す
  (org-roam-dailies-capture-templates
   '(("l" "Log" entry
      "* %<%H:%M> %?"
      :target (file+head+olp
               "%<%Y-%m-%d>.org"
               "#+title: %<%Y-%m-%d %a>\n#+filetags: :JOURNAL:\n\n* Log\n* Notes\n"
               ("Log")))
     ("n" "Notes" entry
      "* %?\n%U"
      :target (file+head+olp
               "%<%Y-%m-%d>.org"
               "#+title: %<%Y-%m-%d %a>\n#+filetags: :JOURNAL:\n\n* Log\n* Notes\n"
               ("Notes")))))
  :bind (("C-c n f" . org-roam-node-find)
         ("C-c n i" . org-roam-node-insert)
         ("C-c n c" . org-roam-capture)
         ("C-c n l" . org-roam-buffer-toggle)
         ("C-c n t" . org-roam-tag-add))
  :bind-keymap ("C-c n j" . org-roam-dailies-map)
  :config
  (require 'org-roam-dailies)
  (org-roam-db-autosync-mode))
```

人間の仕事が「書く」ことから「集めて、AIとやり取りし、まとめる」ことへ移りつつある今、テキストのハブとして機能するEmacsは、時代に合ったツールだと考えています。

## なぜVS Codeではないのか

「今乗り換えるならVS Codeだろう」という意見が出そうなのは承知しています。Stack Overflowが2025年に実施した開発者調査では、IDEの設問に回答した26,143人のうち75.9%が、過去1年間にVS Codeを日常的に使ったと答えています。一方のEmacsは選択肢から外れ、自由記述で0.1%が挙げただけでした[^2]。

それでも私はVS Codeを選びませんでした。理由の多くは、個人的な好みです。

まず、画面の周囲をサイドバーやパネルで埋めるインターフェイスが嫌いです。

設計の考え方も、編集に特化したVimやOSのような環境を目指すEmacsとは異なります。VS Codeの拡張機能は公開されたAPIの範囲内で動くように設計されており、Emacsのようにエディタ自体を書き換えることはできません。Org modeの拡張も基本機能にとどまり、アジェンダやBabelは使えません。

## まとめ

私がNeovimを選んでいた理由は、優れたパッケージマネージャーとLSPへの早い対応でした。しかし今のEmacsは、package.elとuse-package、Eglot、tree-sitterを標準で備え、その差はなくなっています。

そのうえでEmacsには、Neovimにはない強みがあります。howmに近いメモ環境を実現するorg-roamと、成熟したOrg modeがあります。メール、RSS、Web、そしてClaude CodeやLLMまでを1つの環境に取り込めます。GUIで動くため、ターミナルの制約も受けません。

生成AIの時代に人間が担う仕事は、あちこちにあるテキストを集め、LLMとやり取りし、成果物に仕上げることです。Emacsでは、メール、RSSの記事、メモ、Claude Codeやgptelとの対話をすべて同じバッファとして扱えます。それらをElispで思いどおりにつなぎ、Org modeで1つの文書にまとめられます。さまざまなテキストとLLMをつなぎ、成果物を仕上げる環境として、Emacsに勝るものはありません。十数年ぶりに戻ってきたEmacsは、AIの時代にこそ真価を発揮するエディタになっていました。

## References

- [GNU Mailing Lists](https://lists.gnu.org/archive/html/info-gnu-emacs/2026-08/msg00004.html). "Emacs 31.1 released"
- [GitHub](https://github.com/neovim/neovim/releases/tag/v0.12.0). "Nvim 0.12.0"
- [Neovim](https://neovim.io/doc/user/news-0.12/). "News-0.12"

[^1]: MINCEは「MINCE Is Not Complete Emacs」の略。発売元のMark of the Unicornは、現在は音楽機器メーカーのMOTUとして知られている。

[^2]: [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology)。2024年の同調査ではEmacsは選択肢にあり、回答者の4.2%が使っていた([Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024/technology))。
