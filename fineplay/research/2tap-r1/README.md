# 2TAP UX RONDO — FINEPLAY R1

2タップは上限ではない。操作を足す前に、その必要性を問う。今回は既存0.4.1の画像・CSS・ゲームルールを維持した有限改善。

## BEFORE → AFTER
| 対象 | BEFORE | AFTER |
|---|---|---|
| 対局中メンバー欄から招待URLをコピー | 招待 → ダイアログ → コピー（ボタン2回） | 招待URLをコピー（ボタン1回） |
| クリップボード拒否時 | 選択可能なURL欄へ | 同じ代替経路を維持 |
| 入室画面・ゲームの絵柄 | 承認済み素材と配置 | 変更なし |

375×812 / 390×844 / 414×896 のEdge Chromiumモバイルエミュレーションで、横あふれなし。コピー内容一致と拒否時の代替を3幅とも確認。これは実スマホ・人による使いやすさ評価ではない。

## 開く → 用事を果たす
新規作成者：名前入力 → 部屋作成 → ロビーの招待URLコピー → 相手が参加 → 開始。参加者：招待URLを開く → 名前入力 → 参加 → 質問（文章は任意）→ 出題者が回答。2つの独立ブラウザコンテキストから実PeerJS通信で最初の回答同期までPASS。Discord送信や複数の実端末は未実施。今回の2→1は**対局中の追加招待**であり、新規作成全体が1操作になったという意味ではない。

## 操作分類
| 操作 | 分類 | 扱い |
|---|---|---|
| 名前入力・参加・出題者の回答 | REQUIRED | 誰の操作かとゲームの意味を維持 |
| 招待先の部屋IDを再入力 | DERIVABLE | URLから取得する既存方式を維持 |
| 初回の出題者・発表方式 | DEFAULTABLE | 現在の既定値を見せ、変更手段を維持 |
| 質問メモ・訂正・遊び方 | DEFERRABLE | 声だけ／必要時に開く既存経路を維持 |
| コピー前の専用招待ダイアログ | REMOVE | ボタン自体に動作名を明示し直接コピー |

[UI測定前](invite-before.json) / [UI測定後](invite-after.json) / [実通信・利用経路](journey.json) / [ルールテスト30/30](fp-rules-test.txt) / [変更しなかったコードのハッシュ](baseline.json)
[画面前](fp-invite-before-390.png) / [画面後](fp-invite-after-390.png)。画像中の人物名は合成テスト名。入室画面は [前](fp-entry-before-390.png) / [後](fp-entry-after-390.png)。

再実行：Python+Playwright+Edge、作業ルートの `fp/` にこのrepo、`mj/` にshuryo-techoを配置。付属measure.py / invite-test.py / journey.pyを作業ルートへコピーし、`python measure.py after`、`python invite-test.py after`、`python journey.py`。UI fixtureと実PeerJS試験は別々に記録する。
