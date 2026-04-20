// osakenpiro LP — shared data (real DOIs + URLs)

window.OSK_DATA = {
  hero: {
    name_ja: '長田 謙志郎',
    name_en: 'Kenshiro Osada',
    roles: ['ADHD Web Developer', 'Independent Philosopher'],
    location: 'Tokyo, JP',
    handle: 'osakenpiro',
    tagline_ja: '全人類UX改善計画',
    tagline_en: 'the universal-UX-improvement plan',
    manifesto_ja: '宇宙の片隅で、ひとりで考えごとをしている夜',
    manifesto_en: 'a night spent thinking alone in a corner of the universe',
    orcid: '0009-0004-9167-3186',
  },

  // 9 papers. #9 is "preparing" — no DOI yet.
  papers: [
    { n: 'I',    ja: '欲望の形態学',         en: 'Morphology of Desire',        venue: 'Zenodo', doi: '10.5281/zenodo.19106655', year: 2025, core: true },
    { n: 'II',   ja: 'アラインメントの公転', en: 'Circulation of Alignment',    venue: 'Zenodo', doi: '10.5281/zenodo.19106657', year: 2025 },
    { n: 'III',  ja: '江湖原則',             en: 'Jianghu Principle',           venue: 'Zenodo', doi: '10.5281/zenodo.19106661', year: 2025 },
    { n: 'IV',   ja: '思考資本',             en: 'Thought-Capital',             venue: 'Zenodo', doi: '10.5281/zenodo.19106671', year: 2025 },
    { n: 'V',    ja: 'アイデアの遺伝学',     en: 'Genetics of Ideas',           venue: 'Zenodo', doi: '10.5281/zenodo.19106673', year: 2025 },
    { n: 'VI',   ja: '心のグラデーション',   en: 'Gradient of Kokoro',          venue: 'Zenodo', doi: '10.5281/zenodo.19106676', year: 2025 },
    { n: 'VII',  ja: '自在の引力',           en: 'Gravity of Jizai',            venue: 'Zenodo', doi: '10.5281/zenodo.19106695', year: 2025 },
    { n: 'VIII', ja: '三の基底状態',         en: 'Ground State of Three',       venue: 'Zenodo', doi: '10.5281/zenodo.19106680', year: 2025 },
    { n: 'IX',   ja: '解読鍵',               en: 'Decryption Key',              venue: 'Zenodo', doi: null,                      year: null, pending: true },
  ],

  creative: [
    { kind: 'manga',   ja: 'PEACE PIECE',  en: 'PEACE PIECE',      meta: '連載 · Jump Rookie!', detail: '戦争と静寂の短篇集',      url: 'https://rookie.shonenjump.com/series/zGZPbQ8SCbs' },
    { kind: 'novel',   ja: '星は知らない', en: 'Hoshi wa Shiranai', meta: '8章 · SF長編',        detail: '超長期的孤独のSF',        url: 'https://kakuyomu.jp/users/osakenpiro' },
    { kind: 'novel',   ja: '0.5の魔女',     en: '0.5 no Majo',       meta: '連載予定',            detail: '連続値で生きる魔女',      url: '#', pending: true },
    { kind: 'picture', ja: 'じこしょうかい',en: 'Jikoshoukai',       meta: '全17巻 · 85キャラ完結', detail: '自己紹介という哲学行為', url: 'https://osakenpiro.github.io/jikoshoukai/' },
  ],

  // 8 tools, confirmed URLs. Last one is pending.
  tools: [
    { icon: '🌏', ja: '僕の惑星',         en: 'Boku no Wakusei',        sub: 'orbital hub · canonical brand surface', stack: 'single html · canvas',    url: 'https://osakenpiro.github.io', hero: true },
    { icon: '◉',  ja: 'SATORI',           en: 'SATORI',                 sub: '四賢者との哲学対話',                   stack: 'Claude API · CF Worker',   url: 'https://osakenpiro.github.io/satori/' },
    { icon: '🐸', ja: 'わっかずかん',      en: 'Wakka-zukan',            sub: '連続値で生き物を眺める図鑑',            stack: 'localStorage · SVG',       url: 'https://osakenpiro.github.io/wakkazukan/' },
    { icon: '🧪', ja: '人類の素材図鑑',     en: 'Materials of Civilization', sub: '砂・鉄・プラスチック 15章',         stack: 'D3.js · single html',      url: 'https://osakenpiro.github.io/materials-of-civilization/' },
    { icon: '💰', ja: 'わたしのお財布',     en: 'Watashi Wallet',         sub: '52都市の家計データ × 自由度指数',       stack: 'D3.js · real data',        url: 'https://osakenpiro.github.io/watashi-wallet/' },
    { icon: '🗾', ja: '人口動態マップ',     en: 'Japan Wallet Map',       sub: '飛鳥時代〜2050年 · 5レイヤー可視化',     stack: 'D3.js · TopoJSON',         url: 'https://osakenpiro.github.io/japan-wallet-map/' },
    { icon: '🧬', ja: 'じこしょうかい',     en: 'Jikoshoukai Portal',     sub: '全17巻85キャラの絵本ポータル',          stack: 'single html',              url: 'https://osakenpiro.github.io/jikoshoukai/' },
    { icon: '☁', ja: '天人𦻙記',          en: 'Tenjin-ki',              sub: '準備中',                                 stack: '—',                        url: '#', pending: true },
  ],

  socials: [
    { k: 'X',        handle: '@kenpiro7',   url: 'https://x.com/kenpiro7',                    glyph: '𝕏' },
    { k: 'TikTok',   handle: '@panio54',    url: 'https://www.tiktok.com/@panio54',           glyph: '◈' },
    { k: 'pixiv',    handle: '@osakenpiro', url: 'https://www.pixiv.net/users/11085694',      glyph: 'P' },
    { k: 'Kakuyomu', handle: '@osakenpiro', url: 'https://kakuyomu.jp/users/osakenpiro',      glyph: '書' },
    { k: 'note',     handle: '@osakenpiro', url: 'https://note.com/osakenpiro',               glyph: 'n' },
    { k: 'GitHub',   handle: 'osakenpiro',  url: 'https://github.com/osakenpiro',             glyph: '◉' },
  ],
};
