---
title: "AI時代のEmacs設定術(2): Org modeでタスクと情報を管理する"
emoji: "📋"
type: "tech"
topics: ["emacs", "orgmode", "orgroam", "mermaid", "lilypond"]
published: true
---

![Cover](/images/emacs-init-org/cover.webp)

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/10/emacs-init-el/02-emacs-init-org/) からの転載です。連載「AI時代のEmacs設定術」の第2回です。

- 前回: [AI時代のEmacs設定術(1) - Emacsで日本語を自在に](https://zenn.dev/yostos/articles/emacs-init-japanese)
- 次回: [AI時代のEmacs設定術(3): EmacsでClaude CodeとLLMを操る](https://zenn.dev/yostos/articles/emacs-init-claude-code)
:::

<!-- textlint-disable -->
<!-- author-approved: コード中の省略記号「……（省略）……」をそのまま引用しているため -->

この記事では、私のinit.elのうちOrg modeに関わる部分を抜き出して紹介します。コード中の「……（省略）……」は、その節の話題に関係しない設定を省いた箇所です。init.elの全体は[Gist](https://gist.github.com/yostos/631d858c283b1a15fc487f474c837a86)で公開しているので、省いた部分も含めて確認したいときはこちらを参照してください。

<!-- textlint-enable -->

## Org modeとは

Org modeは、Emacsに標準で入っているメジャーモードです。拡張子`.org`のプレーンテキストに、行頭の`*`で見出しを付けて書きます。見出しは階層を持ち、`TAB`で折りたたんだり展開したりできるので、長いファイルでも全体の構成を見渡せます。

見出しにはTODOの状態、期日、タグを付けられます。org-agendaを開くと、複数のファイルに散らばったTODOや期日を1つの一覧で確認できます。メモを書くファイルが、そのままタスク管理の道具になります。

表、リンク、実行できるコードブロックも同じファイルに書けます。書いた文書はHTMLやMarkdown、LaTeXに書き出せます。中身はただのテキストなので、Gitでの管理やgrepでの検索もそのままできます。

## メモとタスクの置き場所を`~/org`に決める

Org modeのファイルは、すべて`~/org`の下に置き、ここをorg-agendaの対象にしています。どのファイルに書いたTODOもorg-agendaの一覧に集まります。TODOの状態はTODOとDONEの2つだけにし、完了した時刻を記録します。字下げ表示、折り返し、org-modernの描画で、ファイルを読みやすく整えています。

```elisp:init.el
(use-package org
  :ensure nil
  :bind (("C-c a" . org-agenda)
         ("C-c c" . org-capture)
         ("C-c l" . org-store-link)
         ("C-c b" . org-mark-ring-goto)
         :map org-mode-map
         ("C-c C-w" . my/org-refile-dwim))
  ;; テキストを折り返す
  :hook (org-mode . visual-line-mode)
  :custom
  ;; 基本
  (org-directory "~/org/")
  (org-agenda-files '("~/org/"))
  ;; 完了時刻を記録する
  (org-log-done 'time)
  (org-todo-keywords '((sequence "TODO" "DONE")))
  (org-tag-alist '(("CURRENT_AFFAIRS" . ?C)
                   ("GUITAR"         . ?G)
                   ("TECHNOLOGIES"   . ?t)
                   ("TRIVIALITIES"   . ?v)
                   ("FOOD"           . ?f)
                   ("FINANCE"        . ?n)))
  ;; プロパティなどを字下げする
  (org-adapt-indentation 'headline-data)
  ;; 見出しレベルに合わせて本文を字下げ表示する（org-indent-mode）
  (org-startup-indented t)
  ;; GUI でもターミナルと同じキーを使う
  (org-use-extra-keys t)
  ;; ……（省略）……
  )

;; 見出し・タグ・日付・チェックボックスなどを整えて描画する（テキストは変えない）
(use-package org-modern
  :hook ((org-mode . org-modern-mode)
         (org-agenda-finalize . org-modern-agenda)))
```

## 思いついたことをすぐに書き留める

思いついたことは、org-captureでまずinbox.orgに書き留めます。org-captureは、どのバッファからでも`C-c c`で入力用の画面を開き、書いた内容をあらかじめ決めたファイルの見出しの下へ追加する機能です。書き留める時点では、どこに置くかを考えません。置き場所は、後でinbox.orgを見直すときに決めます。

テンプレートは、メモ、タスク、後で読む記事の3種類です。inbox.orgにはNotes、Tasks、Read Laterの3つの見出しを用意してあり、テンプレートごとに対応する見出しの下へ入ります。どのテンプレートでもタグを尋ね、作成した日時を記録します。

タスクと後で読む記事には、テンプレートから自作の関数を呼ぶ処理を入れています。タスクでは期日を尋ね、入力があればDEADLINE行を作ります。期日は`+2`や`fri`や`12/25`のように短く入力でき、空欄のままならDEADLINE行は作りません。後で読む記事では、クリップボードの中身がURLならその行を取り込みます。ブラウザでURLをコピーしてからorg-captureを使えば、貼り付ける手間が省けます。

もう1つ重視しているのが、Mewのメールからタスクを作るテンプレートです。MewはEmacsの中で動くメールクライアントです。メール、メモ、タスクをすべて同じEmacsの中のテキストとして扱えるので、Emacsが私のテキストハブになっています。返信や対応が必要なメールを読んでいるときに`C-c c M`を押すと、差出人と件名を見出しにしたTODOがinbox.orgのTasksに入ります。入力画面は開かず、その場で登録が終わります。

メールのTODOには元のメールへのリンクが付きます。リンクを作るのはorg-contribに含まれるol-mewです。org-agendaでタスクを見て、リンクを開けばMewでそのメールに戻れます。メールの受信箱をタスクリストとして使わずに済み、メールで来た用事も他のタスクと同じorg-agendaで管理できます。

終わったタスクを片付ける仕組みも用意しました。inbox.orgの項目は、org-refile（`C-c C-w`）で別のファイルや見出しの下へ移せます。この`C-c C-w`に自作の関数を割り当て、DONEにしたタスクでは移動先の候補をtask-archive.orgの見出しだけに絞っています。完了したら`C-c C-w`を押して見出しを選ぶだけで、タスクがアーカイブへ移ります。

```elisp:init.el
;; --- capture テンプレートから呼ぶ関数 ---------------------------

(defun my/org-capture-deadline ()
  "期日を尋ね、DEADLINE 行を返す。空欄のときは行を作らない。"
  (let ((input (read-string "Deadline (empty to skip; e.g. +2, fri, 12/25): ")))
    (if (string-match-p "\\`[[:space:]]*\\'" input)
        ""
      (concat "DEADLINE: "
              (format-time-string "<%Y-%m-%d %a>" (org-read-date nil t input))
              "\n"))))

(defun my/org-capture-clipboard-url ()
  "クリップボードの内容が URL ならその行を返す。URL でなければ空文字列。"
  (let ((s (ignore-errors (current-kill 0 t))))
    (if (and (stringp s)
             (string-match "\\`[[:space:]]*\\(https?://[^[:space:]]+\\)" s))
        (concat (match-string 1 s) "\n")
      "")))

(use-package org
  ;; ……（省略）……
  :custom
  ;; capture（C-c c）。すべて inbox.org の見出し配下に入れる
  (org-default-notes-file "~/org/inbox.org")
  (org-capture-templates
   '(("m" "Notes" entry
      (file+olp "~/org/inbox.org" "Notes")
      "* %^{Title}  %^g\n%U\n%?"
      :empty-lines 1)
     ("t" "Tasks" entry
      (file+olp "~/org/inbox.org" "Tasks")
      "* TODO %?  %^g\n%(my/org-capture-deadline)%U\n"
      :empty-lines 1)
     ("r" "Read Later" entry
      (file+olp "~/org/inbox.org" "Read Later")
      "* TODO %^{Title}  %^g\n%(my/org-capture-clipboard-url)%U\n%?"
      :empty-lines 1)
     ;; Mew のメールから起動する（ol-mew が %:fromname / %:subject を埋める）
     ("M" "Mail Task" entry
      (file+olp "~/org/inbox.org" "Tasks")
      "* TODO %:fromname: %:subject\n%a\n%U\n"
      :empty-lines 1
      :immediate-finish t)))
  ;; ……（省略）……
  )

;; Mew のメールへのリンク（ol-mew）。Mail Task テンプレートが使う
(use-package org-contrib
  :after org
  :config
  (with-eval-after-load 'mew
    (require 'ol-mew)))
```

## コードブロックで図や楽譜を作る

Org modeでは、コードを`#+begin_src`と`#+end_src`の行で囲むとコードブロックになります。`#+begin_src`の後ろに言語名を書くと、ブロックの中がその言語の文法に従ってハイライト表示されます。ブロックの中で`C-c '`を押すと、その言語のメジャーモードで開いた別のバッファでコードを編集できます。HTMLやMarkdownに書き出すときも、コードブロックとして出力されます。

```org
#+begin_src python
print("Hello, Org mode")
#+end_src
```

このコードブロックを実行する機能がBabelです。コードブロックの上で`C-c C-c`を押すと、コードが実行され、結果がブロックの直後の`#+RESULTS:`に書き込まれます。結果が画像ファイルなら、そのファイルへのリンクが入ります。コードと実行結果を同じ文書に並べて残せるので、手順のメモや検証の記録に向いています。

Babelで実行できるのは、`org-babel-load-languages`で有効にした言語だけです。初期状態ではEmacs Lispしか有効になっていません。私はEmacs Lisp、シェル、Pythonのほか、MermaidとLilyPondを有効にしています。実行の前には毎回確認を求められますが、これは意図しないコードの実行を防ぐための既定の動作なので、そのままにしています。

Mermaidは、テキストでフローチャートやシーケンス図を描くための記法です。Org modeの本体にはMermaid用の実行機能が含まれないので、ob-mermaidというパッケージを追加しています。図の生成にはmermaid-cliの`mmdc`コマンドを使うので、miseで別途インストールしています。

たとえば、次のように書いて`C-c C-c`を押すと、Mermaidの図がflow.pngに書き出されます。

```org
#+begin_src mermaid :file flow.png
flowchart LR
  A[org-capture] --> B[inbox.org]
  B --> C[org-refile]
  C --> D[task-archive.org]
#+end_src

#+RESULTS:
[[file:flow.png]]
```

LilyPondは、テキストで書いた楽譜をPDFや画像に組版するソフトウェアです。Homebrewでインストールし、`org-babel-lilypond-commands`にLilyPond本体、PDFビューア、MIDIプレーヤーの3つのコマンドを指定しています。ビューアとプレーヤーを`open`にしたので、PDFとMIDIのファイルはmacOSの既定のアプリで開きます。ギターの練習フレーズやコード進行を、メモと同じファイルに楽譜として残せます。

楽譜も同じ書き方で、画像として書き出せます。

```org
#+begin_src lilypond :file scale.png
\relative c' { c4 d e f g a b c }
#+end_src
```

書き出した画像は、`C-c C-x C-v`で文書の中に表示できます。

書いた文書は、ox-gfmでGitHub Flavored Markdownに書き出せます。エクスポートのメニュー（`C-c C-e`）にGitHub Flavored Markdownの項目が加わります。

```elisp:init.el
(use-package org
  ;; ……（省略）……
  :custom
  ;; babel
  (org-babel-lilypond-commands '("/opt/homebrew/bin/lilypond" "open" "open"))
  :config
  ;; ……（省略）……
  (org-babel-do-load-languages
   'org-babel-load-languages
   '((emacs-lisp . t)
     (shell . t)
     (lilypond . t)
     (python . t)
     (mermaid . t))))

;; Mermaid は org 本体に含まれないので ob-mermaid を入れる
(use-package ob-mermaid
  :after org)

;; GitHub Flavored Markdown へのエクスポート
(use-package ox-gfm
  :after ox)
```

## org-roamでメモをリンクでつなぐ

org-roamは、Org modeの上で動くノート管理のパッケージです。ここまで紹介したOrg modeの使い方では、inbox.orgのような少数のファイルに見出しを足して書き込んでいきます。org-roamでは、1つのトピックを1つのファイルに書きます。このファイルをノードと呼び、`~/org/roam`の下にタイムスタンプをファイル名にして保存します。ノードもOrgのファイルなので、見出し、TODO、コードブロックなど、Org modeの機能はそのまま使えます。

org-roamの強みは、ノード同士をリンクでつなげることです。`C-c n i`でノードのタイトルを選ぶと、そのノードへのリンクが入ります。まだないタイトルを入力すれば、新しいノードを作ってリンクします。Wikiのページを書きながら別のページへのリンクを張っていくのと同じ感覚です。リンク先のノードでは、どのノードから参照されているかをバックリンクとして一覧できます。書いたときには意識していなかったノード同士のつながりが、後からバックリンクで見つかります。ノードが増えるほど、リンクをたどって関連する知識へ行き着けるナレッジベースになります。

私がOrg modeでいちばん使っているのは、実はorg-roamです。`~/org`のinbox.orgとアーカイブはタスクの管理に使い、調べたことや考えたことはorg-roamのノードとして残しています。ブログ記事のアイディアを練るのも、下書きを書くのもorg-roamです。この記事も、ブログ記事のテンプレートで作ったノードに書いています。日々の記録は、次の節で紹介するorg-roam-dailiesを使って日誌として書いています。

設定では、ノードをフォルダーで分けず、タグだけで分類しています。そのため、ノードの一覧にはタグを表示します。テンプレートは、空のノード、選択範囲の取り込み、ブログ記事の3つです。ブログ記事のテンプレートでは、概要とスラッグを尋ね、公開状態をDraftにしたノードを作ります。ノードの検索、バックリンクとリンク先の一覧、ノード全体の全文検索にはconsult-org-roamを使います。

```elisp:init.el
(use-package org-roam
  :custom
  (org-roam-directory (file-truename "~/org/roam"))
  ;; ノード一覧にタグを表示する（分類はタグのみなので）
  (org-roam-node-display-template
   (concat "${title:*} " (propertize "${tags:20}" 'face 'org-tag)))
  ;; org-roam-extract-subtree 用のファイル名
  (org-roam-extract-new-file-path "%<%Y%m%d%H%M%S>.org")
  (org-roam-capture-templates
   '(("d" "default" plain "%?"
      :target (file+head
               "%<%Y%m%d%H%M%S>.org"
               "#+title: ${title}\n#+filetags: \n#+date: %U\n#+startup: showall\n")
      :unnarrowed t)
     ("c" "clip" plain "%i\n\n%?"
      :target (file+head "%<%Y%m%d%H%M%S>.org"
                         "#+title: ${title}\n")
      :unnarrowed t)
     ;; ブログ記事。blog_status は Draft → published と書き換える
     ("b" "blog" plain "* ${title}\n\n%?"
      :target (file+head
               "%<%Y%m%d%H%M%S>.org"
               "#+title: ${title}\n#+filetags: :BLOG:\n#+date: %U\n#+startup: showall\n#+description: %^{Description}\n#+blog_slug: %^{Slug}\n#+blog_site: myblog\n#+blog_status: Draft\n")
      :unnarrowed t)))
  ;; ……（省略）……
  :bind (("C-c n f" . org-roam-node-find)
         ("C-c n i" . org-roam-node-insert)
         ("C-c n c" . org-roam-capture)
         ("C-c n l" . org-roam-buffer-toggle)
         ("C-c n t" . org-roam-tag-add)
         ("C-c n e" . org-roam-extract-subtree))
  ;; ……（省略）……
  :config
  ;; ……（省略）……
  (org-roam-db-autosync-mode))

;; org-roam のノード選択・リンク辿り・全文検索を consult の UI にする
(use-package consult-org-roam
  :after (consult org-roam)
  :custom
  (consult-org-roam-grep-func #'consult-ripgrep)
  :bind (("C-c n b" . consult-org-roam-backlinks)
         ("C-c n o" . consult-org-roam-forward-links)
         ("C-c n s" . consult-org-roam-search))
  :config
  (consult-org-roam-mode 1)
  ;; 全文検索は consult-ripgrep と同じく M-. で手動プレビューにする
  (consult-customize
   consult-org-roam-search
   :preview-key "M-."))
```

## 日誌を1日1ファイルで書く

Org modeの標準機能だけでも日誌は書けます。org-captureのテンプレートで`file+datetree`を指定すると、1つのファイルに年、月、日の見出しを自動で作り、その日の見出しの下に書き足していけます。ただし、この方法では何年分もの日誌が1つのファイルに溜まり、ノートとは別の場所で管理することになります。

org-roamに付属するorg-roam-dailiesを使うと、日誌を1日1ファイルで書けます。ファイルは`~/org/roam/daily`の下に日付をファイル名にして作られ、1日分の日誌が1つのノードになります。日誌もノードなので、ほかのノードと同じようにリンクでつなげます。日誌に何かを試したと書くときに、その知識のノードへリンクを張っておくと、知識のノードのバックリンクに日誌の日付が並びます。あるトピックについて、いつ調べ、いつ使ったかを後からたどれます。consult-org-roamの全文検索も日誌を含めて探すので、「あの作業をしたのはいつだったか」もすぐに見つかります。

日誌のファイルにはLogとNotesの2つの見出しを最初から用意しています。その日にしたことはLogに、時刻を見出しにして1行ずつ足していきます。まとまった考えや後で読み返したいことはNotesに書き、作成した日時を記録します。日誌にはJOURNALのタグを付けるので、ノードの一覧でもほかのノードと区別できます。

日誌の操作は`C-c n j`の下にまとめています。`C-c n j n`で今日の日誌に追記し、`C-c n j d`で今日の日誌を開きます。`C-c n j c`ではカレンダーから日付を選んで開き、`C-c n j b`と`C-c n j f`で前後の日誌に移動できます。

```elisp:init.el
;; 日誌は 1 日 1 ファイル。Log / Notes の 2 見出しを最初から用意する
(defconst my/org-roam-dailies-head
  "#+title: %<%Y-%m-%d %a>\n#+filetags: :JOURNAL:\n\n* Log\n* Notes\n"
  "org-roam-dailies の日誌ファイルの先頭に入れるテンプレート。")

(use-package org-roam
  :custom
  ;; ……（省略）……
  ;; 日誌（org-roam-dailies）は 1 回ごとに時刻付きの見出しを足す
  (org-roam-dailies-capture-templates
   `(("l" "Log" entry
      "* %<%H:%M> %?"
      :target (file+head+olp "%<%Y-%m-%d>.org" ,my/org-roam-dailies-head ("Log")))
     ("n" "Notes" entry
      "* %?\n%U"
      :target (file+head+olp "%<%Y-%m-%d>.org" ,my/org-roam-dailies-head ("Notes")))))
  ;; ……（省略）……
  ;; 日誌の操作は付属の org-roam-dailies-map を C-c n j の下にまとめる
  ;; （n: 今日に追記 / d: 今日を開く / c: 日付を選んで開く / b・f: 前後の日誌）
  :bind-keymap ("C-c n j" . org-roam-dailies-map)
  :config
  ;; org-roam-dailies-map は org-roam-dailies.el にあるので一緒に読み込む
  (require 'org-roam-dailies)
  ;; ……（省略）……
  )
```

## まとめ

私のOrg modeの使い方は、タスクの管理と知識の管理の2つに分かれています。タスクは、思いついたことやメールで来た用事をorg-captureでinbox.orgに書き留め、org-agendaで一覧し、終わったらtask-archive.orgへ移します。知識は、調べたことや考えたこと、ブログ記事のアイディアをorg-roamのノードとして書き、リンクでつないでナレッジベースに育てます。日誌もノードとして書くので、日々の記録が知識のノードとリンクでつながります。

メール、メモ、タスク、日誌は、すべてEmacsの中のテキストです。コードブロックを使えば、図や楽譜まで同じ文書に残せます。置き場所がEmacsだけになったことで、どこに書いたかを探す手間がなくなりました。

これからOrg modeを試すなら、まずはorg-captureとinbox.orgだけで始めるのがおすすめです。書き留める習慣が付いてから、org-roamでノードをつなぐ段階に進めば十分です。紹介した設定の全体は、冒頭のGistで確認できます。

次回は、EmacsでClaude CodeとLLMを操る設定を扱います。

## References

確認日はいずれも2026年10月12日です。

- [The Org Manual](https://orgmode.org/manual/)
- [The Org Manual](https://orgmode.org/manual/Capture-templates.html). "Capture templates"
- [Worg](https://orgmode.org/worg/org-contrib/babel/languages/index.html). "Babel: Languages"
- [org-modern](https://github.com/minad/org-modern)
- [org-contrib](https://git.sr.ht/~bzg/org-contrib)（ol-mewを含む）
- [Mew](https://www.mew.org/)
- [ob-mermaid](https://github.com/arnm/ob-mermaid)
- [mermaid-cli](https://github.com/mermaid-js/mermaid-cli)
- [LilyPond](https://lilypond.org/)
- [ox-gfm](https://github.com/larstvei/ox-gfm)
- [org-roam](https://github.com/org-roam/org-roam)
- [Org-roam User Manual](https://www.orgroam.com/manual.html)（org-roam-dailiesの章を含む）
- [consult-org-roam](https://github.com/jgru/consult-org-roam)
