# BATICON GOLD RUN — Design Rondo v1.0

- Date: 2026-08-29 JST
- Target: 第14回バイトチームコンテストの「現場で使える攻略サイト」
- Users: ケンシロウ＋まいこ（隣で一緒に見る／スマホでWAVE間に確認）
- Status: SELECTED → IMPLEMENTED → VISUAL QA

## 0. 結論

この案件の失敗条件は「情報が足りない」ではなく、**攻略記事をカードに並べただけの、見覚えのあるAIサイトになること**。

選択した体験は次の二層構造。

1. **30秒の計器盤** — スコア列、役割、合図、WAVEごとの一文だけを瞬時に確認できる。
2. **身体に入れる作戦映像** — 大きな数字、時間、方向、動きでシナリオを先に疑似体験する。

コンセプトは、任天堂公式サイトのコピーではなく、

> **クマサン商会の作業指示盤に、二人の攻略メモとインクが侵入した。**

とした。

---

## 1. DISCOVER — Rainから回収した「刺さり」の構造

Raindropのデザイン関連標本は、単に「モダン」「綺麗」ではなく、次の軸へ収束していた。

### A. Kinetic Spatial

- three.jsのランディングページ
- 空間を組み立てるタワー、ワイヤーフレーム、分解図
- スクロールやカーソルで世界が反応するヒーロー

**抽出:** 静止レイアウトではなく、画面が「場所」として立ち上がること。

### B. Tactile Motion

- 遊び心のあるUI
- CSSアニメーションの「硬さ」
- gooey / liquid effect

**抽出:** ふわっとした万能イージングではなく、重さ・反発・接触感があること。

### C. Visual Intentionality

- “good visuals make a website feel 10x more intentional.”
- AIっぽいバナーから抜けるプロンプト設計

**抽出:** 装飾を足すのではなく、なぜその形・色・動きなのかが一貫していること。

### D. Process Before Pixels

- LPデザインは「作る前」で8割決まる
- AIへ渡すdesign-context / design-principles / design-review
- 気に入ったHTMLを再利用可能な資産として残す
- Plan → implementation → explanation/review → fix/test → plan as documentation

**抽出:** 審美眼を実装前に、制約・判断基準・再利用資産へ変換すること。

---

## 2. DEFINE — なぜ他SESのサイトはRainほど刺さらなかったか

### 2.1 RainのURLを「参照した」だけで、刺さった理由を抽出していない

URL、スクリーンショット、タイトルだけでは、AIは表面の配色やカード形状へ寄る。必要なのは各標本を次のフィールドへ分解すること。

```yaml
reference:
  emotional_effect:
  composition:
  type_behavior:
  motion_behavior:
  material_language:
  interaction:
  restraint:
  transferable_rule:
  do_not_copy:
```

### 2.2 本文 → 即コードになっていた

情報設計、アートディレクション、モーション設計が飛ばされると、モデルは確率的に安全な「角丸カード」「薄いグラデーション」「同じ高さの三列」「無難なアイコン」「ふわっとしたfade-in」へ回帰する。これは実装失敗ではなく、**発注工程の欠損**。

### 2.3 方向案を分岐させず、一案目を磨いていた

デザインでは、最初に最低3方向を短く作り、目的に対して選ぶ。一案目を磨く方式は、完成度は上がっても方向の凡庸さが固定される。

今回の棄却案:

1. **Nintendo-like Pop Magazine** — 楽しいが、公式の模倣へ寄りやすい。
2. **Dark Esports Dashboard** — 競技感は出るが、既視感の強いゲーミングUIになる。
3. **Kumasan Industrial Field Board** — 情報、世界観、即読性が同じ理由で成立する。**SELECT**。

### 2.4 ブラウザでの視覚レビューが工程化されていなかった

DOMが正しいことと、画面が刺さることは別。最低でも desktop / mobile の全長スクリーンショットを毎回取り、以下をレビューする。

- 最初の1画面で世界観が立つか
- 3秒で主目的が分かるか
- 30秒で作戦を復唱できるか
- スクロールのリズムが単調でないか
- 動きが情報を強化しているか
- モバイルで読めるか

---

## 3. PROFESSIONAL MODES — 仕事として必要な役割

小規模案件でSESを6本立てる必要はない。**一つの制作ループが6つの帽子を順番に被る**。

| Mode | 問い | 成果物 |
|---|---|---|
| Creative Director | 何を感じさせるか | Emotional target / one-line concept |
| UX・Information Architect | いつ、何を見るか | Hierarchy / task flow / quick mode |
| Art Director | 何を見れば同じ世界だと分かるか | Type / color / shape / material rules |
| Interaction・Motion Designer | 何が、なぜ動くか | Motion choreography / reduced-motion rule |
| Frontend Engineer | 速く・壊れず実現できるか | Responsive implementation |
| Design QA / Critic | 目的に届いたか | Screenshot review / accessibility / regression |

**Codexは主に Frontend Engineer と Design QA。** Creative DirectionをCodexへ丸投げしてはいけない。

---

## 4. SELECTED DESIGN SYSTEM

### Emotional target

- 開いた瞬間: 「バチコン始まった。やるぞ」
- 30秒後: 「二人の仕事が分かった」
- 5分後: 「次の一回で何を変えるか分かった」

### Shape grammar

- 角丸SaaSカードは原則禁止
- 3–5pxの黒い輪郭
- 斜め、台形、切り欠き、テープ、スタンプ
- 円は金イクラ・照準・波紋としてのみ使う
- 影はぼかさず、硬いオフセットシャドウ

### Color roles

| Token | Role |
|---|---|
| Ink `#15130F` | 現場、夜、構造 |
| Paper `#F2EEDB` | 作業票、可読領域 |
| Hazard Orange `#FF5B22` | 警告、得点源、W2 |
| Toxic Lime `#D8FF3E` | 正解、進行、選択状態 |
| Egg Gold `#FFC629` | 目標、納品、達成 |
| Aqua `#48D5D2` | 水・フォーカス・補助 |

### Motion rules

- 反復運動はイクラ、母艦、矢印など意味のある物だけ
- スクロールrevealは読順の補助。すべて同時に浮かせない
- `prefers-reduced-motion` と手動停止を両方用意
- 音声はユーザーが押した時だけ

---

## 5. INFORMATION ARCHITECTURE

1. Hero — 温度と全体目標
2. 30-second briefing — 二人で復唱する一文
3. Live score console — 失敗をWAVE差分へ変換
4. Two-person link — ケンシロウ / まいこの役割
5. Wave dossier — 5WAVEの詳細
6. Field film — 公式映像＋差し替え可能クリップ
7. Voice protocol — 6語と20秒コール
8. Today / tomorrow — 土曜に型、日曜にスコア
9. Universal principles — 次回にも残る極意
10. Final briefing — 作戦の再固定

---

## 6. IMPLEMENTATION BOUNDARY

### Implemented now

- 完全静的・単一HTMLサイト
- desktop / mobile responsive
- 30秒モード
- イベント終了までのカウントダウン
- WAVE別スコア入力、合計、端末内ベスト保存
- キケン度ゲート表示
- 役割交換
- キーボード対応タブ
- 合図の読み上げ
- 公式映像埋め込み
- 自分たちのMP4を差し替えられる3スロット
- reduced motion / print

### Deliberately not implemented

- Nintendoの画像・ロゴ・キャラクター素材の無断複製
- 重いthree.js。今回はスマホでWAVE間に開く実用性が勝つ
- 自動再生音声・自動再生動画
- 金ボーダー250の「保証」表現

---

## 7. CODEX DECISION

```text
ChatGPT / design lane
= Rain recovery + research + brief + art direction + information architecture

Codex / engineering lane
= implementation + Playwright + visual diff + targeted correction
```

Codex単独で「バチコンっぽく、いい感じに」は非推奨。Codexへ渡すなら、このRondo、実装、desktop/mobileスクリーンショット、MUST/SHOULD/NOの4点セットにする。

### Codexが特に強い仕事

- 既存コードを壊さず改修
- responsive overflowの探索
- Playwrightでの操作・スクリーンショット
- コンソールエラー、リンクの検証
- 具体的なレビュー指摘の反映

### Codexへ渡さない仕事

- 感情目標の決定
- Rainから何を継承するかの選択
- 公式に似せる／似せない境界
- 「どの案が刺さるか」の最終判断

---

## 8. ACCEPTANCE CHECK

### MUST

- 390px幅で横スクロールしない
- 30秒で `21 / 60 / 52 / 60 / 57` と `68 / 17` を復唱できる
- W2が最大得点源として視覚的に際立つ
- 役割交換が動く
- スコア合計・保存が動く
- キーボードでWAVEタブを操作できる
- 動きを停止できる
- 250が保証値ではないと明記する

### SHOULD

- 最初の画面で「工業・インク・金イクラ・チーム戦」が伝わる
- 画面の各動きに攻略上の意味がある
- 動画がなくても空白に見えない
- 印刷して作戦票として使える

### NO

- 汎用SaaSの角丸カード列
- 不要な3D・パーティクル
- 公式ロゴの模倣
- 読めない低コントラスト文字
- 全セクション同じレイアウト

---

## 9. HARVEST — 次回へ残すもの

ユーザー確認後、次の4部品を「ケンシロウのHTML資産」として分離できる。

1. **Hard-shadow kinetic hero**
2. **Hazard score rail**
3. **Interactive score console**
4. **Tabbed mission dossier**

Rainは「好きなものの倉庫」から、

```text
reference
→ extracted taste rule
→ approved implementation
→ reusable design asset
```

へ閉じると、次のSESでも感動の再現率が上がる。
