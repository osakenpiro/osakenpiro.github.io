# x-post スキル（X投稿 Web Intent方式）
## なにこれ
X投稿を確実に通すための、Claude用の手順書（skill）。
## 特徴
- Web Intent URLが正 — compose欄へのDOM注入は全滅する。intent URLなら本文が消えない。
- 役割分担 — 本文=intent URL、画像=file_upload、リンクとタグはリプに分離。
- スレッド化 — in_reply_toで連結。初実戦は「夢見る少女は眠れない」のX初報。
## つかいかた
1. 本文をx_intent.pyでintent URLにする
2. URLへnavigateして、入った本文を検証する
3. 画像はfind→file_uploadで添える
## モチーフ
伝書鳩の足輪（巻いた手紙がほどけない結び方）
## FAQ
- Q: なぜ貼り付けじゃだめ？ A: Draft.js系の編集箱は、貼っても再renderで本文が消える。Xアプリ自身のstateに入れるのが安定。
※ リポ（claude-shared）はprivate。このページは台帳からの窓口で、skill本体は中の人専用。
