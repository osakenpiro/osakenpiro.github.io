// osakenpiro DD (Design Dashboard) v3 — shared data
// Inherits from lp/data.js, adds `hh` (HumusHuman) section.
// Edit once, everything updates.

window.OSK_DATA = {
  hero: {
    name_ja: '長田 謙志郎',
    name_en: 'Kenshiro Osada',
    yomi: 'おさだ けんしろう',
    roles_en: ['ADHD Web Developer', 'Independent Philosopher'],
    roles_ja: ['フリー開発者', '独立研究者'],
    location: 'Tokyo, JP',
    handle: '@osakenpiro',
    tagline_ja: '全人類UX改善計画',
    tagline_en: 'the universal-UX-improvement plan',
    manifesto_ja: '宇宙の片隅で、ひとりで考えごとをしている夜',
    manifesto_en: 'a night spent thinking alone in a corner of the universe',
    orcid: '0009-0004-9167-3186',
  },

  // 9 papers. #9 is "preparing" — no DOI yet.
  // `tone` = post-it color (per-paper core color, 9 distinct hues).
  papers: [
    { n: 'I',    ja: '欲望の形態学',         en: 'Morphology of Desire',       short_ja: '欲望',     venue: 'Zenodo', doi: '10.5281/zenodo.19106655', year: 2025, core: true,
      tone: '#f4c95d', file: 'papers/paper-I-morphology-of-desire.html' },
    { n: 'II',   ja: 'アラインメントの公転', en: 'Circulation of Alignment',   short_ja: '公転',     venue: 'Zenodo', doi: '10.5281/zenodo.19106657', year: 2025,
      tone: '#a8c79b', file: 'papers/paper-II-circulation-of-alignment.html' },
    { n: 'III',  ja: '江湖原則',             en: 'Jianghu Principle',          short_ja: '江湖',     venue: 'Zenodo', doi: '10.5281/zenodo.19106661', year: 2025,
      tone: '#e89b7a', file: 'papers/paper-III-jianghu-principle.html' },
    { n: 'IV',   ja: '思考資本',             en: 'Thought-Capital',            short_ja: '資本',     venue: 'Zenodo', doi: '10.5281/zenodo.19106671', year: 2025,
      tone: '#c9a8e0', file: 'papers/paper-IV-thought-capital.html' },
    { n: 'V',    ja: 'アイデアの遺伝学',     en: 'Genetics of Ideas',          short_ja: '遺伝',     venue: 'Zenodo', doi: '10.5281/zenodo.19106673', year: 2025,
      tone: '#7fb8c4', file: 'papers/paper-V-genetics-of-ideas.html' },
    { n: 'VI',   ja: '心のグラデーション',   en: 'Gradient of Kokoro',         short_ja: '心',       venue: 'Zenodo', doi: '10.5281/zenodo.19106676', year: 2025,
      tone: '#ef9a9a', file: 'papers/paper-VI-gradient-of-kokoro.html' },
    { n: 'VII',  ja: '自在の引力',           en: 'Gravity of Jizai',           short_ja: '自在',     venue: 'Zenodo', doi: '10.5281/zenodo.19106695', year: 2025,
      tone: '#f0d36a', file: 'papers/paper-VII-gravity-of-jizai.html' },
    { n: 'VIII', ja: '三の基底状態',         en: 'Ground State of Three',      short_ja: '三',       venue: 'Zenodo', doi: '10.5281/zenodo.19106680', year: 2025,
      tone: '#b8d08a', file: 'papers/paper-VIII-ground-state-of-three.html' },
    { n: 'IX',   ja: '解読鍵',               en: 'Decryption Key',             short_ja: '解読',     venue: 'Zenodo', doi: null,                      year: null, pending: true,
      tone: '#d9d9d9', file: 'papers/paper-IX-decryption-key.html' },
  ],

  creative: [
    { kind: 'manga',   ja: 'PEACE PIECE',    en: 'PEACE PIECE',       meta: '連載 · manga',          detail: '戦争と静寂の短篇集',      url: 'https://rookie.shonenjump.com/series/zGZPbQ8SCbs' },
    { kind: 'novel',   ja: '星は知らない',   en: 'Hoshi wa Shiranai', meta: '8章 · SF長編',           detail: '超長期的孤独のSF',        url: 'https://kakuyomu.jp/works/16817330664193948573' },
    { kind: 'novel',   ja: '0.5の魔女',      en: '0.5 no Majo',       meta: '連載中 · カクヨム',      detail: '連続値で生きる魔女',      url: '#' },
    { kind: 'picture', ja: 'じこしょうかい', en: 'Jikoshoukai',       meta: '全17巻 · 85キャラ完結',  detail: '自己紹介という哲学行為', url: 'https://osakenpiro.github.io/jikoshoukai/' },
  ],

  // GEN:TOOLS:START — gen_dd.py (成果物DB=正本 / 手書き編集はDB側メモ・名前へ)
  tools: [
    { icon: "🎲", ja: "バク運スカウター — 運力計測器", en: "bakuun-scouter", sub: "運の計測と運の貯金 — 遊ばない日が運になる運力計測器 · 0.90", stack: "single html · game", url: "https://osakenpiro.github.io/bakuun-scouter/", hero: true },
    { icon: "🧩", ja: "部品工場 PARTS — コピペ部品ライブラリ", en: "parts", sub: "自己完結コピペ部品10点(星灯カード/ひとあかりヘッダ/フロートつまみ/星海シート/金箔けじめ線/ふれまわり/月金ボタン… · 0.90", stack: "single html", url: "https://osakenpiro.github.io/parts/", hero: true },
    { icon: "🌌", ja: "僕の銀河系 Galaxy", en: "galaxy", sub: "Visionium全体構造をforce-directed graphで可視化(観測層L3b) · 0.87", stack: "single html", url: "https://osakenpiro.github.io/galaxy/", hero: true },
    { icon: "🌊", ja: "深海テスト — Shinkai Test", en: "shinkai", sub: "9問の潜水型6軸診断(PHI/CRE/TEC/OUT/VIT/EXP) · 0.85", stack: "single html", url: "https://osakenpiro.github.io/shinkai/", hero: true },
    { icon: "👣", ja: "あしあとマップ — Ashiato Map", en: "ashiato", sub: "地面に残すサイン · 0.80", stack: "single html", url: "https://osakenpiro.github.io/ashiato/", hero: true },
    { icon: "📖", ja: "WORKS — ぜんぶのとりせつ（トリセツ工場）", en: "works", sub: "全成果物のとりせつ（紹介ページ）一括生成層（大行軍v2 Lane ι SES-428） · 0.70", stack: "landing page", url: "https://osakenpiro.github.io/works/", hero: true },
    { icon: "🌍", ja: "HELLO WAR(L)D — 地図とりあい観察庭", en: "hello-warld", sub: "P0ソロ観察庭（大行軍v2 Laneδ、SES-404土地神分身 2026-06-06、commit c73a5815） · 0.60", stack: "single html · game", url: "https://osakenpiro.github.io/hello-warld/", hero: true },
    { icon: "💤", ja: "夢見る少女は眠れない", en: "yumemi-shoujo", sub: "起こさないで遊ぶ二重放置ゲー — 少女が自然に目覚めるのを待つと夢が聞ける · 0.55", stack: "single html · game", url: "https://osakenpiro.github.io/yumemi-shoujo/", hero: true },
    { icon: "🫁", ja: "Breathe", en: "breathe", sub: "4-7-8/Box/Calm 呼吸法ガイド", stack: "single html", url: "https://osakenpiro.github.io/breathe/", hero: true },
    { icon: "📊", ja: "MIERU（見える）", en: "MIERU", sub: "CSVをアップロードして可視化するツール", stack: "single html", url: "https://osakenpiro.github.io/MIERU/", hero: true },
    { icon: "🔁", ja: "Queue Dashboard", en: "queue-dashboard", sub: "見直し待ち案件、優先度と放置年数", stack: "single html", url: "https://osakenpiro.github.io/re-design/queue-dashboard.html", hero: true },
    { icon: "🧙", ja: "VR Akinator", en: "vr-akinator", sub: "分類法のメタ分類(双子構造の片割れ)", stack: "single html", url: "https://osakenpiro.github.io/vr-akinator/", hero: true },
    { icon: "📋", ja: "Web制作ヒアリングシート", en: "hearing-sheet", sub: "LP/Web制作案件の初回ヒアリングフォーム", stack: "single html", url: "https://osakenpiro.github.io/hearing-sheet/", hero: true },
    { icon: "🔆", ja: "big-light（ビッグライト）", en: "big-light", sub: "ビッグライトモード共通規格(CSS/JSライブラリ、CDN配布、MIT)", stack: "—", url: "https://osakenpiro.github.io/big-light/", hero: true },
    { icon: "📜", ja: "godwiki（神話DB）", en: "godwiki", sub: "ギリシャ・北欧・日本の神話エピソードDB(24件)", stack: "—", url: "https://osakenpiro.github.io/godwiki/", hero: true },
    { icon: "💡", ja: "あったらいいな図鑑", en: "attara-iina", sub: "みんなの『あんなこといいな』を投稿で集める", stack: "landing page", url: "https://osakenpiro.github.io/attara-iina/", hero: true },
    { icon: "🍵", ja: "あまっちゃ／にがっちゃ", en: "amaccha-nigaccha", sub: "抹茶の甘さを0.0〜1.0で選ぶ Boolean→Float飲料UX試作", stack: "landing page", url: "https://osakenpiro.github.io/amaccha-nigaccha/", hero: true },
    { icon: "🧬", ja: "じこしょうかいシリーズ（絵本全17巻）", en: "Jikoshoukai Portal", sub: "絵本シリーズ全１７巻ポータル(85キャラ)", stack: "single html", url: "https://osakenpiro.github.io/jikoshoukai/", hero: true },
    { icon: "🐸", ja: "わっかずかん", en: "Wakka-zukan", sub: "同心円でカテゴリを並べる視覚分類器(#01分類わっか)", stack: "localStorage · SVG", url: "https://osakenpiro.github.io/wakkazukan/", hero: true },
    { icon: "📕", ja: "パンダと哲学とAI（KDP）", en: "B0GT4HJBF4", sub: "KDP書籍", stack: "—", url: "https://www.amazon.co.jp/dp/B0GT4HJBF4", hero: true },
    { icon: "🎨", ja: "ポートフォリオデモ（制作デモ）", en: "portfolio-demos", sub: "制作デモ(ベーカリーLPこむぎ日和/SaaS LP FlowTask)", stack: "landing page", url: "https://osakenpiro.github.io/portfolio-demos/", hero: true },
    { icon: "📗", ja: "人類の素材図鑑（KDP）", en: "B0GX2X9YF3", sub: "KDP書籍", stack: "—", url: "https://www.amazon.co.jp/dp/B0GX2X9YF3", hero: true },
    { icon: "⚔", ja: "六剋（りくこく）", en: "rikkoku", sub: "斬・刺・打・固・軟・翻の六属性が剋しあう Boolean→Float RPG", stack: "single html · game", url: "https://osakenpiro.github.io/rikkoku/", hero: true },
    { icon: "🗂", ja: "役割分化地図", en: "topology", sub: "誰が何を担当するか、Visioniumを7層構造で解剖", stack: "single html", url: "https://osakenpiro.github.io/ecosystem/topology.html", hero: true },
    { icon: "🧩", ja: "生態系チェッカー", en: "ecosystem-checker", sub: "持っている道具とプランから到達度と追加機能を判定", stack: "single html", url: "https://osakenpiro.github.io/ecosystem-checker/", hero: true },
    { icon: "🌐", ja: "生態系相関総観", en: "ecosystem", sub: "データがどう巡るか、軽アニメで見る生態系フロー", stack: "single html", url: "https://osakenpiro.github.io/ecosystem/", hero: true },
    { icon: "🧪", ja: "素材図鑑（ツール版）", en: "Materials of Civilization", sub: "文明を素材の系譜として並べる(#05)", stack: "D3.js · single html", url: "https://osakenpiro.github.io/materials-of-civilization/", hero: true },
    { icon: "☁", ja: "フワッカ FUWAKKA", en: "fuwakka", sub: "done/not-doneをやめるfuzzy todo · 0.85", stack: "single html", url: "https://osakenpiro.github.io/fuwakka/" },
    { icon: "🎚", ja: "何度メーター NANDO-METER", en: "nandometer", sub: "迷いの要素を重みづけして確信度を0〜100%(Float)で測る · 0.85", stack: "single html", url: "https://osakenpiro.github.io/nandometer/" },
    { icon: "🐢", ja: "怠け通し NAMAKE-DOOSHI", en: "namakedooshi", sub: "サボっても崩れない段階ストリーク習慣トラッカー · 0.85", stack: "single html", url: "https://osakenpiro.github.io/namakedooshi/" },
    { icon: "🧠", ja: "概念辞典 — 法則・効果・原理・剃刀", en: "gainen", sub: "法則・効果・原理・剃刀を一行定義+創作フックで蓄積(60件) · 0.85", stack: "—", url: "https://osakenpiro.github.io/gainen/" },
    { icon: "🏮", ja: "格言辞典 — 創作参照層", en: "kakugen", sub: "創作参照3DBの1つ · 0.80", stack: "—", url: "https://osakenpiro.github.io/kakugen/" },
    { icon: "🎨", ja: "秀逸表現辞典 — コピペ・ミーム・名セリフ・帯・書き出し", en: "hyogen", sub: "優れた表現を技法分析+短い引用(15語未満)+出典で蓄積(21件) · 0.80", stack: "—", url: "https://osakenpiro.github.io/hyogen/" },
    { icon: "🔌", ja: "Discord配管マップ (disco-map)", en: "disco-map", sub: "disco-overhaul Phase D · 0.70", stack: "single html", url: "https://osakenpiro.github.io/disco-map/" },
    { icon: "🎵", ja: "HIBIKI", en: "hibiki", sub: "4コードアルペジオメーカー", stack: "single html", url: "https://osakenpiro.github.io/hibiki/" },
    { icon: "💡", ja: "HIRAMEKI", en: "hirameki", sub: "世界を良くするアイデアをカード化してXに蒔く", stack: "single html", url: "https://osakenpiro.github.io/hirameki/" },
    { icon: "🪞", ja: "KAGAMI（鏡）", en: "kagami", sub: "毎日ひとつの問い→洞察→行動をXに記録する日記ツール", stack: "single html", url: "https://osakenpiro.github.io/kagami/" },
    { icon: "🗾", ja: "KON-NICHI-WAR(L)D", en: "konnichiwarld", sub: "美しい日本語を1枚ずつ学ぶカード", stack: "single html", url: "https://osakenpiro.github.io/konnichiwarld/" },
    { icon: "◉", ja: "SATORI", en: "SATORI", sub: "開眼系AI賢人", stack: "Claude API · CF Worker", url: "https://osakenpiro.github.io/satori/" },
    { icon: "📇", ja: "contact（名刺）", en: "contact", sub: "名刺 FILE 003", stack: "landing page", url: "https://osakenpiro.github.io/contact/" },
    { icon: "🌏", ja: "cosmos（軌道）", en: "Boku no Wakusei", sub: "軌道 FILE 004", stack: "single html · canvas", url: "https://osakenpiro.github.io/cosmos/" },
    { icon: "🛠", ja: "⌨ Shortcuts & Tools", en: "shortcuts", sub: "PowerToys/Windows/Chrome/Clip Studio/ComfyUI/Tartarus V2/Str…", stack: "single html", url: "https://osakenpiro.github.io/shortcuts/" },
    { icon: "📚", ja: "たなずかん", en: "tana-zukan", sub: "tier shelf dictionary", stack: "single html", url: "https://osakenpiro.github.io/tana-zukan/" },
    { icon: "🎮", ja: "ぼうけんのしょ", en: "boukennosho", sub: "積みゲーを倒すRPG風の積みゲー管理ツール", stack: "single html", url: "https://osakenpiro.github.io/boukennosho/" },
    { icon: "💰", ja: "わたしのお財布", en: "Watashi Wallet", sub: "日本人の自由度マップ", stack: "D3.js · real data", url: "https://osakenpiro.github.io/watashi-wallet/" },
    { icon: "🌀", ja: "バネットマップ / Banet Map", en: "banet-map", sub: "力学的関係ビジュアライザ", stack: "single html", url: "https://osakenpiro.github.io/banet-map/" },
    { icon: "✴", ja: "メの島 / ME-NO-SHIMA", en: "me-no-shima", sub: "ぽこあポケモン由来ファンメイド島構想・建築設計書シリーズ（全13施設+全体図+別館、画像14枚）", stack: "—", url: "https://osakenpiro.github.io/me-no-shima/" },
    { icon: "🗾", ja: "日本のお財布", en: "Japan Wallet Map", sub: "人口と権力の1400年、東京一極集中をバブルで可視化", stack: "D3.js · TopoJSON", url: "https://osakenpiro.github.io/japan-wallet-map/" },
    { icon: "🏯", ja: "日本可視化列島", en: "japan-visualization", sub: "人口動態・家計・地震の日本可視化ツール群ハブ", stack: "landing page", url: "https://osakenpiro.github.io/japan-visualization/" },
    { icon: "🌏", ja: "日本地震マップ", en: "japan-earthquake-map", sub: "1850-2060年の震災を三重同心円で可視化", stack: "single html", url: "https://osakenpiro.github.io/japan-earthquake-map/" },
    { icon: "🌙", ja: "月 — osakenpiro tools", en: "moon", sub: "osakenpiro全ツール一覧ポータル", stack: "landing page", url: "https://osakenpiro.github.io/moon/" },
    { icon: "🔥", ja: "炎上！SNS", en: "enjou-sns", sub: "炎上シミュレーター v6", stack: "single html · game", url: "https://osakenpiro.github.io/enjou-sns/" },
    { icon: "🚪", ja: "玄関 — 全部がぼく", en: "osakenpiro.github.io", sub: "柱別セクションは成果物DBから自動生成(gen_entrance.py、玄関掲載列=精選フラグ、2026-06-06 S…", stack: "landing page", url: "https://osakenpiro.github.io/" },
    { icon: "📌", ja: "画鋲（pin-wall）", en: "Pin-Wall (gabyo)", sub: "生成画像を貼る場", stack: "single html · CF Worker", url: "https://osakenpiro.github.io/pin-wall/" },
    { icon: "🔢", ja: "百ますグリッド", en: "hyakumasu", sub: "百ますグリッド hyakumasu", stack: "single html", url: "https://osakenpiro.github.io/hyakumasu/" },
    { icon: "🦊", ja: "立体図鑑 zukan3d", en: "zukan3d", sub: "駒・素材を3D/ARで観る図鑑", stack: "GLB · manifest", url: "https://osakenpiro.github.io/zukan3d/" },
    { icon: "☁", ja: "天人𦻙記", en: "Tenjin-ki", sub: "準備中", stack: "—", url: "#", pending: true },
  ],
  // GEN:TOOLS:END

  // HumusHuman — GUBr (game-character-select) section.
  // 6 立ち絵 slots. Images land later; for now, layout-only.
  // `ptds: true` = 秘書子 (gets physical-twin treatment: task tray + binder cabinet).
  hh: [
    { id: 'fire',   kind: 'SATORI', ja: '炎の賢者',      en: 'Sage of Fire',    element: '炎', tone: '#e89b7a' },
    { id: 'water',  kind: 'SATORI', ja: '水の賢者',      en: 'Sage of Water',   element: '水', tone: '#7fb8c4' },
    { id: 'wind',   kind: 'SATORI', ja: '風の賢者',      en: 'Sage of Wind',    element: '風', tone: '#a8c79b' },
    { id: 'earth',  kind: 'SATORI', ja: '土の賢者',      en: 'Sage of Earth',   element: '土', tone: '#c9a58a' },
    { id: 'moppoi', kind: 'PROXY',  ja: 'もっぽい/だらりん', en: 'Moppoi / Dararin', element: 'だらり', tone: '#d9d6cc' },
    { id: 'hishoco',kind: 'ASSIST', ja: '秘書子',        en: 'HishoCo',         element: '事務', tone: '#f4c95d', ptds: true },
  ],

  socials: [
    { k: 'X',        handle: '@osakenpiro',   url: 'https://x.com/osakenpiro',                 glyph: '𝕏', avatar: 'assets/sns-01-x-avatar.png', bg: 'assets/sns-01-x-bg.png' },
    { k: 'TikTok',   handle: '@panio54',    url: 'https://www.tiktok.com/@panio54',        glyph: '◈', avatar: 'assets/sns-02-tiktok-avatar.png', bg: 'assets/sns-02-tiktok-bg.png' },
    { k: 'pixiv',    handle: '@kenpiro7',   url: 'https://www.pixiv.net/users/11085694',   glyph: 'P', avatar: 'assets/sns-03-pixiv-avatar.png', bg: 'assets/sns-03-pixiv-bg.png' },
    { k: 'Kakuyomu', handle: '@osakenpiro', url: 'https://kakuyomu.jp/users/osakenpiro',   glyph: '書', avatar: 'assets/sns-04-kakuyomu-avatar.png', bg: 'assets/sns-04-kakuyomu-bg.png' },
    { k: 'note',     handle: '@osakenpiro', url: 'https://note.com/osakenpiro',            glyph: 'n', avatar: 'assets/sns-05-note-avatar.png', bg: 'assets/sns-05-note-bg.png' },
    { k: 'GitHub',   handle: 'osakenpiro',  url: 'https://github.com/osakenpiro',          glyph: '◉', avatar: 'assets/sns-06-github-avatar.png', bg: 'assets/sns-06-github-bg.png' },
  ],

  // GEN:DDTL:START — gen_dd.py 年表(台帳に載った日ベース・誕生日列なき正直設計)
  timeline: [
    { d: "2026-05-31", n: 46, label: "台帳創世 — 一斉登録", items: [] },
    { d: "2026-06-01", n: 1, items: [{ ja: "Discord配管マップ (disco-map)", url: "https://osakenpiro.github.io/disco-map/" }] },
    { d: "2026-06-02", n: 1, items: [{ ja: "メの島 / ME-NO-SHIMA", url: "https://osakenpiro.github.io/me-no-shima/" }] },
    { d: "2026-06-03", n: 4, items: [{ ja: "格言辞典 — 創作参照層", url: "https://osakenpiro.github.io/kakugen/" }, { ja: "概念辞典 — 法則・効果・原理・剃刀", url: "https://osakenpiro.github.io/gainen/" }, { ja: "秀逸表現辞典 — コピペ・ミーム・名セリフ・帯・書き出し", url: "https://osakenpiro.github.io/hyogen/" }, { ja: "画像正本ストア（Google Drive / Visionium/images）", url: null }] },
    { d: "2026-06-04", n: 1, items: [{ ja: "A＼mI／DA＼（ア・ミ・ダ）", url: "https://kakuyomu.jp/works/2912051601256382667" }] },
    { d: "2026-06-06", n: 8, items: [{ ja: "HELLO WAR(L)D — 地図とりあい観察庭", url: "https://osakenpiro.github.io/hello-warld/" }, { ja: "x-post スキル（X投稿 Web Intent方式）", url: "https://github.com/osakenpiro/claude-shared/tree/main/skills/x-post" }, { ja: "WORKS — ぜんぶのとりせつ（トリセツ工場）", url: "https://osakenpiro.github.io/works/" }, { ja: "あしあとマップ — Ashiato Map", url: "https://osakenpiro.github.io/ashiato/" }, { ja: "深海テスト — Shinkai Test", url: "https://osakenpiro.github.io/shinkai/" }, { ja: "夢見る少女は眠れない", url: "https://osakenpiro.github.io/yumemi-shoujo/" }, { ja: "部品工場 PARTS — コピペ部品ライブラリ", url: "https://osakenpiro.github.io/parts/" }, { ja: "バク運スカウター — 運力計測器", url: "https://osakenpiro.github.io/bakuun-scouter/" }] },
  ],
  // GEN:DDTL:END
};
