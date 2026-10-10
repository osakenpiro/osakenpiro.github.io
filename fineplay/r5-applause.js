/* R5 local candidate: compare public scores; never change rules, wallets or packets. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FPR5Applause = api;
})(globalThis, () => {
  'use strict';
  const done = v => ['solved', 'passed'].includes(v.phase);
  function enabled(search, hostname, protocol) {
    const query = new URLSearchParams(search);
    return query.get('demo') === '1' && query.get('r5applause') === 'tenth' &&
      (['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname) || protocol === 'file:');
  }
  // R4 formal scores have at most two decimals. Integer cents keep the candidate
  // exact down to 0.001 points, including retained schema1 applause (0.01/tap).
  function cents(value) {
    if (!Number.isFinite(value) || value < 0) return null;
    const n = Math.round(value * 100);
    return Number.isSafeInteger(n) && Number.isSafeInteger(n * 10) &&
      Math.abs(value - n / 100) < 1e-8 ? n : null;
  }
  function format(value) {
    return Number.isFinite(value) ? value.toFixed(3).replace(/\.?0+$/, '') || '0' : '未算出';
  }
  function archived(v, id) {
    if (!v.awardTotals || !v.awardCoverage) return {value: 0, complete: false};
    const row = Object.hasOwn(v.awardTotals, id) ? v.awardTotals[id] : null;
    const value = row ? cents(row.applauseReceived?.score) : 0;
    return {value: value ?? 0, complete: value !== null && v.awardCoverage.partial !== true};
  }
  function project(v) {
    // Return before accessing any private score or answer behind these gates.
    if (!v || v.locked || v.hidden || (!done(v) && (v.playMode !== 'cooperative' || v.mode !== 'live'))) {
      return {available: false, reason: '公開後に比較できます。'};
    }
    const selected = v.lifetimeScoreTotals || v.scoreTotals;
    if (!selected || !Array.isArray(selected.players)) return {available: false, reason: '比較できる公開得点がありません。'};
    const lifetime = !!v.lifetimeScoreTotals;
    const includeCurrent = lifetime ? selected.scope === 'lifetime-live' && !v.finalized :
      selected.scope === 'current' || (selected.scope === 'confirmed' && done(v) && !v.finalized);
    const rows = [];
    for (const p of selected.players) {
      const total = cents(p.total); if (total === null) continue;
      const saved = selected.scope === 'current' ? {value: 0, complete: true} : archived(v, p.id);
      if (v.awardCoverage?.fromRound > selected.fromRound && selected.scope !== 'current') saved.complete = false;
      let applause = saved.value;
      if (includeCurrent) {
        const current = p.id === v.presenter ? cents(v.applause?.points) : 0;
        if (current === null) saved.complete = false; else applause += current;
      }
      if (!Number.isSafeInteger(applause * 10) || applause > total) saved.complete = false;
      const member = v.players?.find(x => x.id === p.id);
      rows.push({id: p.id, name: typeof member?.name === 'string' ? member.name : 'プレイヤー',
        officialTotal: total / 100, candidateTotal: saved.complete ? (total * 10 - applause * 9) / 1000 : null,
        officialApplause: applause / 100, candidateApplause: applause / 1000, complete: saved.complete});
    }
    const perTap = v.rulesSchema === 2 ? cents(v.rules?.applausePoints) : 1;
    const tapCount = Number.isSafeInteger(v.applause?.total) && v.applause.total >= 0 ? v.applause.total : null;
    return {available: rows.length > 0, rows, lifetime, tapCount,
      officialPerTap: perTap === null ? null : perTap / 100,
      candidatePerTap: perTap === null ? null : perTap / 1000,
      legacy: v.rulesSchema !== 2, alreadyTenth: perTap === 10};
  }
  return Object.freeze({enabled, project, format});
});

if (typeof window !== 'undefined') (() => {
  'use strict';
  const api = window.FPR5Applause;
  // The production multiplayer path does not register a wrapper or mount a panel.
  if (!api.enabled(location.search, location.hostname, location.protocol)) return;
  const make = (tag, cls, text) => {
    const e = document.createElement(tag); e.className = cls;
    if (text !== undefined) e.textContent = text; return e;
  };
  const panel = make('section', 'r5-applause-candidate'); panel.id = 'r5-applause-candidate';
  panel.setAttribute('aria-label', '拍手ルール候補の比較');
  let signature = '';
  function paint() {
    if (!state || !demo || room || window.FPR3?.anticipating()) { panel.remove(); return; }
    const model = api.project(state), next = JSON.stringify(model);
    if (signature !== next) {
      signature = next; panel.replaceChildren();
      panel.append(make('small', 'r5-applause-badge', 'R5 · ローカル候補検証'),
        make('h2', '', '拍手を1/10にする案'),
        make('p', 'r5-applause-explainer', '現行の拍手得点 × 0.1 で比較中。正式な得点・持ち点は現行ルールのままです。'));
      if (!model.available) panel.append(make('p', '', model.reason));
      else {
        panel.append(make('p', 'r5-applause-rates', '1拍手：現行 ' + api.format(model.officialPerTap) + '点 → 候補 ' + api.format(model.candidatePerTap) + '点' +
          (model.tapCount === null ? '' : ' · このお題 ' + model.tapCount + '回')));
        if (model.legacy) panel.append(make('p', 'r5-applause-note', '旧ルールは100拍手で1点です。比較候補はその1/10（1拍手0.001点）です。'));
        if (model.alreadyTenth) panel.append(make('p', 'r5-applause-note', '現行が1拍手0.1点です。この比較は0.01点を示します。「1/10」が絶対0.1点を指すかは未決です。'));
        const wrap = make('div', 'r5-applause-table-wrap'), table = make('table', 'r5-applause-table');
        const caption = make('caption', '', model.lifetime ? 'この部屋の総合点を比較' : '公開得点を比較');
        const head = make('thead', ''), heading = make('tr', '');
        for (const label of ['メンバー', '現行の総合点', '候補の総合点']) { const cell = make('th', '', label); cell.scope = 'col'; heading.append(cell); }
        head.append(heading); const body = make('tbody', '');
        for (const row of model.rows) {
          const line = make('tr', ''), name = make('th', '', row.name); name.scope = 'row';
          line.append(name, make('td', '', api.format(row.officialTotal) + '点'),
            make('td', 'r5-applause-candidate-value', row.candidateTotal === null ? '記録不足 · 未算出' : api.format(row.candidateTotal) + '点'));
          body.append(line);
        }
        table.append(caption, head, body); wrap.append(table); panel.append(wrap);
        panel.append(make('p', 'r5-applause-note', '公開記録の拍手分だけを置き換えて試算。正解・FinePlay・Super・Ultra・Comboの得点は現行値です。'));
      }
      panel.append(make('small', 'r5-applause-pending', '未決：「1/10」の絶対値／現行比率の解釈、正式採用、端数の扱い。'));
    }
    const anchor = document.querySelector('.applause-panel') || document.querySelector('#r3-hud') || document.querySelector('.game-column');
    if (anchor && anchor !== panel.previousElementSibling) anchor.after(panel);
  }
  const previous = render;
  render = () => { previous(); paint(); };
  paint();
})();
