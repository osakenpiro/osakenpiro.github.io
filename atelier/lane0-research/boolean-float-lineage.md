# Boolean → Float の知的系譜（intellectual lineage）調査briefing

> 調査担当: リサーチサブエージェント（レーン⓪-A）／対象: 長田謙志郎（osakenpiro）の論文シリーズ素材
> 作成日: 2026-06-14 (JST)／ステータス: 実在文献の裏取り済み（一次資料一部直接確認）

---

## 要旨（まとめ → 理由 → 応用）

**まとめ**: Boolean→Float（二値判断を連続値 0.0〜1.0 に再定義する）という長田の中核哲学は、思いつきの造語ではなく、20世紀の論理学・哲学・心理学・計算機科学を横断して独立に何度も再発見されてきた「程度（degree）への移行」という大きな知的潮流の、UX/プロダクト設計版の言い換えである。直接の祖先は **Łukasiewicz の多値論理（1920〜）** と **Zadeh のファジィ集合（1965）** で、後者は「[0,1] 区間のメンバーシップ関数」を導入し、しかも論文の脚注で「メンバーシップ値を真理値と解釈すれば、それは [0,1] の連続真理値をもつ多値論理に対応する」と明言している。つまり「Boolean→Float」は Zadeh 自身が60年前に書き込んでいた発想とほぼ同型である。

**理由**: なぜ二値が捨てられ程度が選ばれてきたのか。理由は領域ごとに異なるが、根は一つ——**現実の対象は「鋭く定義された所属基準（sharply defined criteria of membership）」を持たない**から（Zadeh 1965 の冒頭主張そのもの）。哲学では sorites paradox（砂山のパラドクス）が「ハゲ/ハゲでない」の鋭い境界を引けないことを示し、degree theory of truth がその応答として真理を [0,1] の程度にした。心理学では DSM のカテゴリカル診断が「恣意的な閾値（arbitrary thresholds）」「障害間の不明瞭な境界」「併存症」「カテゴリ内の異質性」を抱え、HiTOP がそれをディメンショナル（連続次元）に置き換えた。計算機科学では `bool` のしきい値が恣意的であり、学習を可能にするために Heaviside 階段関数が微分可能なシグモイドに「平滑化」された——これは literally な Boolean→Float である。

**応用**: 全人類UX改善の文脈では、世界中のUIに偏在する「ON/OFF・合格/不合格・既読/未読・はい/いいえ」といった摩擦の多い二値的インターフェースを、連続値（スライダー・確信度・グラデーション・段階）に再設計することが、上記すべての系譜と一直線につながる。重要なのは「二値が悪い」のではなく「**閾値を設計者が勝手に固定して隠すこと**」が摩擦を生むという論点で、これは各領域が独立に到達した結論である。本briefingは各系譜の実在文献と、Boolean→Floatへの接続線を整理する。

---

## テーマ1: ファジィ論理 / 多値論理 — Boolean→Floatの直接的祖先

### 概念
古典論理（Aristotle 以来の二値論理 / bivalence）は、すべての命題が「真(1)か偽(0)のどちらか」であることを前提にする（排中律 law of excluded middle、無矛盾律）。**多値論理（many-valued logic）** はこの前提を緩め、真理値を3個以上、あるいは連続無限個に拡張する。

- **Jan Łukasiewicz（ヤン・ウカシェヴィチ、ポーランド）** は1920年に三値論理を創始した。第三の値「possible（可能）」を導入し、アリストテレスの「海戦のパラドクス」(future contingents=未来の偶然命題の真理値問題) に対処しようとした。これは「明日海戦が起こる」が今日の時点で真でも偽でもない、という直観を形式化する試みだった。
- 1930年に Łukasiewicz と **Alfred Tarski** が ℵ₀ 値（可算無限値）版を発表（Łukasiewicz–Tarski 論理）。**Emil Post** も1921年に独立に多値の真理度を定式化した。
- これが **Łukasiewicz logic** として現代ファジィ論理の代数的基盤の一つ（MV代数）になった。

### 直接の祖先: Zadeh のファジィ集合（1965）
**Lotfi A. Zadeh, "Fuzzy Sets," *Information and Control*, Vol. 8, pp. 338–353 (1965)** ——これが Boolean→Float の最も直接的な学術的祖先である。一次資料（論文PDF）を直接確認した。要点：

- 定義（原文ママに近い訳）:「ファジィ集合とは、**連続的な所属の度合い（a continuum of grades of membership）** をもつ対象のクラスである。そのような集合は、各対象に **0 から 1 の間の所属度（grade of membership）** を割り当てるメンバーシップ（特性）関数 f_A(x) によって特徴づけられる。」
- 通常の（古典的）集合は、メンバーシップ関数が **0 と 1 の二値しか取らない特殊ケース**として位置づけられる。原文:「A が通常の意味での集合であるとき、そのメンバーシップ関数は 0 と 1 の二つの値しか取りえず……この場合 f_A(x) は集合 A のおなじみの特性関数に帰着する。」——**これはまさに「Boolean は Float の退化したケースである」という主張**であり、長田のフレームワークと構造的に同一。
- Zadeh の動機（冒頭）:「現実の物理世界で出会う対象のクラスは、**たいてい鋭く定義された所属基準（precisely defined criteria of membership）を持たない**」。例として「1 よりずっと大きい実数のクラス」「美しい女性のクラス」「背の高い男性のクラス」を挙げ、これらは通常の数学的集合ではないが「人間の思考において重要な役割を果たす」とする。
- **決定的な脚注（footnote 3, p.339）**: メンバーシップ関数の値域を [0,1] に制限することについて、Zadeh はこう書く——「もし f_A(x) の値を **真理値（truth values）として解釈すれば、これは [0,1] 区間に連続的な真理値をもつ多値論理（a multivalued logic with a continuum of truth values）に対応する**」。つまり Zadeh 自身が、ファジィ集合論を「連続真理値の論理」=Boolean→Float として理解していた。
- ただし Zadeh は「ファジィ集合は確率とは本質的に異なる（completely nonstatistical in nature）」と明記。これは重要な区別で、Float は「起こる確率」ではなく「程度・度合い」を表しうる（後述テーマ4の確率との対比に効く）。

### 補助線: Kosko の大衆化
**Bart Kosko, *Fuzzy Thinking: The New Science of Fuzzy Logic* (1993)** は、ファジィ論理を一般向けに「黒か白か」から「グレー」へのパラダイム転換として語った。Kosko の中心命題：西洋の二値（bivalent）伝統＝Aristotle 的「1か0、真か偽、白か黒」を捨て、**程度（matters of degree）** で考える多値（multivalence）へ。彼の "fit value"（fuzzy unit、0〜1の度合い）対 "bit value"（0か1）という対比は、長田の Float 対 Bool とそのまま重なる。学術的厳密さは Zadeh/Łukasiewicz に置き、Kosko は「思想の普及版・修辞」として引用するのが安全。

### Boolean→Float への接続
ファジィ集合論は **「Boolean→Float の数学的厳密版」** そのものである。論文シリーズでは「Boolean→Float は私の造語だが、その数学的実体は Zadeh(1965) のメンバーシップ関数であり、古典集合＝二値特性関数を Float の退化ケースとして包摂する点まで一致する」と書ける。これは系譜主張の最強の柱。

---

## テーマ2: 連続体・程度の哲学 — sorites paradox と degree theory of truth

### 概念: sorites paradox（砂山のパラドクス／連鎖式）
1粒の砂は砂山ではない。砂山に1粒足しても砂山のまま、1粒引いても砂山のまま。この「1粒の差は質を変えない」という一見もっともな前提を繰り返すと、「1粒でも砂山」または「100万粒でも砂山でない」という不条理に至る。**ハゲ(bald)・背が高い(tall)・赤い(red)** など、境界がぼやけた述語（vague predicates）すべてに同型の問題が生じる。出典: Stanford Encyclopedia of Philosophy, "Sorites Paradox"（継続更新エントリ、Winter 2025版を確認）。

このパラドクスの核心は **二値論理と「鋭い境界(sharp boundary)」の拒否**にある。もし「砂山/非砂山」が二値で、どこかに正確な境界（例: 9,999粒は非砂山、10,000粒から砂山）があるなら、その一点はあまりに恣意的で直観に反する。

### 主要な応答とその対比
vagueness（曖昧性）の哲学には複数の立場があり、Boolean→Float に効くのは特に以下の対比：

- **degree theory of truth（真理の程度説）**: 真理を {真, 偽} の二値ではなく **[0,1] の連続値**とする。「ジョンはハゲだ」は 0.7 真、のように。これはファジィ論理を哲学的真理論に持ち込んだもの。出典: Routledge Encyclopedia of Philosophy, "Vagueness," §3 "The degree theory of truth"。**Boolean→Float の哲学版の直接の名前がこれ**。
- **fuzzy logic / Mathematical Fuzzy Logic**: 「曖昧性を多値論理に基づいて基礎づける degree-based approach」。sorites への感受性こそが vagueness の主要な特徴とされる。出典: Stanford Encyclopedia of Philosophy, "Fuzzy Logic"。
- **supervaluationism（超付値主義）**: 対比として重要。Fine(1975)・Dummett(1975)・Keefe(2000) が展開。これは**二値性(bivalence)を捨てるが、真理度は導入しない**立場。「境界事例では真理値ギャップ(truth-value gap)が生じる」とし、「カットオフ点はあるが、どの点がカットオフかは確定しない」とする。排中律は保持する。→ **Float ではなく「未定義/保留」を許す設計**に相当。長田のフレームワークが degree theory 側（連続値）に立つことを、supervaluationism との対比で鮮明にできる。
- **Edgington (1996)** の "verities"（明確な真理への近さの度合い）: 二値性と古典論理を保持しつつ非真理関数的な度合いを導入する第三の道。degree theory のバリエーションとして引用可。出典: PhilPapers "Degree Theories of Vagueness"、Routledge Encyclopedia。

### Boolean→Float への接続
sorites paradox は **「なぜ二値ではダメか」の最も古典的かつ強力な哲学的論証**である。論文では「Boolean が破綻する典型例＝vague predicate に sorites を当てると、二値は恣意的な鋭い境界を要求して直観に反する。degree theory of truth はこれに連続真理値で応える」と書ける。さらに supervaluationism との対比で「私の Float は『ギャップ(保留)』ではなく『度合い(連続値)』を選ぶ立場だ」と自己定位できる。哲学的正確さのため、**degree theory には『高階の曖昧性 higher-order vagueness』という反論（0.7 という値自体の境界も曖昧では？）がある**ことも誠実に触れると強い（これは未確認の細部ではなく、degree theory への定番批判として SEP/Routledge で扱われる論点）。

---

## テーマ3: 心理学・認知のスペクトラム思考 — カテゴリカル vs ディメンショナル

### 概念
精神医学の診断には2つのモデルがある。**カテゴリカル（categorical）** =「うつ病である/ない」のように疾患を離散カテゴリとして扱う（DSM の伝統）。**ディメンショナル（dimensional）** =症状の重症度を連続次元のスコアで表す。これは literally に「診断における Boolean vs Float」の対立である。

### DSM カテゴリカル診断への批判
DSM（Diagnostic and Statistical Manual of Mental Disorders）の二値カテゴリは、以下の問題を抱えるとされる（HiTOP陣営の主張、下記Kotov 2017 ほか）：

- **恣意的な閾値（arbitrary diagnostic thresholds）**: 「症状が5つで診断、4つなら非該当」のような線引きが恣意的。subclinical（閾値下）の症状を切り捨てる。
- **正常と病理の間の恣意的境界**、**障害間の不明瞭な境界**。
- **頻繁な併存症（comorbidity）**: ほとんどの患者が同時に複数の診断を負う＝カテゴリが現実を切り損ねている兆候。
- **カテゴリ内の異質性（heterogeneity）**: 「同じ診断の2人が症状を1つも共有しないことがある」ほどカテゴリが粗い。
- **診断の不安定性（diagnostic instability）**。

### 実在文献: HiTOP
**Kotov, R., Krueger, R. F., Watson, D., et al. (2017). "The Hierarchical Taxonomy of Psychopathology (HiTOP): A dimensional alternative to traditional nosologies." *Journal of Abnormal Psychology*, 126(4), 454–477.**（共著者40名超の大型コンソーシアム論文。PubMed PMID: 28333488、被引用2,400超）

HiTOP は症状の観測された共変動に基づいて症候群を構成し、**連続的なディメンショナル・スコア**で精神病理の全範囲（臨床群+地域住民）を捉える。タイトルの "A dimensional alternative" がそのまま「Float による代替」を意味する。後続検証（Kotov et al. 2020, *World Psychiatry*, 精神病スペクトラム）では「精神病関連の特徴づけで DSM 比 50%超の信頼性向上」と報告。

### 補助線: スペクトラム概念の歴史
**Lorna Wing** が1979年に「自閉症の連続体／スペクトラム(autistic continuum/spectrum)」概念を提唱し、Kanner型自閉症と Asperger 症候群を別個の疾患ではなく**一つの連続体上の異なる点**とした。DSM-5(2013)はこれを受けて Asperger を独立診断から外し「自閉スペクトラム症(ASD)」に統合。スペクトラム概念自体は Kraepelin に遡るとされる。出典: Wikipedia "Spectrum disorder"、neurobetter.org（Wing の歴史）、PMC論文（自閉特性の次元分布）。※「スペクトラム」が常に純粋連続かは議論があり、「離散的な下位集団＋次元」のハイブリッド説もある（PMC6537408）——この誠実な留保は付けておくと良い。

### Boolean→Float への接続
これは Boolean→Float の **「人間の心・アイデンティティへの適用例」** として極めて強い。論文では「Boolean→Float は記号論理だけの話ではない。精神医学が DSM のカテゴリカル(=Boolean)から HiTOP のディメンショナル(=Float)へ移行しつつあるのは、人間の状態そのものが連続値で記述されるべきだという、独立した経験科学からの裏付けである」と書ける。UX文脈では「ユーザーを『該当/非該当』でセグメント分けする設計の害」に直結する。

---

## テーマ4: 計算機科学 — bool型 vs float型、しきい値の恣意性、二値→連続化

### 概念
プログラミングの最も基本的な型として `bool`（true/false、1bit）と `float`（連続値の近似、IEEE 754）がある。Boolean→Float はある意味、**「bool で持っていた値を float で持ち直す」というデータモデルのリファクタリング**として最も直接的に実装できる。

### しきい値の恣意性と「二値→連続化」の歴史
計算機科学・機械学習には、Boolean→Float と literally に同じ操作が中核技術として存在する：

- **McCulloch–Pitts ニューロン（1943）**: 最初の人工ニューロンモデル。**閾値（threshold）を超えたら発火(1)、超えなければ非発火(0)** という二値ユニット。活性化関数は **Heaviside 階段関数（step function）**。これは純粋な Boolean。出典: 各CSテキスト、Wikipedia。
- **Rosenblatt のパーセプトロン（1958/1962）**: やはり階段関数（符号関数）で二値出力。
- **シグモイド・ニューロンへの移行**: Heaviside 階段関数は **x=0 で微分不可能、それ以外で微分0** のため勾配降下法（gradient descent / backpropagation）が機能しない。そこで階段関数を **平滑化（smoothed）** した **シグモイド関数 σ(x)=1/(1+e^(−x))** が導入され、出力が **0〜1 の連続値**になった。1980〜90年代のシグモイドは「平滑化された Heaviside 関数」と理解される。→ **これは文字通り Boolean(階段)→Float(シグモイド)の歴史的移行**であり、しかも「連続化したからこそ学習できる(微分可能になる)」という決定的な利得を伴う。出典: 複数のニューラルネット史資料、DeepAI Activation Function。
- **シグモイド/ソフトマックスによる二値→連続化**: シグモイドは生のスコアを「正クラスである確率/度合い」0〜1に写す。ソフトマックスはその多クラス一般化（合計1の分布）。推論時には閾値（例: 0.5）で二値に戻すが、**この閾値こそ恣意的に設計者が選んでいる**。ある研究（arXiv:2505.23615, Differentiable Logic Networks）は「学習時はシグモイドで連続近似し、推論時に厳密な二値出力へ離散化する」threshold layer を扱い、**連続と二値の緊張関係**を明示している。
- **確率的プログラミング（probabilistic programming）**: プログラム中に確率的プリミティブを埋め込み、決定論的な true/false ではなく**確率分布**で値を扱う枠組み。出典: Staton et al., "Semantics for probabilistic programming"（arXiv:1601.04943）。ただし注意——**確率(probability)と度合い(degree/membership)は別物**（Zadeh が1965で釘を刺した点）。「Float=確率」ではなく「Float=連続的な度合い」が長田の本意なら、確率的プログラミングは「隣接技術」であって「同一」ではない、と区別して引くのが学術的に正確。

### Boolean→Float への接続
**最も実装に落ちる系譜**。論文/プロダクトでは「Boolean→Float は抽象哲学ではなく、ニューラルネットが Heaviside 階段関数をシグモイドに置き換えたのと同じ操作だ。そしてその移行は『微分可能になり学習できる』という具体的利得をもたらした。UIにおいても、二値ボタンを連続スライダーにすると『中間状態を学習・記憶・調整できる』という同型の利得が生まれる」と書ける。**しきい値の恣意性**（0.5 は誰が決めた？）が、UX上の「合格点・既読判定・レコメンドの足切り」の恣意性と直結する論点として強力。

---

## テーマ5: 隣接思想 — 非二元論、程度問題、グラデーション思考

> ⚠️ 牽強付会回避の注記: ここは「補助線」であり、テーマ1〜4のような厳密な学術的系譜とは区別して、修辞的・思想的補強として扱うべき領域。論文では「直接の祖先」ではなく「響き合う隣接思想」として控えめに引くこと。

### 概念と接続
- **非二元論（non-dualism）/ 中道**: Kosko(1993) は「Aristotle は退場、Buddha は登場。排中律(A か not-A)は廃され、A かつ not-A に置き換わる。Buddha は A AND not-A を許容し、自然言語の否定『not』が生む人工的な二値性を慎重に避けた」と書いた（出典: Kosko 書評・要約）。仏教の中道(middle way)や四句分別、老荘の連続的世界観は、二値的な切り分けへの懐疑として Boolean→Float と響く。ただし**これは Kosko による解釈であって仏教学の定説ではない**ので、引くなら「Kosko が指摘するように」と帰属を明示するのが安全。
- **程度問題 / グラデーション思考**: 「白か黒か」ではなく「程度の問題(a matter of degree)」という日常的・常識的直観。これは哲学のテーマ2（vagueness）と心理学のテーマ3（スペクトラム）が、専門外の人にとって最も腑に落ちる形に翻訳されたもの。
- **連続体としての世界**: 色（可視光スペクトラム）、温度、年齢など、自然界の多くの量がそもそも連続であり、人間が言語・制度の都合で離散カテゴリに切っている、という観察。

### Boolean→Float への接続
このテーマは **論文の「導入」と「結語」で読者の直観に橋を架ける役割**。「私たちは日常的に『程度の問題だよね』と言う。Boolean→Float はその常識を、論理学・哲学・心理学・計算機科学の四方から厳密に裏付け、UX設計の原理にまで一般化する試みである」という枠組みに使える。**牽強付会を避けるため、東洋思想は「同一起源」ではなく「独立した平行直観」として位置づけること**を強く推奨。

---

## 参考文献（特定できた実在文献）

一次資料を直接確認したものは【一次確認】、検索結果で書誌が確定したものは【書誌確定】と付記。

### 直接の祖先（テーマ1）
1. **Zadeh, L. A. (1965).** "Fuzzy Sets." *Information and Control*, 8(3), 338–353. 【一次確認・PDF全文取得】
   PDF: https://www.dcsc.tudelft.nl/~sc4081/2016/Materials/Zadeh_1965_fuzzy_sets.pdf
   書誌参照: https://www.scirp.org/reference/referencespapers?referenceid=1235352
2. **Łukasiewicz, J.（三値論理, 1920〜／Łukasiewicz–Tarski ℵ₀値, 1930）.** 一次論文タイトルは本調査では未取得。概念史は下記で確定。【書誌確定（概念史）／個別論文=未確認】
   Stanford Encyclopedia of Philosophy, "Many-Valued Logic": https://plato.stanford.edu/entries/logic-manyvalued/
   Wikipedia "Łukasiewicz logic": https://en.wikipedia.org/wiki/%C5%81ukasiewicz_logic
   Wikipedia "Three-valued logic" / "Many-valued logic"
3. **Kosko, B. (1993).** *Fuzzy Thinking: The New Science of Fuzzy Logic.* Hyperion.（大衆化・修辞として）【書誌確定】
   Wikipedia "Bart Kosko": https://en.wikipedia.org/wiki/Bart_Kosko

### 連続体・程度の哲学（テーマ2）
4. **"Sorites Paradox."** *Stanford Encyclopedia of Philosophy*（継続更新エントリ、Winter 2025版確認）.【書誌確定】
   https://plato.stanford.edu/entries/sorites-paradox/
5. **"Fuzzy Logic."** *Stanford Encyclopedia of Philosophy*.【書誌確定】
   https://plato.stanford.edu/entries/logic-fuzzy/
6. **"Vagueness," §3 "The degree theory of truth."** *Routledge Encyclopedia of Philosophy*.【書誌確定】
   https://www.rep.routledge.com/articles/thematic/vagueness/v-2/sections/3-the-degree-theory-of-truth
7. **Fine, K. (1975); Dummett, M. (1975); Keefe, R. (2000)**（supervaluationism）; **Edgington, D. (1996)**（verities, degree theory の一種）. SEP/Routledge/PhilPapers 経由で言及確認、各原典は本調査では個別未取得。【概念=確定／原典個別=未確認】
   PhilPapers "Degree Theories of Vagueness": https://philpapers.org/browse/degree-theories-of-vagueness

### 心理学・スペクトラム（テーマ3）
8. **Kotov, R., Krueger, R. F., Watson, D., et al. (2017).** "The Hierarchical Taxonomy of Psychopathology (HiTOP): A dimensional alternative to traditional nosologies." *Journal of Abnormal Psychology*, 126(4), 454–477. PMID: 28333488.【書誌確定（著者・誌名・巻号・頁・PMID）】
   https://pubmed.ncbi.nlm.nih.gov/28333488/
   公式: https://www.hitop-system.org/key-papers
9. **Kotov, R., et al. (2020).** "Validity and utility of HiTOP: I. Psychosis superspectrum." *World Psychiatry*, 19(2).【書誌確定】
   https://onlinelibrary.wiley.com/doi/full/10.1002/wps.20730
10. **Wing, L.（自閉症連続体/スペクトラム概念, 1979/1981）.** 概念史として確認、原典個別は未取得。【概念=確定／原典=未確認】
    neurobetter.org 歴史記事; Wikipedia "Spectrum disorder": https://en.wikipedia.org/wiki/Spectrum_disorder

### 計算機科学（テーマ4）
11. **McCulloch, W. & Pitts, W. (1943).** "A Logical Calculus of the Ideas Immanent in Nervous Activity." *Bulletin of Mathematical Biophysics*.（閾値=Heaviside 階段関数の二値ニューロン）【概念=確定／原典タイトルは一般知識・本調査内では一次未取得】
12. **Rosenblatt, F. (1958/1962).** パーセプトロン（階段/符号関数）.【概念=確定／原典=未確認】
13. シグモイド＝平滑化Heaviside、微分可能性と学習: DeepAI "Activation Function": https://deepai.org/machine-learning-glossary-and-terms/activation-function 【概念=確定】
14. **連続近似→二値離散化（threshold layer）**: "Learning Interpretable Differentiable Logic Networks for Tabular Regression," arXiv:2505.23615.【書誌確定（プレプリント）】 https://arxiv.org/pdf/2505.23615
15. **確率的プログラミング**: Staton, S., et al. "Semantics for probabilistic programming: higher-order functions, continuous distributions, and soft constraints," arXiv:1601.04943.【書誌確定（プレプリント）】 https://arxiv.org/pdf/1601.04943

### 未確認・要追加検証（誠実な記録）
- Łukasiewicz の **個別原論文**（1920年論文・1930年Łukasiewicz–Tarski論文）の正式タイトル・掲載誌は本調査（US-only検索）では一次確定できず。SEP/Wikipedia の二次記述に基づく。論文化前に SEP の参考文献欄から正式書誌を引くこと。
- **McCulloch–Pitts(1943) / Rosenblatt** の原典書誌は一般に流通する周知文献だが、本調査セッション内では一次PDFを取得していない。引用するなら原典確認を推奨。
- **Edgington 1996 / Fine 1975 / Dummett 1975 / Keefe 2000** は SEP "Sorites Paradox" の本文中で言及を確認したが、各原典は個別取得していない。SEP の Bibliography から正式書誌を取れる。
- 自閉スペクトラムが「純粋連続か、離散下位集団＋次元のハイブリッドか」は議論あり（PMC6537408 等）。スペクトラム＝完全連続と断定しないこと。

---

## 論文シリーズへの応用メモ（3〜5点）

1. **「Boolean は Float の退化ケース」を系譜の背骨にする。** Zadeh(1965) が「古典集合＝二値特性関数はファジィ集合の特殊ケース」と書き、しかも脚注で「[0,1]連続真理値の多値論理」と自己解釈している事実は、Boolean→Float の最強の学術的アンカー。論文シリーズの土台論文で **Zadeh の原文（grade of membership / continuum）と脚注3** を直接引用し、「私の Boolean→Float は造語だが実体は Zadeh のメンバーシップ関数である。本シリーズはそれを論理学を越えて UX・制度・人間像に一般化する」と宣言できる。

2. **「四方からの独立収束」という論証構造を採る。** 論理学(Łukasiewicz)・哲学(sorites/degree theory)・心理学(HiTOP)・計算機科学(sigmoid)が、互いに無関係に「二値→程度」へ移行した——この **収束(convergence)** こそが Boolean→Float の普遍性の証拠だ、という構成にすると説得力が跳ね上がる。各分野が独立だからこそ「これは私の趣味ではなく時代精神だ」と言える。

3. **「閾値の恣意性」を全人類UX改善の実装原理に格上げする。** 各系譜に共通する真の敵は「二値そのもの」ではなく「**設計者が閾値を勝手に固定し、ユーザーから隠すこと**」（DSMの診断閾値、シグモイドの0.5、sorites の鋭い境界）。UXツールの設計指針として「二値判定を残すなら閾値を可視化・可変化せよ」「できれば連続値のまま見せよ」と落とせる。これは tool-deploy 系の各ツールに横断適用できる行動原理。

4. **degree theory vs supervaluationism vs probability の三項対比で自己定位する。** Boolean→Float が選ぶのは (a) supervaluationism の「ギャップ/保留」ではなく **連続的度合い**、(b) probability の「起こりやすさ」ではなく **程度そのもの**（Zadeh が1965で確率と峻別した点を継承）。この二重の区別を1段落で書くと、哲学・統計の専門家からの突っ込みを先回りで防げる。論文の方法論セクション向き。

5. **誠実さの担保＝高階の曖昧性とハイブリッド説に先に触れる。** degree theory には「0.7という値の境界も曖昧では?（higher-order vagueness）」、スペクトラムには「完全連続でなく離散下位集団＋次元のハイブリッドかも」という定番反論がある。これらを **自分から先に挙げて応答する**ことで、牽強付会・我田引水の印象を消し、学術的信頼性を上げる。「Float は万能の真理ではなく、二値より現実適合度が高い表現選択である」という穏当な主張に落とすのが安全かつ強い。
