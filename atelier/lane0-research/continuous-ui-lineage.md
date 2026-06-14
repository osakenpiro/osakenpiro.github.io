# 連続値UI/UX の実例と効果 ── 二値→Float のインターフェース設計史と HCI 知見

> 調査担当: リサーチサブエージェント（レーン⓪-J）／対象: 長田謙志郎（osakenpiro）#全人類UX改善計画
> 作成日: 2026-06-14 (JST)／ステータス: WebSearch+web_fetch で実在を裏取り（一次PDF一部直接確認）／US-only検索の制約あり
> 姉妹briefing: 同フォルダ `boolean-float-lineage.md`（Zadeh1965/sorites/HiTOP/sigmoid の知的系譜）── 本書はその**インターフェース実装版**

---

## 要旨（まとめ → 理由 → 応用）

**まとめ**: 「二値（Boolean）インターフェースを連続値（Float / グラデーション / 程度）に置き換える」という発想は、UI/UX の歴史にすでに無数の実在例として存在する。調光スイッチ（dimmer）、音量・明度スライダー、Facebook の「いいね」→Reactions、医療の視覚的アナログスケール（VAS）、NPS/リッカート尺度、80〜90年代日本のファジィ制御家電──これらはすべて「ON/OFF・はい/いいえ・該当/非該当」という鋭い二値を、程度の連続体に開いた設計である。HCI 研究はこの移行に明確な利得（精度・表現力・操作感の「制御している感覚」）を認める一方で、**「粒度（granularity）は多ければ多いほど良い、わけではない」**という重要な反証も蓄積している。最適な粒度は対象・認知負荷・測定誤差で決まる。

**理由**: なぜ連続値が選ばれてきたか。第一に**現実が連続だから**──痛みは「ある/ない」ではなく強さの連続体であり（VAS の設計思想そのもの）、好みも「好き/嫌い」の二値ではなく程度を持つ。二値はこの連続体を恣意的な閾値で切り、情報を捨てる。NPS が0〜10の11段階を3カテゴリに潰すと「統計的検出力と精度を失う」と批判されるのがその実例。第二に**二値が摩擦・ストレス・操作（ダークパターン）の温床になる**から。「既読/未読」の二値は応答圧と不安を生み、強制二択（false dichotomy）や confirmshaming はユーザーの認知バイアスを突く。**ただし**、連続値が常に勝つわけではない──Netflix は星5段階を thumbs up/down に「単純化」して評価数を200%増やした。粒度を上げると回答に時間がかかり（MeasuringU）、測定誤差が粒度とともに増える条件では信頼性がむしろ下がる（arXiv:2502.02846 を一次確認）。真の論点は「二値 vs 連続」ではなく「**閾値を設計者が勝手に固定して隠すこと**」と「**対象に合った粒度を選ぶこと**」である。

**応用**: Hi-Me TooL 等の設計では、(1)二値判定を残すなら閾値を可視化・可変化する、(2)対象が連続体なら連続値のまま見せ・記憶し・調整可能にする、(3)ただし粒度は4〜7段階を基準に、対象と認知負荷で調整する、(4)連続入力には必ず即時の視覚フィードバックを与える、(5)二値の方が摩擦が低い局面（速い軽い意思表示）では二値を選び、裏で連続データを別経路で取る、という5原則に落ちる。以下、各テーマを実在例＋根拠＋系譜接続で整理する。

---

## テーマ1: 連続値UIの実例 ── 二値→Float のインターフェース実装史

### 1-1. 調光スイッチ（dimmer）── ON/OFF を「明るさ0〜100%」に開いた原型
- **これは二値→連続値のどの操作か**: 照明の `ON/OFF`（Boolean）を「光量の連続値（0〜100%）」に置き換えた、最も古典的かつ家庭に普及したFloat化インターフェース。
- **実在の裏取り**: Joel Spira（Lutron Electronics 創業者）が1959年にソリッドステート（半導体サイリスタ）電子調光器を考案、1959/7/15に米国特許出願（U.S. 3,032,688）。1961年に妻Ruthとペンシルベニアで Lutron 設立。60年代後半に "light balance" 連続電子調光スイッチ Capri を量産投入。これは電流を毎秒120回ON/OFFする位相制御で、人間には**連続的な明るさ**として知覚される。
- **接続**: 物理的には高速なON/OFF（PWM/位相制御）の積分が「連続値の知覚」を生む点が示唆的。デジタルUIでも「離散ステップでも十分細かければ連続に感じる」という設計上のヒント（→テーマ2の粒度議論に直結）。

### 1-2. 音量・明度スライダー ── 段階ボタンを連続トラックに
- **どの操作か**: 「大きい/小さい」「明るい/暗い」という相対二択や数段階ボタンを、ドラッグ可能な連続トラック（スライダー）に置き換え。
- **実在の裏取り**: スライダーは GUI の標準コンポーネント。UX 研究では「ユーザーは幅広い選択肢を素早く探索できる」点が利点とされ、Smashing Magazine 等が設計指針を整備。EU の component-library（公的UIガイドライン）も range/slider の usage を規定。
- **接続**: 連続トラックは「閾値を隠さず、全域を一望させる」設計。Float をそのまま見せる代表例。

### 1-3. Facebook「いいね」→ Reactions ── 二値賛意を6値の情緒粒度に
- **どの操作か**: `Like`（押す/押さない=Boolean）を、Like/Love/Haha/Wow/Sad/Angry の**6種の情緒カテゴリ**に多値化（厳密には連続スライダーではなく「離散多値化」=Boolean→多値の中間段階）。
- **実在の裏取り**: 2015年に一部市場でテスト、2016年2月にグローバル展開（当初の"yay"は除外）。Meta公式は「投稿への反応をすばやく簡単に共有する手段を増やす」拡張と説明。動機は明確に**情緒粒度（emotional granularity）**: 「友人が父の死を投稿したとき "like" を押すのは無神経に見える」→より細やかな反応で「表現性に対するより大きなコントロール」を与える。Slate は「結局はデータ、データ、データ」とも報道（多値化はレコメンド学習データの解像度も上げる）。
- **接続**: 「賛意」という連続的な情緒を、単一の二値ボタンでは表現しきれないという認識。完全連続ではなく**離散多値**を選んだのは、テーマ2の「粒度は7前後で頭打ち」「選びやすさ」とのトレードオフの実例。

### 1-4. 星評価 vs サムズアップ/ダウン ── そして Netflix の「逆行」(重要な反例)
- **どの操作か**: 星5段階（5値の順序尺度）⇄ thumbs up/down（2値）。**連続値が常に勝つわけではない**ことを示す実在の自然実験。
- **実在の裏取り**: Netflix は2017年3月、星5段階評価を thumbs up/down の二値に**置き換えた**。理由は (a)「星をつけるには考える必要があるが、二値の yes/no はコミットしやすい」、(b) 2016年に数十万人規模でテストし**評価数が200%増加**、(c) 星評価を個人化された「% Match（マッチ度）」スコア表示に置換。
- **接続**: ここが本調査の最も誠実な留保。**入力(input)は二値に単純化しつつ、出力(output)である "% Match" はむしろ連続値(0〜100%)で提示している**。つまり Netflix は「軽い二値入力 → 連続値の予測出力」という分業を選んだ。これは「Float は万能ではない。摩擦の低い入力には二値が勝つ局面があり、連続値は推論・提示側に置くと効く」という設計知見そのもの（→応用原則5）。なお星評価という「絶対評価」と thumbs という「相対的好み」では測っているものが違う、という質的差も論点。

### 1-5. 確信度スライダー（confidence / probability slider）── はい/いいえ を確率の連続値に
- **どの操作か**: 「起こる/起こらない」「正しい/間違い」の二値判断を、0〜100% の確率・確信度の連続値で表明。
- **実在の裏取り**: 予測市場・集合知システムで「0〜100%のスライダーで確信度を表明」「選択肢ごとに確率を割り当てる」UIが実在（複数の米国特許PDFで確認）。ただし**学術的には効果が一様ではない**: 「点確率 vs 区間確率 vs 密度予測」を直接比較した研究は少なく結果も一貫せず、区間形式は点形式よりミスキャリブレーションが強い場合もある（Niu et al. 2022, Futures & Foresight Science）。
- **接続**: Boolean→Float の「判断」への適用。ただし**連続値にすると新たなバイアス（過信・キャリブレーション崩れ）が出うる**ことが実証されており、Float化は無条件の改善ではない、という重要な反証データ。

### 1-6. NPS / リッカート尺度 ── アンケートの程度尺度（テーマ2で詳述）
- **どの操作か**: 「満足/不満足」の二値を 0〜10（NPS）や5〜7段階（リッカート）の順序尺度に。詳細はテーマ2へ。

### 1-7. ファジィ制御家電（fuzzy control）── 80〜90年代日本に実在したFloat制御の量産例
- **どの操作か**: 「ON/OFF制御」や「強/弱の数段階」を、センサ入力に対する**連続的なメンバーシップ関数（degree of membership）に基づく滑らかな制御**に置換。Zadeh のファジィ集合（→姉妹briefing テーマ1）の家電実装版。
- **実在の裏取り**: ファジィ論理の商用応用は1980年代初頭、特に日本で開花。実在製品: ノイズ・照明に応じて音量・コントラストを調整するテレビ、汚れの量・質と洗濯物量で最適コースを選ぶ「smart」洗濯機（センサで洗濯量と水の濁度=turbidityを測定）、湿度に応じて調整する炊飯器・電子レンジ、複数被写体でフォーカス・露出を合わせるビデオカメラ。日本語「ファジィ」は**1990年の新語・流行語金賞**を受賞。1988年に48社共同の Laboratory for International Fuzzy Engineering (LIFE) を設立。出典: Wikipedia "Fuzzy control system", Britannica "Fuzzy logic", Tech Monitor。
- **接続**: 姉妹briefing で論じた Zadeh(1965) の「連続的な所属度（continuum of grades of membership）」が、そのまま家電の制御UIとして社会実装された歴史的事実。**「Boolean→Float は思想だけでなく、すでに数千万台の家電に量産投入された実績がある」**と論文で言える強いアンカー。

---

## テーマ2: HCI研究・知見 ── 粒度と回答品質、認知負荷、VASの根拠

### 2-1. スライダー vs トグル/ラジオ ── 「制御感」と「操作コスト」のトレードオフ
- **知見**: MeasuringU（Jeff Sauro らの定量UXリサーチ）等によると、スライダーでの評価選択は**ラジオボタンより時間がかかる**（ラジオは1クリック、スライダーは掴んで引いて微調整が要る）。スライダーはモバイルで "finicky（扱いにくい）" になりやすく、粒度がある反面「適当に置いた感」が出やすい。
- **粒度の指針**: スライダーのステップは **4〜12段階**が「精度の十分さ」と「滑らかな操作感」のバランス点とされる。選択肢が少数ならスライダーはラジオの代替にすべきでない。
- **ユーザー知覚**: それでもスライダー選好者は「more options」「more nuanced」「more in control」「precise」「flexible」「visual」という語で評価。**「コントロールしている感覚」という主観的価値**が、操作コストの不利を補う。
- **使い分け**: トグル=即効性のある二値（保存/送信を介さず即反映する設定）。ラジオ=少数の明確な選択。スライダー=連続的・広範囲の探索。出典: MeasuringU, UXtweak（トグル）, Smashing Magazine, EU component-library。
- **接続**: 「Float化は無料ではない、操作コストを伴う」という実装の現実。だからこそ**即時フィードバック**（応用原則4）と**適切な粒度**が要る。

### 2-2. リッカート尺度の粒度 ── 4〜7段階が最適域、7超で頭打ち
- **知見（歴史）**: Symonds(1924) が「信頼性は7段階で最適化される」と最初に示唆。**Miller(1956)「マジカルナンバー7±2」**は、人間の絶対判断のスパンが約7カテゴリを区別できる、それ以上の増加は無益かもしれない、と論じた（Psychological Review, 63, 81–97。心理学で最も引用される論文の一つ。後にCowanが「むしろ約4チャンク」と修正）。
- **知見（現代コンセンサス）**: 応答カテゴリ数の最適域は**4〜7**。4未満で心理測定的品質が低下、7超では利得が最小。5段階で満足な信頼性、7段階はわずかに分散が大きく（=より多くのニュアンスを捉える）が利得は逓減。5点と7点は再スケール後ほぼ同等の平均、ただし完全な合意はまだない。出典: ResearchGate討論, ERIC EJ1359497, Lensym, Wiley(Taufique)。
- **接続**: **「連続値（Float）は多ければ多いほど良いわけではない」**という、Boolean→Float に対する最重要の経験的反証。Miller の7±2 が認知的な天井を与える。論文では「Float化の指針は『無限分解能』ではなく『対象の弁別可能粒度に合わせる』こと」と誠実に書ける。

### 2-3. 連続スコアの認知負荷と測定誤差 ── 「Likert を VAS に育てるな」(一次確認)
- **一次確認した論文**: **Sun, S., Schmidt, K. M., & Henry, T. R. (2025). "Don't Let Your Likert Scales Grow Up To Be Visual Analog Scales: Understanding the Relationship Between Number of Response Categories and Measurement Error." arXiv:2502.02846 [stat.ME]**（University of Virginia）。PDF全文を直接取得・確認。
- **核心的知見（原文に基づく）**:
  - VAS（0〜100の連続スケール、電子版はスライダー）は「101点（または100点）のリッカート尺度」と見なせる。デジタル調査の普及で急増したが、「測定の意味で最適かは合意がない」。
  - シミュレーションの結論: **(a)測定誤差が粒度に依存しない**という仮定では「真の最適値は存在せず、信頼性は粒度とともに上がってから頭打ち（plateau）になる」。**(b)より現実的な、測定誤差が粒度とともに増える**という仮定では「**明確な最適値が存在し、その位置は誤差の増加率で決まる**」。
  - 決定的な警告: 「測定誤差が粒度とともに増えるなら、**リッカート項目をVASに変換すると信頼性が劇的に低下する（drastic decrease in reliability）**」。さらに「検証済み尺度の応答スケールを変えるなら、測定誤差が変わるため**再検証(re-validate)が必須**」。
- **接続**: Boolean→Float（あるいは粗い段階→VAS）への移行を**無批判に推す設計を直接戒める一次資料**。「連続化＝改善」ではなく「連続化は測定誤差の構造に依存する条件付きの設計選択」。論文の誠実さ担保＝我田引水回避に必須の引用。

### 2-4. 視覚的アナログスケール（VAS）が医療で使われる根拠
- **知見**: VASは痛み測定で妥当性・信頼性が高いと多数の研究が支持（変形性関節症の痛み、慢性炎症性/変性性関節痛の変化への感度）。**最重要の設計思想**: 「患者の視点では**痛みは連続的であり、カテゴリ化が示唆するような離散的な跳躍をしない**。VASはこの連続体の発想を捉えるために考案された」（Physiopedia）。
- **ただしの留保**: VASと離散カテゴリ尺度（VRS=Verbal Rating Scale）のスコアは相関するが、各VRSカテゴリに対応するVAS範囲は広い。臨床現場ではVRSがより適切な場面もある。ある術後研究では**VAS未完了率14.2%に対しVRS未完了率0.5%**（=連続スケールは一部患者にとって回答が難しい）。出典: Physiopedia, SAGE(Aicher 2012), Wiley(Reed 2014)。
- **接続**: 「対象が本質的に連続体（痛み・好み・確信）なら連続値で測れ」という最強の実証根拠。同時に「連続スケールは回答負荷が高く脱落を生む」という、テーマ2-1/2-3と一貫した反証も併存。**Float化の正当性と限界が同じ医療現場で両方実証されている**のが誠実な構図。

---

## テーマ3: 二値UIの害（摩擦）── 強制二択・ダークパターン・既読の二値

### 3-1. 既読/未読（read receipts）の二値が生むストレス
- **どの害か**: メッセージ状態を「既読/未読」という**二値フラグ**に固定したことで、応答圧と不安が構造的に発生。
- **実在の裏取り**: 研究は、read receipts が「受信者には応答圧、送信者には返信待ちの不安」を生むと報告。見えたメッセージは「速い返信への暗黙の期待」を帯び、ストレスと義務感を増やす。行動的帰結=受信者の回避戦略、送信者のアプリ過剰チェックと憶測。「既読なのに未返信」は遅延を意図的・個人的に感じさせる。対人コミュ研究の4感情（悲しみ・不安・怒り・罪悪感）に対応。出典: scispace(MIM read receipts研究), Psychology Today (2026), Shin et al. CHI'18 (interruptions.net)。
- **接続**: 「既読/未読」は**0/1の二値が現実の連続的状態（読んだが考え中、見たが今は返せない…）を潰した**典型。Float的代替案=「タイピング中…」のような中間状態の可視化、あるいは応答の緊急度を連続的に扱う設計。Boolean→Float の対人コミュへの応用例。

### 3-2. 強制二択・false dichotomy・confirmshaming（ダークパターン）
- **どの害か**: 二者択一を強制し、片方を選びにくくする言語・設計でユーザーを操作。
- **実在の裏取り**: ダークパターン（deceptive patterns）はユーザーを意図しない行動に誘導する設計で、認知バイアスを突く。**confirmshaming**=「いいえ、私はお金を節約したくありません」のような選択肢で罪悪感を与え誘導。**false illusion of choice**=他機能を実行するまで特定の結果に進めない見せかけの選択。機構=損失回避（FOMO）、アンカリング（偽割引）、決定疲労（選択肢過多）。用語は**Harry Brignull が2010年に造語**、taxonomy（roach motel, confirmshaming, trick questions, hidden costs）は規制当局・学界が採用。EUの**Digital Services Act**とGDPRが特定のダークパターン（cookie同意、サブスク解約フロー）を禁止。出典: Springer(Springer Nature Link), UX Magazine, NN/g系解説, suebehaviouraldesign。
- **接続**: 二値の害の中でも「**設計者が二択の枠と閾値を握り、ユーザーに隠す**」ことの悪用形。姉妹briefing の中心命題「真の敵は二値そのものではなく、閾値を勝手に固定して隠すこと」が、ダークパターンとして社会問題化・法規制対象になっている実証。Float化（中間・保留・程度の選択肢を開く）は脱ダークパターンの方向と一致。

### 3-3. 合否・足切りの恣意性（NPS のカテゴリ崩しに最も鮮明に表れる）
- **どの害か**: 連続スコアを恣意的な閾値で「合格/不合格」「Promoter/Detractor」に切り、情報を捨てる。
- **実在の裏取り**: NPS（Net Promoter Score）は0〜10の11段階を3カテゴリ（Detractor 0–6 / Passive 7–8 / Promoter 9–10）に潰す。学術的批判: 「11段階を3カテゴリに縮約すると**統計的検出力と精度を失う**」「**恣意的なカットオフ点**を設定し、標本の一部（Passive)を計算から除外し、尺度を3カテゴリに潰す→**廃止の呼びかけ**まで出ている」。情報損失の具体例: 「0〜6を同一のDetractorとして扱うと多くの変動を潰す。6をつけた客と0をつけた客は全く違う経験」。**「なぜ6はDetractorで7はそうでないのか？」**がNPS設計で最も議論される恣意的境界。出典: MeasuringU "Has the NPS Been Discredited...", ScienceDirect(顧客マインドセット指標の体系的評価), arXiv:1601.07235(区間推定)。
- **接続**: 「**閾値の恣意性**」(姉妹briefing テーマ4のシグモイド0.5、テーマ3のDSM診断閾値、テーマ2のsorites の鋭い境界)が、ビジネス指標で**「6 vs 7問題」**として実在し、学術的に批判されている完璧な実例。論文で「合否・足切りの恣意性」を語る際の一番具体的な弾。

---

## テーマ4: 設計原理への一般化 ── 閾値の可視化・可変化、連続値のまま見せる

### 4-1. 中核原理: 「閾値を可視化・可変化する」「連続値のまま見せる」
姉妹briefing が論証した通り、各分野（論理学・哲学・心理学・計算機科学）が独立に到達した結論は「二値が悪いのではなく、**閾値を設計者が勝手に固定して隠すことが摩擦を生む**」。本調査の実在UIはこれを裏づける:
- dimmer / スライダー / VAS = **連続値のまま見せる**（閾値を消し、全域を一望させる）の成功例。
- Reactions = 二値を多値に開き、情緒の解像度を上げた例。
- NPS批判・既読ストレス・ダークパターン = **閾値を隠し固定したこと**の害の実例。
- Netflix の逆行・VAS脱落率・arXiv:2502.02846・Miller 7±2 = **「連続値は無条件に勝つわけではない」**という誠実な制約。

### 4-2. sigmoid との同型（姉妹briefing テーマ4への接続）
ニューラルネットが Heaviside 階段関数（二値）をシグモイド（連続0〜1）に置換して「微分可能になり学習できる」利得を得たのと同型に、UIでも二値ボタンを連続スライダーにすると「中間状態を記憶・調整・学習できる」利得が生まれる。**ただし推論時には0.5などの閾値で二値に戻す**——その閾値が誰の・どんな根拠で決まったかを可視化・可変化するのが設計者の責務。

### 4-3. 「程度のまま測り、提示は文脈で二値/連続を選ぶ」分業（Netflix の教訓の一般化）
Netflix の「二値入力 → 連続値(% Match)出力」は、Float を**どの層に置くか**の設計判断を示す。入力層では摩擦最小化のため二値が勝つ局面があり、連続値は推論・提示・記憶の層に置くと効く。これは「全UIを連続化せよ」という素朴な主張への healthy な修正。

---

## 参考文献（特定できた実在ソース、URL付き）

一次資料（PDF全文）を直接取得・確認したものは【一次確認】。

### テーマ1（連続値UIの実例）
1. 【調光】Joel Spira / Lutron, 米国特許 U.S. 3,032,688（1959出願）, Capri 連続電子調光器。
   Wikipedia "Joel Spira (businessman)": https://en.wikipedia.org/wiki/Joel_Spira_(businessman)
   "The History of Lutron": https://www.cableorganizer.com/blogs/articles/the-history-of-lutron
   NPR "A Light Bulb Moment...": https://www.npr.org/2015/10/24/451170011/a-light-bulb-moment-how-the-dimmer-switch-set-lusts-ablaze
2. 【スライダー設計】Smashing Magazine "Designing The Perfect Slider UX" (2017): https://www.smashingmagazine.com/2017/07/designing-perfect-slider/
   EU Component Library (range usage): https://ec.europa.eu/component-library/ec/components/forms/range/usage
3. 【Facebook Reactions】Meta公式 "Reactions Now Available Globally" (2016/02): https://about.fb.com/news/2016/02/reactions-now-available-globally/
   Slate "Facebook's 5 new reactions buttons are all about data" (2016): https://slate.com/technology/2016/02/facebook-s-5-new-reactions-buttons-are-all-about-data-data-data.html
   TechCrunch "facebook reactions" (2016/02/24): https://techcrunch.com/2016/02/24/facebook-reactions
4. 【Netflix 星→thumbs（反例）】Netflix公式 "Goodbye Stars, Hello Thumbs": https://about.netflix.com/en/news/goodbye-stars-hello-thumbs
   TechCrunch (2017/03/16): https://techcrunch.com/2017/03/16/netflix-is-replacing-five-star-ratings-with-thumbs-up-or-down/
   Variety (2017): https://variety.com/2017/digital/news/netflix-kills-star-ratings-thumbs-up-thumbs-down-1202023257/
5. 【確信度スライダー】Niu et al. (2022) "Point, interval, and density forecasts," Futures & Foresight Science: https://onlinelibrary.wiley.com/doi/full/10.1002/ffo2.124
6. 【ファジィ家電】Wikipedia "Fuzzy control system": https://en.wikipedia.org/wiki/Fuzzy_control_system
   Britannica "Fuzzy logic": https://www.britannica.com/science/fuzzy-logic
   Tech Monitor "Invisible At Home, Fuzzy Logic Crosses The Pacific": https://www.techmonitor.ai/technology/invisible_at_home_fuzzy_logic_crosses_the_pacific_and_bursts_out_all_over

### テーマ2（HCI研究・粒度・VAS）
7. 【スライダー vs 数値/ラジオ】MeasuringU "Completion Times and Preference for Sliders vs. Numeric Scales": https://measuringu.com/time-and-preference-numeric-slider-desktop-mobile/
8. 【粒度・測定誤差／一次確認】Sun, S., Schmidt, K. M., & Henry, T. R. (2025). "Don't Let Your Likert Scales Grow Up To Be Visual Analog Scales..." arXiv:2502.02846 [stat.ME]. 【一次確認・PDF全文取得】 https://arxiv.org/pdf/2502.02846
9. 【7±2】Miller, G. A. (1956). "The Magical Number Seven, Plus or Minus Two." Psychological Review, 63, 81–97.【書誌確定】 https://en.wikipedia.org/wiki/The_Magical_Number_Seven,_Plus_or_Minus_Two
   一次PDF（UT Austin ホスト）: https://labs.la.utexas.edu/gilden/files/2016/04/MagicNumberSeven-Miller1956.pdf
10. 【リッカート段階数】"How many response categories are sufficient for Likert type scales" (ERIC EJ1359497): https://files.eric.ed.gov/fulltext/EJ1359497.pdf
11. 【VAS妥当性・連続体思想】Physiopedia "Visual Analogue Scale": https://www.physio-pedia.com/Visual_Analogue_Scale
    Aicher, Peil, Peil, Diener (2012), Cephalalgia/SAGE（VAS vs VRS, OTC鎮痛薬, 頭痛）: https://journals.sagepub.com/doi/10.1177/03331024111430856
    Reed & Van Nostran (2014) "Assessing pain intensity with the VAS: A plea for uniformity," J Clin Pharmacol, Wiley: https://accp1.onlinelibrary.wiley.com/doi/full/10.1002/jcph.250

### テーマ3（二値の害）
12. 【既読ストレス】"Exploring the impact of 'read receipts' in Mobile Instant Messaging" (scispace PDF): https://scispace.com/pdf/exploring-the-impact-of-read-receipts-in-mobile-instant-3vid403m1p.pdf
    Shin et al., CHI'18 "Understanding Stress on Mobile Instant Messengers": https://interruptions.net/literature/Shin-CHI18.pdf
    Psychology Today (2026) "Seen, Unseen, and Still Anxious": https://www.psychologytoday.com/us/blog/the-realities-of-refugee-screening/202603/seen-unseen-and-still-anxious-the-psychology-of
13. 【ダークパターン】Brignull 2010 造語, taxonomy。Springer "The Hows and Whys of Dark Patterns": https://link.springer.com/chapter/10.1007/978-3-031-28643-8_9
    NN/g 系・UX Magazine 解説: https://uxmag.medium.com/dark-patterns-when-design-crosses-the-line-0539b7d527f2
14. 【NPSカテゴリ崩し批判】MeasuringU "Has the Net Promoter Score Been Discredited in the Academic Literature?": https://measuringu.com/nps-discredited/
    ScienceDirect "Customer mindset metrics: ...NPS vs. alternative calculation methods" (2022): https://www.sciencedirect.com/science/article/abs/pii/S0148296322003897
    arXiv:1601.07235 "Interval Estimation for the 'Net Promoter Score'": https://arxiv.org/pdf/1601.07235

### 未確認・要追加検証（誠実な記録）
- **Joel Spira の特許番号 U.S. 3,032,688 と出願日**は二次記事（Wikipedia/Alchetron 等）に基づく。論文化前に Google Patents / USPTO で一次確認を推奨。
- **Facebook Reactions の "focus groups and surveys で感情を決定" / 情緒粒度の動機**は報道（Slate, Fox等）ベース。Meta公式声明の原文一次確認は未取得。
- **Netflix 200%評価増**は Netflix公式・TechCrunch報道ベース（査読研究ではない、企業発表値）。
- **既読ストレス・ダークパターンの各論文**は検索結果のabstract/解説ベースで、個別の一次PDF全文は#12のscispace等一部のみ確認。CHI'18 Shin論文は書誌確定だが本文全文は未取得。
- **Miller(1956) 一次PDF**はUT Austinホストを確認したが本文全文は未精読（書誌・主張は複数二次で確定）。
- US-only検索のため、日本語の一次資料（ファジィ家電の具体型番=三洋の「ファジィ炊飯器」等、日本語UX研究）は本調査では取得していない。日本市場の具体例は別途和文検索で補強可能。

---

## Hi-Me TooL 等への設計指針（5点）

1. **二値判定を残すなら、閾値を可視化し可変化する。** NPS の「6 vs 7問題」、合否の足切り、レコメンドのカットオフは、閾値が隠れて固定されているほど摩擦と恣意性が増す。ツールが内部で二値化するなら「いまどこに線が引かれているか」をUI上に出し、ユーザーが動かせるようにする。これは脱ダークパターン（EU DSA が禁じる方向）とも一致する。

2. **対象が本質的に連続体なら、連続値のまま見せ・記憶し・調整可能にする。** 痛み（VASの根拠）・好み・確信・熱量のように離散的跳躍をしない量は、二値やラフな段階で潰さずスライダー/グラデーションで保持する。osakenpiro の Boolean→Float 哲学のUI直系であり、dimmer/VAS/ファジィ家電という数十年の実装実績がある。

3. **粒度は「無限分解能」ではなく「4〜7段階」を基準に、対象と認知負荷で調整する。** Miller の7±2 と複数のリッカート研究が「7超で利得は頭打ち」、arXiv:2502.02846 が「測定誤差が粒度とともに増えるとVAS化で信頼性が劇的低下」と示す。連続値UIでも内部のステップ/ラベルは7前後を上限の目安にし、VAS的な101点連続は「対象が真に連続で、かつ即時フィードバックがある」ときに限定する。

4. **連続入力には必ず即時の視覚フィードバックを与える。** スライダーはラジオより操作コストが高く（MeasuringU）、モバイルで扱いにくい。リアルタイムに値・色・プレビューが動くことで「コントロールしている感覚」(ユーザーが連続値UIに見出す主要価値)が成立し、操作コストの不利を補える。フィードバックなき連続入力は「適当に置いた感」を生み品質を落とす。

5. **Float は「入力層」より「推論・提示・記憶層」に置くと効く局面がある（Netflix の教訓）。** 速い軽い意思表示には二値が勝つことがある（Netflix は thumbs 化で評価数200%増）。その場合でも捨てずに、連続値は裏のスコアリング（% Match のような連続出力）や履歴の記憶に回す。「全UIを連続化せよ」ではなく「**どの層にFloatを置くと摩擦最小で解像度最大になるか**を設計する」のが、本調査が示す成熟した Boolean→Float 実装である。
