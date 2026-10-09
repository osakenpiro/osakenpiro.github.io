/* R4: derived exclusively from the existing viewer projection. No host state. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FPScorePile = api;
})(globalThis, () => {
  'use strict';
  const types = ['normal', 'applause', 'super', 'ultra'];
  const labels = {normal:'FinePlay', applause:'拍手', super:'Super FinePlay', ultra:'Ultra FinePlay'};
  const zero = () => Object.fromEntries(types.map(t => [t, 0]));
  const valid = n => Number.isSafeInteger(n) && n >= 0;
  function counts(stats) {
    const f = stats?.fineplayReceived, a = stats?.applauseReceived;
    if (!f || !a) return null;
    const out = {normal:f.normalCount, applause:a.count, super:f.superCount, ultra:f.ultraCount ?? 0};
    return types.every(t => valid(out[t])) ? out : null;
  }
  function normalize(awards) {
    if (!awards || !types.every(t => valid(awards.counts?.[t]))) return null;
    return {counts:Object.fromEntries(types.map(t => [t, awards.counts[t]])), partial:awards.partial === true};
  }
  function totals(v) {
    return !v || v.locked ? null : v.lifetimeScoreTotals || v.scoreTotals || null;
  }
  function project(v) {
    // Do not even access potentially private fields behind the locked boundary.
    if (!v || v.locked) return {};
    const selected = totals(v); if (!selected) return {};
    const lifetime = !!v.lifetimeScoreTotals;
    const out = {}, done = ['solved','passed'].includes(v.phase);
    for (const p of selected.players) {
      if (!Number.isFinite(p.total)) continue;
      const includeCurrent = lifetime ? selected.scope === 'lifetime-live' && !v.finalized : selected.scope === 'current';
      if (includeCurrent && !done) {
        // Only this public mode exposes all question/topic honors while playing.
        if (v.hidden || v.playMode !== 'cooperative' || v.mode !== 'live' ||
            v.fpRuleVersion !== 'distinct-donors/1' || !Array.isArray(v.entries)) continue;
        const c = zero(); let complete = true;
        const rows = (v.entries || []).filter(e => e.kind === 'question' && e.asker === p.id).map(e => e.honors);
        if (p.id === v.presenter) rows.push(v.problem?.honors);
        for (const h of rows) {
          if (!h || !valid(h.donorCount) || typeof h.super !== 'boolean' || typeof h.ultra !== 'boolean') { complete = false; break; }
          c.normal += h.donorCount; c.super += Number(h.super); c.ultra += Number(h.ultra);
        }
        if (p.id === v.presenter) {
          if (!valid(v.applause?.total)) complete = false;
          else c.applause = v.applause.total;
        }
        if (complete) {
          if (lifetime) {
            if (!v.awardTotals || !v.awardCoverage) continue;
            const saved = Object.hasOwn(v.awardTotals,p.id) ? counts(v.awardTotals[p.id]) : zero();
            if (!saved) continue; types.forEach(t => { c[t] += saved[t]; });
          }
          out[p.id] = {counts:c, partial:lifetime && (v.awardCoverage.partial === true || v.awardCoverage.fromRound > selected.fromRound)};
        }
      } else if ((lifetime || selected.scope === 'confirmed') && v.awardTotals && v.awardCoverage) {
        const saved = Object.hasOwn(v.awardTotals, p.id) ? counts(v.awardTotals[p.id]) : zero();
        if (!saved) continue;
        // awardTotals already contains a finalized round. Never add it twice.
        if (done && !v.finalized && (!lifetime || includeCurrent)) {
          if (v.result?.roundId !== v.roundId) continue;
          const row = v.result.players?.find(x => x.id === p.id);
          const live = row && !row.spectator ? counts(row) : zero();
          if (!live) continue;
          types.forEach(t => { saved[t] += live[t]; });
        }
        out[p.id] = {counts:saved, partial:v.awardCoverage.partial === true || v.awardCoverage.fromRound > selected.fromRound};
      } else if (selected.scope === 'current' && done && v.result?.roundId === v.roundId) {
        const row = v.result.players?.find(x => x.id === p.id), c = row && counts(row);
        if (c) out[p.id] = {counts:c,partial:false};
      }
    }
    return out;
  }
  function layout(awards) {
    const a = normalize(awards);
    if (!a) return {icons:[], remaining:0};
    const used = zero(), icons = [];
    // A bounded representative pile, not fabricated chronology. Preserve rare types.
    while (icons.length < 10) {
      const before = icons.length;
      for (const t of types) if (icons.length < 10 && used[t] < a.counts[t]) { icons.push(t); used[t]++; }
      if (icons.length === before) break;
    }
    return {icons, remaining:types.reduce((n,t) => n + a.counts[t] - used[t], 0)};
  }
  return Object.freeze({project, totals, normalize, layout, labels});
});
