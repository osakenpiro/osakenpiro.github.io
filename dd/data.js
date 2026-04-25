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
    { kind: 'manga',   ja: 'PEACE PIECE',    en: 'PEACE PIECE',       meta: '連載 · manga',          detail: '戦争と静寂の短篇集',      url: '#' },
    { kind: 'novel',   ja: '星は知らない',   en: 'Hoshi wa Shiranai', meta: '8章 · SF長編',           detail: '超長期的孤独のSF',        url: '#' },
    { kind: 'novel',   ja: '0.5の魔女',      en: '0.5 no Majo',       meta: '連載中 · カクヨム',      detail: '連続値で生きる魔女',      url: '#' },
    { kind: 'picture', ja: 'じこしょうかい', en: 'Jikoshoukai',       meta: '全17巻 · 85キャラ完結',  detail: '自己紹介という哲学行為', url: 'https://osakenpiro.github.io/jikoshoukai/', comic: 'assets/tool-07-jikoshoukai.png' },
  ],

  tools: [
    { icon: '🌏', ja: '僕の惑星',           en: 'Boku no Wakusei',         sub: 'orbital hub · canonical brand surface', stack: 'single html · canvas',     url: 'https://osakenpiro.github.io', comic: 'assets/tool-01-boku-no-wakusei.png', hero: true },
    { icon: '◉',  ja: 'SATORI',             en: 'SATORI',                  sub: '四賢者との哲学対話',                    stack: 'Claude API · CF Worker',    url: 'https://osakenpiro.github.io/satori/', comic: 'assets/tool-02-satori.png' },
    { icon: '🐸', ja: 'わっかずかん',       en: 'Wakka-zukan',             sub: '連続値で生き物を眺める図鑑',             stack: 'localStorage · SVG',        url: 'https://osakenpiro.github.io/wakkazukan/', comic: 'assets/tool-03-wakka-zukan.png' },
    { icon: '🧪', ja: '人類の素材図鑑',     en: 'Materials of Civilization',sub: '砂・鉄・プラスチック 15章',           stack: 'D3.js · single html',       url: 'https://osakenpiro.github.io/materials-of-civilization/', comic: 'assets/tool-04-materials.png' },
    { icon: '💰', ja: 'わたしのお財布',     en: 'Watashi Wallet',          sub: '52都市の家計データ × 自由度指数',        stack: 'D3.js · real data',         url: 'https://osakenpiro.github.io/watashi-wallet/', comic: 'assets/tool-05-watashi-wallet.png' },
    { icon: '🗾', ja: '人口動態マップ',     en: 'Japan Wallet Map',        sub: '飛鳥時代〜2050年 · 5レイヤー可視化',      stack: 'D3.js · TopoJSON',          url: 'https://osakenpiro.github.io/japan-wallet-map/', comic: 'assets/tool-06-japan-wallet-map.png' },
    { icon: '🧬', ja: 'じこしょうかい',     en: 'Jikoshoukai Portal',      sub: '全17巻85キャラの絵本ポータル',           stack: 'single html',               url: 'https://osakenpiro.github.io/jikoshoukai/' },
    { icon: '☁',  ja: '天人𦻙記',          en: 'Tenjin-ki',               sub: '準備中',                                  stack: '—',                         url: '#', comic: 'assets/tool-08-tenjin-ki.png', pending: true },
  ],

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
    { k: 'TikTok',   handle: '@osakenpiro', url: 'https://www.tiktok.com/@osakenpiro',     glyph: '◈', avatar: 'assets/sns-02-tiktok-avatar.png', bg: 'assets/sns-02-tiktok-bg.png' },
    { k: 'pixiv',    handle: '@osakenpiro', url: 'https://www.pixiv.net/users/osakenpiro', glyph: 'P', avatar: 'assets/sns-03-pixiv-avatar.png', bg: 'assets/sns-03-pixiv-bg.png' },
    { k: 'Kakuyomu', handle: '@osakenpiro', url: 'https://kakuyomu.jp/users/osakenpiro',   glyph: '書', avatar: 'assets/sns-04-kakuyomu-avatar.png', bg: 'assets/sns-04-kakuyomu-bg.png' },
    { k: 'note',     handle: '@osakenpiro', url: 'https://note.com/osakenpiro',            glyph: 'n' },
    { k: 'GitHub',   handle: 'osakenpiro',  url: 'https://github.com/osakenpiro',          glyph: '◉' },
  ],
};
