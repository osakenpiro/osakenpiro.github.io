/* FP-HUD: public projection only. No rules, network state or persistence. */
(() => {
  'use strict';
  const roles = {genie: '魔人 · 出題', player: '質問者', spectator: '観戦'};
  const mounts = new WeakMap();
  const text = value => typeof value === 'string' ? value : '';
  const el = (tag, className, value) => {
    const node = document.createElement(tag);
    node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  function initials(name, id) {
    const words = name.trim().split(/\s+/u).filter(Boolean);
    if (!words.length) {
      let hash = 0;
      for (const char of id) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
      return ['✦', '☾', '❋', '◇'][hash % 4];
    }
    const graphemes = value => typeof Intl.Segmenter === 'function'
      ? Array.from(new Intl.Segmenter('ja', {granularity: 'grapheme'}).segment(value), s => s.segment)
      : Array.from(value);
    return (words.length > 1 ? words.slice(0, 2).map(w => graphemes(w)[0]) : graphemes(words[0]).slice(0, 2)).join('').toLocaleUpperCase('ja');
  }
  function avatarURL(value) {
    if (!text(value).trim()) return '';
    try {
      const url = new URL(value, document.baseURI);
      if (url.username || url.password) return '';
      // Remote avatars must be existing public HTTPS assets, approved by the adapter.
      if (url.protocol === 'https:' || (url.origin === location.origin && url.protocol === 'http:') ||
          (location.protocol === 'file:' && url.protocol === 'file:')) return url.href;
    } catch (_) { /* Invalid URLs use the stable fallback. */ }
    return '';
  }
  function project(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.players)) throw new TypeError('HUD snapshot.players must be an array');
    const ids = new Set();
    const players = snapshot.players.map(p => {
      if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) || !Object.hasOwn(roles, p.role)) {
        throw new TypeError('HUD players require unique string ids and public roles');
      }
      ids.add(p.id);
      // Short-circuit before even reading a hidden score; never cache the input object.
      const score = p.scoreVisible === true ? p.score : null;
      return {id: p.id, name: text(p.name), role: p.role, avatarUrl: avatarURL(p.avatarUrl),
        score: Number.isFinite(score) ? score : null,
        awards: Number.isFinite(score) ? window.FPScorePile.normalize(p.awards) : null};
    });
    return {players, activePlayerId: snapshot.activePlayerId, activeLabel: text(snapshot.activeLabel), selfId: snapshot.selfId};
  }
  function mount(container, snapshot) {
    if (!container || container.nodeType !== 1) throw new TypeError('HUD container must be an Element');
    let current = project(snapshot);
    mounts.get(container)?.destroy();
    const root = el('section', 'fp-player-hud');
    root.setAttribute('aria-label', 'メンバー・得点');
    const head = el('div', 'fp-hud-heading');
    const title = el('h2', 'fp-hud-title', '卓を囲む仲間');
    const count = el('span', 'fp-hud-count');
    head.append(title, count);
    const list = el('ol', 'fp-hud-list');
    list.tabIndex = 0;
    list.setAttribute('aria-label', 'メンバーと得点。左右キーでスクロール');
    const foot = el('div', 'fp-hud-foot');
    const scaleText = el('span', 'fp-hud-scale');
    const status = el('span', 'fp-hud-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    foot.append(scaleText, status);
    root.append(head, list, foot);
    container.append(root);
    const cards = new Map();
    let destroyed = false;
    function makeCard(id) {
      const card = el('li', 'fp-hud-player');
      card.dataset.playerId = id;
      const portrait = el('div', 'fp-hud-portrait');
      portrait.setAttribute('aria-hidden', 'true');
      const monogram = el('span', 'fp-hud-monogram');
      const img = el('img', 'fp-hud-avatar');
      img.alt = ''; img.hidden = true; img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => { img.hidden = true; monogram.hidden = false; });
      img.addEventListener('load', () => { img.hidden = false; monogram.hidden = true; });
      portrait.append(monogram, img);
      const turn = el('span', 'fp-hud-turn');
      const name = el('b', 'fp-hud-name');
      const role = el('span', 'fp-hud-role');
      const score = el('span', 'fp-hud-score');
      const pile = el('div', 'fp-hud-pile');
      pile.setAttribute('aria-hidden', 'true');
      const detail = el('details', 'fp-hud-awards');
      const summary = el('summary', 'fp-hud-awards-summary');
      const breakdown = el('div', 'fp-hud-breakdown');
      detail.append(summary, breakdown);
      // Integrator-owned DOM: update never clears this slot. No extra snapshot fields.
      const actions = el('div', 'fp-hud-actions');
      actions.dataset.fpHudActions = id;
      card.append(portrait, turn, name, role, pile, score, detail, actions);
      return {card, portrait, monogram, img, turn, name, role, score, pile, detail, summary, breakdown, actions, avatar: null, awardKey: null};
    }
    function paint(s) {
      const visible = s.players.filter(p => p.score !== null);
      // Exact totals remain the comparison anchor. Hidden values never size cards.
      const digits = Math.max(0, ...visible.map(p => String(p.score).length));
      root.style.setProperty('--hud-score-width', (digits > 6 ? digits * 14 + 64 : 0) + 'px');
      const ids = new Set(s.players.map(p => p.id));
      for (const [id, row] of cards) if (!ids.has(id)) { row.card.remove(); cards.delete(id); }
      // Preserve membership order from the adapter; never rank by scores or active state.
      s.players.forEach((p, i) => {
        let row = cards.get(p.id);
        if (!row) { row = makeCard(p.id); cards.set(p.id, row); }
        if (list.children[i] !== row.card) list.insertBefore(row.card, list.children[i] || null);
        const active = p.id === s.activePlayerId && p.role !== 'spectator';
        row.card.dataset.role = p.role;
        row.card.classList.toggle('is-active', active);
        row.card.classList.toggle('is-self', p.id === s.selfId);
        row.monogram.textContent = initials(p.name, p.id);
        if (row.avatar !== p.avatarUrl) {
          row.avatar = p.avatarUrl;
          row.img.hidden = true; row.monogram.hidden = false;
          row.img.removeAttribute('src');
          if (p.avatarUrl) row.img.src = p.avatarUrl;
        }
        row.name.textContent = p.name || '名前未設定'; row.name.title = p.name;
        row.role.textContent = roles[p.role] + (p.id === s.selfId ? ' · あなた' : '');
        row.turn.textContent = active ? (s.activeLabel || '出番') : '';
        const known = p.score !== null;
        row.score.textContent = known ? String(Object.is(p.score, -0) ? 0 : p.score) + ' 点' : '未公開';
        row.score.setAttribute('aria-label', known ? '得点 ' + row.score.textContent : '得点は未公開');
        row.card.classList.toggle('is-score-hidden', !known);
        const awardKey = JSON.stringify(p.awards);
        row.detail.hidden = !known || !p.awards;
        if (row.detail.hidden) row.detail.open = false;
        if (row.awardKey !== awardKey) {
          row.awardKey = awardKey;
          row.pile.replaceChildren(); row.breakdown.replaceChildren();
          if (p.awards) {
            const {icons, remaining} = window.FPScorePile.layout(p.awards);
            const positions = [[-20,0,-16],[9,1,13],[-3,10,-5],[25,6,19],[-28,16,-23],[0,25,7],[22,23,-12],[-16,33,15],[12,39,-9],[-4,47,5]];
            icons.forEach((type, index) => {
              const token = el('span', 'fp-hud-earned'); token.dataset.awardType = type;
              const [x,y,r] = icons.length === 1 ? [0,0,-7] : positions[index];
              token.style.cssText = `--pile-x:${x}px;--pile-y:${y}px;--pile-r:${r}deg;z-index:${index + 1}`;
              if (type === 'applause') {
                const img = el('img', 'fp-hud-applause'); img.src = 'assets/sound-icons/applause.svg'; img.alt = ''; token.append(img);
              } else token.append(window.FinePlayCelebration.createIcon({tier:type}));
              row.pile.append(token);
            });
            const suffix = p.awards.partial ? ' · 記録分' : '';
            row.summary.textContent = (remaining > 0 ? '+' + remaining + '個 · 内訳' : '獲得の内訳') + suffix;
            row.summary.setAttribute('aria-label', (p.name || 'この人') + 'の獲得内訳' + suffix);
            for (const [type, count] of Object.entries(p.awards.counts)) {
              const line = el('span', '', window.FPScorePile.labels[type] + ' × ' + count);
              row.breakdown.append(line);
            }
            row.breakdown.append(el('small', '', 'FinePlayは受けた評価、拍手は回数。Super / Ultraは獲得記録の件数（現ルールでは達成した対象数）。点数とは異なります。'));
            if (p.awards.partial) row.breakdown.append(el('small', '', '古いお題の獲得内訳は含まれない場合があります。'));
            if (!icons.length) row.pile.append(el('small', 'fp-hud-pile-empty', p.awards.partial ? '記録分の獲得なし' : '獲得はこれから'));
          }
        }
        if (!p.awards) row.pile.replaceChildren(el('small', 'fp-hud-pile-empty', known ? '内訳の記録なし' : ''));
      });
      count.textContent = s.players.length + '人';
      scaleText.textContent = !visible.length ? '得点は公開後に表示' : '山は獲得の種類 · 合計には正解・コンボ点も含みます';
      const active = s.players.find(p => p.id === s.activePlayerId && p.role !== 'spectator');
      const message = active ? (active.name || '名前未設定') + ' · ' + (s.activeLabel || '出番') : '出番の指定なし';
      if (status.textContent !== message) status.textContent = message;
    }
    const onKey = e => {
      if (e.target !== list || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      list.scrollLeft = e.key === 'Home' ? 0 : e.key === 'End' ? list.scrollWidth : list.scrollLeft + (e.key === 'ArrowRight' ? 180 : -180);
    };
    list.addEventListener('keydown', onKey);
    const api = {
      update(next) { if (!destroyed) { current = project(next); paint(current); } },
      destroy() { if (destroyed) return; destroyed = true; list.removeEventListener('keydown', onKey); root.remove(); cards.clear(); current = null; if (mounts.get(container) === api) mounts.delete(container); }
    };
    paint(current); mounts.set(container, api); return api;
  }
  window.FPPlayerHUD = Object.freeze({mount});
})();
