---
title: "AI時代のEmacs設定術(3): EmacsでClaude CodeとLLMを操る"
emoji: "🤖"
type: "tech"
topics: ["emacs", "claudecode", "gptel", "llm", "1password"]
published: true
---

![Cover](/images/emacs-init-claude-code/cover.webp)

:::message
この記事は [codedchords.dev](https://codedchords.dev/blog/2026/10/emacs-init-el/03-emacs-init-claude-code/) からの転載です。連載「AI時代のEmacs設定術」の第3回です。

- 前回: [AI時代のEmacs設定術(2): Org modeでタスクと情報を管理する](https://zenn.dev/yostos/articles/emacs-init-org)
:::

Claude Codeはターミナルで、LLMはブラウザで使うのが一般的です。Emacsなら、どちらもバッファの中で扱えます。編集中のファイルや書きためたメモを、エディタを離れず、そのままLLMへ渡せます。

連載「AI時代のEmacs設定術」の3回目となるこの記事では、Claude CodeとLLMをEmacsから使うための設定を、私のinit.elから抜き出して解説します。init.elの全体は[Gist](https://gist.github.com/yostos/631d858c283b1a15fc487f474c837a86)で公開しています。

## EmacsからLLMを呼び出す環境を整える

この記事で紹介するEmacsのパッケージclaude-code.elとgptelは、どちらも外部のコマンドを使います。claude-code.elはClaude Codeの`claude`コマンドを呼び出します。gptelには、LLMの認証情報を取り出すために、1PasswordのCLIである`op`コマンドを呼び出す設定を入れています。

ところが、GUIアプリとして起動したEmacsでは、これらのコマンドを置いたディレクトリにPATHが通っていません。macOSのGUIアプリはlaunchdから直接起動され、シェルを経由しないからです。PATHの設定はシェルの設定ファイルに書かれているので、GUIアプリには反映されません。その結果、Emacsから`claude`や`op`を呼ぶと、コマンドが見つからないというエラーになります。

そのため、シェルと同じPATHと環境変数をEmacsに取り込む仕組みが必要です。

exec-path-from-shellは、Emacsの起動時にシェルを1回起動し、そのシェルのPATHをEmacsに設定するパッケージです。macOSのGUIで起動したときだけ動くように、`:if`で条件を付けています。

ふだんは使いませんが、検証のときなどに、認証情報を`~/.env`に書いてdirenvで環境変数に設定することもあります[^1]。direnvは、シェルがプロンプトを表示するときに環境変数を設定する仕組みなので、exec-path-from-shellではこの変数を取り込めません。そこで`~/.env`を直接読んで環境変数に設定する関数`my/load-dotenv`を書きました。これで、Emacsの中で起動したClaude Codeも、Claude Codeが作業中に実行するコマンドも、ターミナルと同じ環境変数を参照できます。

```elisp:init.el
(use-package exec-path-from-shell
  :if (memq window-system '(mac ns))
  :config
  (exec-path-from-shell-initialize))

;; ~/.env（direnv の dotenv 用）を読み込む。
;; direnv の hook はプロンプト表示時にしか動かず、exec-path-from-shell では取れないため
(defun my/load-dotenv (&optional file)
  "FILE（既定 ~/.env）の KEY=VALUE を環境変数に設定する。"
  (interactive)
  (let ((file (expand-file-name (or file "~/.env"))))
    (when (file-readable-p file)
      (with-temp-buffer
        (insert-file-contents file)
        (dolist (line (split-string (buffer-string) "\n" t))
          (when (string-match
                 "^\\s-*\\(?:export\\s-+\\)?\\([A-Za-z_][A-Za-z0-9_]*\\)=\\(.*\\)$" line)
            (setenv (match-string 1 line)
                    (string-trim (match-string 2 line) "[ \t\"']*" "[ \t\"']*"))))))))
(my/load-dotenv)
```

## Claude CodeをEmacsのバッファで動かす

Claude Codeは、ターミナルで動かすのが一般的です。ただ、エディタとターミナルを別々のウィンドウで開いていると、作業のたびに両者を行き来する手間がかかります。Claude Codeへ「このファイルの、この行」と伝えるには、ファイル名や行番号、エラーメッセージを自分で書き写さなければなりません。

claude-code.elは、Claude CodeをEmacsのバッファの中で動かすパッケージです。Claude Codeの画面もEmacsのウィンドウの1つになるので、編集中のファイルと並べて表示でき、いつものキー操作で切り替えられます。編集中のファイル、選択範囲、カーソル位置のエラーは、キー1つでClaude Codeに送れます。ファイル名や行番号が要る操作ではclaude-code.elが付けて送るので、書き写す手間がありません。

claude-code.elはMELPAにないので、Emacs 30でuse-packageに加わった`:vc`でGitHubから直接入れています[^2]。

操作のキーは自分で割り当てます。READMEの設定例が`C-c c`なので、事実上はこれが既定です。私は`C-c c`をorg-captureに使っているので`C-c k`にしました。よく使うのは次のキーです。

- `C-c k c`: Claude Codeを起動する。プロジェクトの中ならそのルートで起動する
- `C-c k t`: Claude Codeのウィンドウを表示する、または隠す
- `C-c k r`: 選択範囲を送る。選択していなければバッファ全体を送る
- `C-c k x`: 編集中のファイル名と行番号を付けて指示を送る
- `C-c k e`: カーソル位置のエラーを、ファイル名と行番号を付けて修正させる
- `C-c k m`: すべての操作をメニューから選ぶ

Claude Codeは端末で動くアプリなので、Emacsの中で動かすには端末エミュレータが要ります。claude-code.elが対応しているのはeat、vterm、ghostelの3つです。既定のeatはEmacs Lispだけで書かれていて、ほかに何も入れずに使えます。vtermはCのライブラリlibvtermを使うのでeatより速く動きますが、使う前にネイティブモジュールをコンパイルする必要があります。

Claude Codeは、応答を書き出している間も画面を細かく書き換え続けます。eatとvtermでは、出力が多いときに表示がもたつき、画面が崩れることもありました。

そこで、私はghostelを選びました。ghostelは、ターミナルアプリGhosttyの端末処理を切り出したライブラリlibghosttyを使います。claude-code.elのREADMEでも、vtermより速く、Claude Codeの画面をいちばん忠実に描画すると紹介されています。ネイティブモジュールはビルド済みのものをGitHubからダウンロードできるので、自分でコンパイルする必要もありません。

```elisp:init.el
(use-package claude-code
  ;; MELPA には無いので GitHub から直接取る
  :vc (:url "https://github.com/stevemolitor/claude-code.el" :rev :newest)
  ;; 既定は C-c c だが org-capture に使っているので C-c k に寄せる
  :bind-keymap ("C-c k" . claude-code-command-map)
  :custom
  ;; libghostty ベースの端末エミュレータ（下の ghostel パッケージ）
  (claude-code-terminal-backend 'ghostel)
  :config
  (claude-code-mode 1))

;; claude-code のターミナルバックエンド
(use-package ghostel
  :defer t)
```

## EmacsのバッファをClaude Codeの編集に追従させる

Emacsは、ファイルを開いたときに中身をバッファに読み込み、その後はバッファの内容を表示します。ほかのプログラムがファイルを書き換えても、Emacsの既定の設定では、開いているバッファは自動では更新されません。Claude Codeに修正を頼むと、ディスク上のファイルは新しくなっているのに、画面には修正前の内容が表示されたままです。

この古いバッファを編集しようとすると、Emacsは「changed on disk; really edit the buffer?」と確認を求めます。気づかずに古い内容のまま保存すると、Claude Codeの修正を上書きして消してしまいます。Claude Codeに修正を頼むたびに、自分で`M-x revert-buffer`を実行して読み直すのは手間です。

global-auto-revert-modeを有効にすると、Emacsは外部で書き換えられたファイルを見つけて、そのバッファを自動で読み直します。まだ保存していない変更があるバッファは読み直さないので、自分の編集中の内容が消えることはありません。また、`global-auto-revert-non-file-buffers`も有効にして、Diredのようなファイル以外のバッファも対象にしています。Claude Codeがファイルを作ったり消したりすると、Diredのファイル一覧も更新されます。モードラインに表示するブランチ名などのVC情報も追従するように、`auto-revert-check-vc-info`も有効にしています。

Emacsは既定で、ファイルの変更をOSからの通知で受け取るのに加えて、5秒ごとのポーリングでも確認します。macOSでは通知だけで変更をすぐに拾えるので、`auto-revert-avoid-polling`でポーリングを止め、無駄な処理を減らしています。

もう1つ、ロックファイルを作らない設定も入れています。Emacsは、ファイルを編集し始めると、保存するまでの間、同じディレクトリに`.#ファイル名`というロックファイルを作ります。別のEmacsが同じファイルを編集しようとしたときに、編集中であることを知らせるための目印です。Claude Codeはこの目印を見ずにファイルを書き換えるので、Claude Codeに書き換えさせる前提の使い方では、ロックファイルは衝突を防ぐ役に立ちません。私は`create-lockfiles`をnilにして作らないようにしていますが、複数のEmacsで同じファイルを編集することがあるなら、残しておいてもかまいません。

```elisp:init.el
;; 外部で変更されたファイルを自動で読み直す（Claude Code の編集もこれで拾う）
(global-auto-revert-mode 1)
(setq global-auto-revert-non-file-buffers t)
;; kqueue のファイル通知が使えるので、watch を張れたバッファはポーリングしない。
;; watch を張れない／途中で止まったバッファは自動でポーリングに戻る
(setq auto-revert-avoid-polling t)
;; ブランチ名など モードラインの VC 情報も追従させる
(setq auto-revert-check-vc-info t)

;; .#foo のロックファイルを作らない（Claude Code やファイル監視ツールの邪魔になる）
(setq create-lockfiles nil)
```

## EmacsのバッファでLLMとチャットする

私はふだん、claude-code.elを中心に使っています。ただ、文章の言い回しを直したい、関数の動きを説明してほしいといった、バッファの中のちょっとした頼みごとには重すぎます。claude-code.elに頼むと、ウィンドウが分割され、Claude Codeが起動してから問い合わせることになるからです。

こうした用途にはgptelを使っています。gptelは、EmacsのバッファからLLMのAPIに直接問い合わせるパッケージです。範囲を選んで`M-x gptel-send`を実行すると、選んだ文章が送られ、応答はカーソルの下にそのまま書き込まれます。ウィンドウは分割されず、別のプログラムも起動しません。`C-c G`のメニューからは、応答のエコーエリアへの表示、キルリングへの格納、選択範囲の置き換えといった使い方も選べます。続けて相談したいときは、`C-c g`でチャット用のバッファを開きます。

複数のLLMを使い分けられるのもgptelの利点です。私はClaude、ChatGPT、Geminiの3つを登録し、既定をClaudeにしています。モデルは`C-c G`のメニューで切り替えられるので、同じ質問を別のモデルに投げて答えを比べることもできます。

gptelはAPIを経由する点に注意が必要です。Claude ProやChatGPT Plusのようなサブスクリプションは多くの場合使えず、使った分だけAPIの料金がかかります。料金を気にせず使いたいなら、Ollamaやllama.cppで動かすローカルのLLMをgptelに登録する方法もあります。ローカルのLLMなら料金はかからず、送った文章も手元のマシンの外に出ません。クラウドのLLMのAPIキーの扱いは、次の節で説明します。

```elisp:init.el
(use-package gptel
  :bind (("C-c g" . gptel)          ; チャット用バッファを開く
         ("C-c G" . gptel-menu))    ; モデル切替・送信オプション
  :config
  (gptel-make-openai "ChatGPT"
    :key (lambda ()
           (my/op-read
            "op://VAULT_UUID/OPENAI_ITEM_UUID/credential"))
    :stream t)

  (gptel-make-gemini "Gemini"
    :key (lambda ()
           (my/op-read
            "op://VAULT_UUID/GEMINI_ITEM_UUID/credential"))
    :stream t)

  ;; 既定は Claude。
  ;; claude-sonnet-5-5 は gptel 未収録（2026-10-09 時点）のため既存一覧の先頭に追加し、
  ;; 属性は claude-sonnet-5 のものを暫定で流用する。gptel が収録したら :models ごと外す
  (setq gptel-backend (gptel-make-anthropic "Claude"
                        :key (lambda ()
                               (my/op-read
                                "op://VAULT_UUID/ANTHROPIC_ITEM_UUID/password"))
                        :stream t
                        :models (cons (cons 'claude-sonnet-5-5
                                            (copy-sequence (symbol-plist 'claude-sonnet-5)))
                                      gptel--anthropic-models))
        gptel-model 'claude-sonnet-5-5))
```

## LLMの認証情報を安全に扱う

gptelで外部のLLMのAPIを呼び出すには、APIキーなどの認証情報が必要です。Emacsの設定ファイルであるinit.elをGitHubなどで管理している人は多いでしょう。そうした設定ファイルに認証情報を書き込むわけにはいきません。gptelは既定で`~/.authinfo`などからキーを読みますが、暗号化しなければ、キーは平文のファイルとして手元に残ります。

私は、パスワード管理ツールの1Passwordに認証情報を預けています。1Passwordには`op`というCLIがあり、`op read`に`op://保管庫/アイテム/フィールド`の形の参照を渡すと、登録した値を読み出せます。init.elに書くのはこの参照だけなので、設定ファイルを公開してもキーは漏れません。

gptelの`:key`には、キーの文字列の代わりに関数を渡せます。前の節のコードでは、`:key`に`my/op-read`を呼ぶ関数を渡しています。キーを読み出すのは、最初にLLMへ問い合わせたときで、Emacsの起動時ではありません。

`op read`を実行するたびに、1Passwordは本人確認を求めます。問い合わせのたびに確認が出ると使いにくいので、`my/op-read`は一度読み出した値をハッシュテーブルに保存し、2回目からはそれを返します。保存先はEmacsのメモリの中だけで、ファイルには書き出しません。

参照では、保管庫とアイテムを名前ではなくUUIDで指定しています。名前で指定すると、1Passwordでアイテムの名前を変えたときに参照が切れてしまうからです。UUIDは`op vault list`や`op item list`で確認できます。

```elisp:init.el
(defvar my/op-secret-cache (make-hash-table :test #'equal)
  "op read で取得した値のキャッシュ。リクエストのたびに認証が出ないようにする。")

(defun my/op-read (ref)
  "1Password の参照 REF（op://Vault/Item/field）の値を返す。結果はキャッシュする。"
  (or (gethash ref my/op-secret-cache)
      (with-temp-buffer
        (if (zerop (call-process "op" nil '(t nil) nil "read" "--no-newline" ref))
            (puthash ref (buffer-string) my/op-secret-cache)
          (user-error "op read に失敗した: %s" ref)))))
```

## まとめ

この記事では、EmacsでLLMを使うための設定を紹介しました。Claude Codeはclaude-code.elでバッファの中で動かし、Claude Codeが書き換えたファイルは自動でバッファに読み直します。ちょっとした頼みごとはgptelで複数のLLMに送り、APIキーは1Passwordに預けたまま使います。

LLMを使う環境としては、VS Codeの方が手軽です。GitHub Copilotや各社の公式の拡張機能を入れれば、PATHの設定も、端末エミュレータの選択も、APIキーの管理もほとんど要りません。LLMのベンダーが自ら拡張機能を提供していることが多く、入力しながら続きを提案するインライン補完も洗練されています。Emacsでは、この記事のような設定を自分で組む必要があり、パッケージの多くは有志が開発しています。

その代わり、Emacsには選択肢の多さと自由度があります。Claude Codeのようなエージェントとgptelのようなチャットを用途で使い分けられ、LLMもクラウドとローカルから自由に選べます。足りない機能は、`my/op-read`のようにEmacs Lispで書き足せます。

Emacsの最も大きなメリットは、LLMに活かせるコード以外のテキストもEmacsで扱えるので、それをそのままLLMに橋渡しできることです。私は、[前回の記事](https://zenn.dev/yostos/articles/emacs-init-org)で紹介したOrg modeを使ってメモやタスク、日誌を書いています。メールもEmacsで読んでいます。書きためたメモも、受け取ったメールも、Emacsのバッファとして開けば、そのままLLMに渡せます。メールの返信の下書きも、メモの要約も、コードの修正と同じ操作で頼めます。LLMの答えは、渡す材料で大きく変わります。その材料となるテキストがすべてEmacsの中にあるので、LLMをより深く、より手間なく使えます。

次回は、Emacsでモダンな開発環境を構築する設定を扱います。

[^1]: 継続して使う認証情報は1Passwordの管理下に移し、`op`コマンドで呼び出すことを推奨します。

[^2]: `:vc`は、パッケージをGitなどのリポジトリから直接インストールするuse-packageのキーワードです。Emacs 30から使えます。内部では`package-vc-install`を呼び出します。記事の設定のように`:rev :newest`を指定すると、リリース版ではなく最新のコミットを取得します。

## References

確認日はいずれも2026年10月14日です。

- [exec-path-from-shell](https://github.com/purcell/exec-path-from-shell)
- [direnv](https://direnv.net/)
- [claude-code.el](https://github.com/stevemolitor/claude-code.el)
- [ghostel](https://github.com/dakra/ghostel)
- [Ghostty](https://ghostty.org/)
- [GNU Emacs Manual](https://www.gnu.org/software/emacs/manual/html_node/emacs/Auto-Revert.html). "Reverting a Buffer Automatically"
- [gptel](https://github.com/karthink/gptel)
- [1Password Developer](https://developer.1password.com/docs/cli/). "1Password CLI"
