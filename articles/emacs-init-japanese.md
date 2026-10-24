---
title: "AI時代のEmacs設定術(1) - Emacsで日本語を自在に"
emoji: "🗾"
type: "tech"
topics: ["emacs", "ddskk", "日本語入力", "font", "macos"]
published: true
---

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/10/emacs-init-el/01-emacs-init-japanese/) からの転載です。連載「AI時代のEmacs設定術」の第1回です。

- 次回: [AI時代のEmacs設定術(2): Org modeでタスクと情報を管理する](https://codedchords.dev/blog/2026/10/emacs-init-el/02-emacs-init-org/)
:::

## はじめに

エディタといえばVS Codeという時代が続いています。しかし生成AIを日常的に使ういま、エディタに求められる役割は変わりつつあります。あちこちに散らばるテキストを集め、手を加え、成果物に仕上げる。その拠点には、優れたエディタであるだけでなく、あらゆるテキストを同じ操作で扱える**テキストのハブ**であることが求められます。いまEmacsを選ぶ理由はそこにあります。しかも現在のEmacsは、パッケージマネージャー、LSPクライアント、構文解析を標準で備えたモダンなエディタです。

一方で、Emacsを使う人は減っています。使う人が減れば、手引きとなる情報も減ります。これからEmacsを始めようとする人にとって、ハードルは以前より上がっています。
この連載では私のinit.elをもとに、ほかに解説が見当たらないテーマを選んで機能ごとに紹介します。
想定する読者は、生成AIを含めて日常のテキスト作業をすべてEmacsで済ませたい人です。

この連載が、その一助になればと考えています。

初期設定の全体については[Gist](https://gist.github.com/yostos/631d858c283b1a15fc487f474c837a86)をご覧ください。

----
## Emacsの日本語環境

Emacsは日本語も問題なく扱えます。ただ、設定しないまま日本語を書き始めると、全角文字の幅のずれや記号・絵文字による桁崩れ、日本語入力でキー操作が効かないといった引っかかりに次々と出会います。どれも数行の設定で解消できますが、知らなければEmacsは日本語に弱いという印象のまま終わってしまいます。

連載「AI時代のEmacs設定術」の1回目となるこの記事では、フォント、括弧、日本語入力の3つについて、私のinit.elから該当する設定を抜き出して解説します。動作環境はEmacs 31とmacOSです。

## 全角文字を半角2文字分の幅に揃える

等幅フォントで日本語を書くとき、全角文字が半角2文字分の幅になっていないと、日本語混じりの表やコメントの桁がずれます。Emacsで最初に整えたいのはここです。

いちばん簡単なのは、欧文と日本語をどちらも更紗ゴシック（Sarasa Term J）で表示する方法です。更紗ゴシックは半角が0.5 em、全角が1.0 emちょうどで作られているので、主フォントに指定するだけで全角が半角2文字分に揃います。Homebrewなら次のコマンドで入れられます。

```bash
brew install --cask font-sarasa-gothic
```

```elisp:init.el
(set-face-attribute 'default nil :family "Sarasa Term J" :height 200)
```

`:height`は1/10ポイント単位で指定するので、200は20ポイントです。

私は欧文をBerkeley Mono[^berkeley]で表示しています。欧文と日本語に別々のフォントを使うと、フォントごとに字幅の設計が違うため、全角が半角2文字分に揃いません。そこで、かなと漢字、和文の記号を更紗ゴシックに割り当て、更紗ゴシックの大きさを調整します。

```elisp:init.el
;; 主フォント（WezTerm の 1 番目）
(set-face-attribute 'default nil :family "Berkeley Mono" :height 200)

;; 日本語は Sarasa Term J（WezTerm の 2 番目）
(dolist (script '(han kana cjk-misc))
  (set-fontset-font t script (font-spec :family "Sarasa Term J")))

;; 記号類（① ※ ○ ★ ✓ ⌘ など）は上の script 指定では拾えず、Arial Unicode MS などに
;; 落ちて幅が崩れる。記号ブロック全体を文字の範囲で Sarasa Term J に割り当てる
;; （'symbol の script 指定では直らない）。
;; Berkeley Mono が持つ文字（→ … “ ─ ■ など）はフレームのフォントが優先されるので変わらない
(set-fontset-font t '(#x2000 . #x2bff) (font-spec :family "Sarasa Term J"))

;; 全角を半角ちょうど 2 セルに合わせる（実測: 半角 12.0px / 全角 24.0px）
(add-to-list 'face-font-rescale-alist '("Sarasa Term J" . 1.2))
```

調整する倍率は、実際の表示幅を測って決めます。Emacs 29以降なら、`string-pixel-width`で文字列の表示幅をピクセル単位で取得できます。倍率を設定する前に、`*scratch*`バッファで次の式を評価します。式の閉じ括弧の後ろにカーソルを置いて`C-x C-e`を押すと、結果が画面下のエコーエリアに表示されます。

```elisp
(list (string-pixel-width "a") (string-pixel-width "あ"))
```

私の環境では`(12 20)`が返りました。半角が12pxなので、全角は24px必要です。しかし更紗ゴシックの全角は20pxしかありません。倍率は「半角の幅 × 2 ÷ 全角の幅」で求められ、ここでは24 ÷ 20で1.2になります。

求めた倍率は`face-font-rescale-alist`に設定します。この設定は、すでに開いているフレームのフォントには反映されません。init.elに書いてEmacsを起動し直すか、`C-x 5 2`で新しいフレームを開いてから、同じ式でもう一度測ります。`(12 24)`が返れば、全角がちょうど半角2文字分に揃っています。ある文字がどのフォントで表示されているかは、その文字の上で`C-u C-x =`を実行すると確認できます。

倍率を合わせた後も、記号の一部は幅が崩れていました。①と※は20px、★は16pxで、どれも更紗ゴシックではなくArial Unicode MSで表示されていました。Emacsは文字の種類ごとにフォントを選ぶので、hanやkanaの指定に含まれない記号は、その文字を持つ別のフォントに回されます。記号の種類を表すsymbolを指定しても直らなかったため、記号が集まっているU+2000〜U+2BFFの範囲をまとめて更紗ゴシックに割り当てています。→ や … のようにBerkeley Monoが持っている文字は、主フォントが優先されるので変わりません。割り当て後は ① ※ ★ ○ ✓ ⌘ がすべて12pxとなり、半角1文字分に収まりました。✅ や ⭐ などの絵文字は、この範囲に含まれていてもApple Color Emojiのまま表示されます。

フォントの構成は、ターミナルのWezTermと揃えています。

## アイコンと絵文字を表示する

モードラインを整えるdoom-modelineや、補完候補やファイル一覧にアイコンを付けるnerd-iconsは、Nerd Fontのアイコンを使います。アイコンだけを収めたSymbols Nerd Font Monoを入れておきます。`M-x nerd-icons-install-fonts`でも、同じフォントを`~/Library/Fonts`に入れられます。

```bash
brew install --cask font-symbols-only-nerd-font
```

```elisp:init.el
;; Nerd Font のアイコン類（WezTerm の 3 番目）
(dolist (range '((#xe000 . #xf8ff) (#xf0000 . #xfffff)))
  (set-fontset-font t range (font-spec :family "Symbols Nerd Font Mono")))

;; モードライン（アイコンは下の nerd-icons を使う）
(use-package doom-modeline
  :init
  (doom-modeline-mode 1))

;; アイコン（フォントは上で設定した Symbols Nerd Font Mono を使う）
(use-package nerd-icons
  :custom
  (nerd-icons-font-family "Symbols Nerd Font Mono"))

;; ミニバッファの補完候補にアイコンを付ける
(use-package nerd-icons-completion
  :after marginalia
  :hook (marginalia-mode . nerd-icons-completion-marginalia-setup)
  :config
  (nerd-icons-completion-mode 1))

;; dired にアイコンを付ける
(use-package nerd-icons-dired
  :hook (dired-mode . nerd-icons-dired-mode))

;; corfu のポップアップにアイコンを付ける
(use-package nerd-icons-corfu
  :after corfu
  :config
  (add-to-list 'corfu-margin-formatters #'nerd-icons-corfu-formatter))
```

Nerd Fontのアイコンは、Unicodeの私用領域に置かれています。最初の`set-fontset-font`で私用領域の文字をSymbols Nerd Font Monoに割り当てておくと、nerd-iconsを通さずにバッファへ入ったアイコンも正しく表示されます。`nerd-icons-font-family`は既定値もSymbols Nerd Font Monoなので、同じフォントを使うなら省略できます。nerd-icons-completion、nerd-icons-dired、nerd-icons-corfuは、それぞれ補完候補、dired、corfuのポップアップにアイコンを付けるパッケージです。

```elisp:init.el
;; 絵文字は OS のカラー絵文字を優先する
(set-fontset-font t 'emoji (font-spec :family "Apple Color Emoji") nil 'prepend)

;; 絵文字も半角ちょうど 2 セルに合わせる（実測: 既定 23px → 1.1 倍で 24px）
(add-to-list 'face-font-rescale-alist '("Apple Color Emoji" . 1.1))
```

絵文字は、macOSのカラー絵文字であるApple Color Emojiで表示するよう指定しています。ただしEmacs 31のmacOS版では、この行がなくても 😀 などの絵文字はApple Color Emojiで表示されました。この行は、ほかのフォントが絵文字の字形を持っていても、カラー絵文字を優先させるためのものです。絵文字の幅も、そのままでは23pxで、全角の24pxに1px足りません。絵文字の後ろの文字が1pxずつずれるので、Apple Color Emojiも`face-font-rescale-alist`で1.1倍にしています。これで絵文字も、全角と同じ半角2文字分に揃いました。

## 日本語の括弧も自動で閉じる

electric-pair-modeを有効にすると、開き括弧を入力したときに閉じ括弧が自動で入ります。対象は半角の括弧だけではありません。「」（）【】 などの全角括弧も、Emacsの標準の構文テーブルに対として登録されているので、追加の設定なしで閉じます。かわせみなどmacOSの入力メソッド（以降、IMEと表記）で確定した文字も、通常のキー入力と同じ`self-insert-command`を通るので、同じように閉じます。

```elisp:init.el
;; 括弧や引用符を自動で閉じる。
;; 「」（）【】 などの全角括弧も標準構文表に対があるので設定なしで閉じ、
;; かわせみで確定した文字にも効く（確定文字は self-insert-command を通る）。
;; SKK で打った文字は self-insert-command を通らないので、SKK 側は
;; skk-auto-insert-paren（DDSKK のセクション参照）が閉じる
(electric-pair-mode 1)
```

ただし、DDSKKで入力した括弧にはelectric-pair-modeが効きません。DDSKKは確定した文字を、`self-insert-command`を通さずに挿入するからです。DDSKKで括弧を閉じるには、DDSKK自身の`skk-auto-insert-paren`を有効にします。私はDDSKKの設定の`:init`に書いています。

```elisp:init.el
;; 「 や ( を打つと対になる文字も入れてカーソルをその間に置く。
;; 対の組は skk-auto-paren-string-alist の既定。閉じ文字の読み飛ばしはしないので C-f で抜ける
(setq skk-auto-insert-paren t)
```

これで、DDSKKのかなモードで`[`を打つと「」が入り、カーソルは括弧の内側に置かれます。どの文字を対にするかは`skk-auto-paren-string-alist`で決まり、既定で「」『』（）【】などが含まれています。electric-pair-modeと違って閉じ括弧を打っても読み飛ばさないので、括弧の外へ出るときは`C-f`で移動します。

## DDSKKで日本語を入力する

Emacsでの日本語入力には、DDSKKを使っています。DDSKKは、かな漢字変換の方式であるSKKをEmacs Lispで実装したものです。SKKの入力処理はEmacsの中で完結するので、OSのIMEに頼る必要がありません。

IMEはEmacsの外で動くので、Emacsは日本語入力がオンかオフかを知りません。日本語入力のまま`M-x`でコマンド名を打ったり、`y-or-n-p`の確認に`y`で答えたりすると、キー入力はまずIMEの未確定文字になり、Emacsには届きません。入力モードを切り替えてから打ち直すことになります。DDSKKの入力モードはバッファごとにEmacsが持っている状態なので、ほかのコードからも参照したり切り替えたりできます。日本語入力の状態までEmacsの中で管理できるのが、IMEにはない利点です。

macOSにも、AquaSKKやmacSKKといったSKK方式のIMEがあります。こちらはどのアプリケーションでも使えますが、IMEである以上、前の段落で書いた問題はそのまま残ります。Emacsの中で使うなら、DDSKKの利点は大きいと考えています。SKKはもともとEmacsで生まれた入力方式です。DDSKKはその拡張版として長く開発が続いてきました。Emacsの一部として動くので、編集中の文脈に合わせた動作ができます。たとえばcontext-skkは、プログラムのコメントや文字列の外を編集し始めると、自動で英字の入力に切り替えます。Emacs Lispの関数が返す値を変換候補にもできます。

SKKでは、変換の区切りを自分で指定します。漢字にしたい語は先頭を大文字で打ち始め、送り仮名があればその位置も大文字で示します。文節の区切りを変換エンジンに推測させないので、誤った区切りを直す手間がありません。実際に入力している様子は次の動画のとおりです。

@[youtube](SaUBmwTi1T4)

操作は、DDSKKに付属するチュートリアル（`M-x skk-tutorial`）で一通り練習できます。

以下にDDSKKの設定を示します。長いようですが、大半は辞書の設定です。

```elisp:init.el
(use-package ddskk
  :bind (("C-x C-j" . skk-mode))
  :preface
  ;; MELPA 版には skk-setup.el が同梱されないため isearch 連携を自前で設定する。
  ;; skk.el は isearch-mode-hook に "skk" を含むシンボルが無いと警告を出すので
  ;; lambda ではなく名前付き関数で登録する。
  (defun my/skk-isearch-setup-maybe ()
    (when (and (bound-and-true-p skk-mode) skk-isearch-mode-enable)
      (skk-isearch-mode-setup)))
  (defun my/skk-isearch-cleanup-maybe ()
    (when (and (featurep 'skk-isearch) skk-isearch-mode-enable)
      (skk-isearch-mode-cleanup)))
  :hook ((isearch-mode . my/skk-isearch-setup-maybe)
         (isearch-mode-end . my/skk-isearch-cleanup-maybe))
  :init
  (setq default-input-method "japanese-skk")
  (setq skk-large-jisyo (expand-file-name "~/.skk/SKK-JISYO.L"))
  ;; M-x skk-get で ~/.skk に入れた追加の辞書。SKK-JISYO.L の候補の後ろに、この順で加わる。
  ;; EUC-JIS-2004 で書かれた辞書は文字コードを組で渡す（無指定は EUC-JP として読まれる）
  (setq skk-extra-jisyo-file-list
        (mapcar (lambda (entry)
                  (if (consp entry)
                      (cons (expand-file-name (car entry) "~/.skk") (cdr entry))
                    (expand-file-name entry "~/.skk")))
                '("SKK-JISYO.jinmei"                    ; 人名
                  ("SKK-JISYO.fullname" . euc-jis-2004) ; フルネーム
                  "SKK-JISYO.propernoun"                ; 固有名詞
                  "SKK-JISYO.geo"                       ; 地名
                  "SKK-JISYO.station"                   ; 駅名
                  "SKK-JISYO.okinawa"                   ; 沖縄辞書
                  "SKK-JISYO.law"                       ; 法律用語
                  "SKK-JISYO.assoc"                     ; 連想と略語
                  "SKK-JISYO.mazegaki"                  ; 交ぜ書き
                  "SKK-JISYO.pubdic+"                   ; pubdic からの追加語
                  "SKK-JISYO.JIS2"                      ; JIS 第二水準の漢字
                  ("SKK-JISYO.JIS2004" . euc-jis-2004)  ; JIS2004 の互換漢字
                  ("SKK-JISYO.JIS3_4" . euc-jis-2004)   ; JIS 第三・第四水準の漢字
                  "SKK-JISYO.lisp"                      ; Lisp の式で候補を作る
                  "SKK-JISYO.edict"                     ; 英単語から日本語（/ の abbrev モード用）
                  ("SKK-JISYO.zipcode" . euc-jis-2004)  ; 郵便番号から住所
                  ("SKK-JISYO.office.zipcode" . euc-jis-2004)))) ; 事業所の郵便番号
  ;; 異体字辞書は専用の変数で指定する
  (setq skk-itaiji-jisyo (expand-file-name "~/.skk/SKK-JISYO.itaiji"))
  ;; skk-jisyo-code は大辞書 (EUC-JP) にも効くので使わない
  (setq skk-jisyo '("~/.skk-jisyo" . utf-8))
  (setq skk-show-annotation t)
  (setq skk-egg-like-newline t)        ; ▼モードでの RET は確定のみ
  ;; 「 や ( を打つと対になる文字も入れてカーソルをその間に置く。
  ;; 対の組は skk-auto-paren-string-alist の既定。閉じ文字の読み飛ばしはしないので C-f で抜ける
  (setq skk-auto-insert-paren t)
  ;; プログラムのコメントと文字列の外、読み取り専用の場所では自動で英字入力にする。
  ;; context-skk は読み込むだけで context-skk-mode が有効になる
  (with-eval-after-load 'skk
    (require 'context-skk)))
```

`C-x C-j`でDDSKKのオンとオフを切り替えます。`default-input-method`にもDDSKKを指定しているので、Emacs標準の入力切り替えキーである`C-\`でも同じように切り替わります。辞書は`M-x skk-get`で、保存先のディレクトリを指定してまとめてダウンロードできます。私は`~/.skk`に置いています。

大辞書にはSKK-JISYO.Lを、個人辞書にはUTF-8の`~/.skk-jisyo`を使います。SKK-JISYO.LはEUC-JPで書かれているので、`skk-jisyo-code`で文字コードを指定すると、大辞書の読み込みにも効いてしまいます。そこで`skk-jisyo`にファイル名と文字コードを組で渡し、個人辞書だけをUTF-8にしています。

人名、地名、駅名、郵便番号などの追加の辞書は、`skk-extra-jisyo-file-list`に並べます。変換候補は、SKK-JISYO.Lの候補の後ろに、並べた順で加わります。EUC-JIS-2004で書かれた辞書は、ファイル名と文字コードを組で指定します。異体字の辞書だけは、専用の`skk-itaiji-jisyo`で指定します。

MELPA版のDDSKKにはskk-setup.elが同梱されないので、isearchとの連携は自分で登録します。lambdaではなく名前付きの関数にしているのは、`isearch-mode-hook`にskkを含む名前の関数がないと、skk.elが警告を出すためです。`skk-show-annotation`は変換候補に注釈を表示し、`skk-egg-like-newline`は▼モードでのRETを確定だけにします。`skk-auto-insert-paren`は、括弧のセクションで触れた設定です。context-skkは、読み込むだけで有効になります。DDSKKの本体を読み込んだ後に、続けて読み込むようにしています。

## OSのIMEを使う場合

SKKの入力方法に慣れるには時間がかかります。普段使っているmacOSのIMEのまま、Emacsで日本語を書きたい人も多いはずです。ただ、OSのIMEを日本語入力にしたままEmacsを操作すると、`C-x`に続けて打つ文字や、`M-x`で打つコマンド名がIMEに取られてしまいます。sisは、この問題をEmacsの側で解決するパッケージです。

```elisp:init.el
;; コマンド入力時は英数に戻し、カーソル色で入力ソースを示す
(use-package sis
  :config
  (sis-ism-lazyman-config
   "com.apple.keylayout.ABC"
   "jp.monokakido.inputmethod.Kawasemi4.japanese")
  (sis-global-respect-mode 1)
  (sis-global-cursor-color-mode 1))
```

sisは、macismというコマンドを通してmacOSの入力ソースを切り替えます。macismはHomebrewで入れられます。

```bash
brew install laishulu/homebrew/macism
```

`sis-ism-lazyman-config`には、英数入力と日本語入力に使う入力ソースのIDを順に渡します。私はmacOS標準の日本語入力ではなく、物書堂のかわせみ4を使っているので、2つ目の引数はかわせみ4のIDになっています。macOS標準の日本語入力を使うなら、`com.apple.inputmethod.Kotoeri.RomajiTyping.Japanese`を指定します。使っている入力ソースのIDは、その入力ソースに切り替えた状態でターミナルから`macism`を引数なしで実行すると確認できます。

`sis-global-respect-mode`を有効にすると、`C-c`や`C-x`などの接頭キーを押したときに、その時点の入力ソースをバッファに記録してから英数に切り替えます。ミニバッファも英数で始まるので、`M-x`でコマンド名を打つときに日本語入力が邪魔をしません。ミニバッファを抜けたときや、別のバッファから戻ったときには、記録しておいた入力ソースに戻します。`sis-global-cursor-color-mode`は、日本語入力のあいだカーソルの色を変えるので、今どちらの入力ソースなのかが一目で分かります。

私自身はEmacsではDDSKKを使っていますが、sisも有効にしています。Emacs以外のアプリではかわせみ4で日本語を書いているので、入力ソースが日本語のままEmacsに戻り、うっかりそのまま打ち始めてしまうことがあるからです。sisはバッファに記録しておいた英数の状態に戻すので、DDSKKとOSのIMEがぶつかりません。

## まとめ

フォントは、更紗ゴシックだけを使えば1行で揃います。欧文に別のフォントを使うなら、`string-pixel-width`で幅を測って倍率を決め、記号の範囲と絵文字も同じように揃えます。測ってから設定するので、使うフォントが変わっても同じ手順で合わせられます。

括弧は、electric-pair-modeが全角の括弧も最初から閉じます。DDSKKで入力するときだけは、DDSKK側の`skk-auto-insert-paren`で閉じます。

日本語入力は、DDSKKを使えばEmacsの中で完結します。context-skkと追加の辞書を加えると、コードとコメントを行き来する編集や、人名や地名の変換も楽になります。OSのIMEを使う場合や、Emacsの外で日本語入力を使う場合は、sisがコマンド入力のたびに英数へ戻します。

次回は、Org modeでタスクと情報を管理する設定を扱います。

[^berkeley]: Berkeley MonoはU.S. Graphicsが販売している有償のフォントで、個人で使う場合もライセンスの購入が必要です。個人的に気に入っているフォントで、ターミナルでも使っています。
