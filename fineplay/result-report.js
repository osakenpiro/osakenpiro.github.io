/* Read-only result snapshots. Inputs must be the existing viewer projection. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FPResultReport = api;
})(globalThis, () => {
  'use strict';
  const number = n => Number.isFinite(n) ? n : null;
  const count = n => Number.isSafeInteger(n) && n >= 0 ? n : null;
  const text = s => typeof s === 'string' ? s : '';
  const done = v => ['solved', 'passed'].includes(v.phase);
  const fmt = n => n === null ? '未公開' : String(Math.round(n * 100) / 100);
  const discord = s => String(s).replace(/[@<>|`*_\r\n]/g, c =>
    ({'@':'＠','<':'＜','>':'＞','|':'｜','`':'｀','*':'＊','_':'＿','\r':' ','\n':' '}[c]));
  const awards = {fineplayReceived:'FinePlay賞',applauseReceived:'拍手賞',questions:'質問賞',correct:'正解賞',combos:'Combo賞'};
  const statuses = {preparing:'お題準備中',playing:'進行中',solved:'正解・拍手受付中',passed:'答え合わせ・拍手受付中'};

  function project(v, {at = new Date().toISOString(), anticipating = false, totals} = {}) {
    // Never inspect score/private fields behind the locked or reveal boundary.
    if (!v || anticipating || v.locked || !v.round || v.phase === 'lobby') return null;
    const people = Array.isArray(v.players) ? v.players : [];
    const name = id => text(people.find(p => p.id === id)?.name) || '参加者';
    const rows = selected => (selected?.players || []).filter(p =>
      people.some(w => w.id === p.id)).map(p =>
      ({name:name(p.id),score:number(p.total)}));
    const selected = totals?.(v);
    const includesCurrent = selected?.scope === 'lifetime-live' && !v.finalized;
    const room = selected ? {label:selected.scope === 'current' ? 'このお題の得点' : 'この部屋の総合点',
      note:includesCurrent ? '進行中のお題を含む・未確定' : selected.scope === 'current' ? '現在のお題・未確定' : '確定した得点',
      players:rows(selected)} : null;
    if (room && count(selected.fromRound) > 1) room.note += '・お題' + selected.fromRound + '以降の記録';
    const round = {number:count(v.round),scope:text(v.scope),status:v.finalized ? '確定' : statuses[v.phase] || '進行中',
      progress:count(v.progress),questions:null,guesses:null,answer:'',players:[],note:'このお題の得点はまだ公開されていません。'};
    if (done(v) && v.result?.roundId === v.roundId) {
      const r = v.result;
      round.questions = count(r.counts?.questions);
      round.guesses = count(r.counts?.guesses);
      round.answer = text(v.reveal);
      round.players = (r.players || []).filter(p => !p.spectator).map(p => ({name:text(p.name) || name(p.id),
        score:number(p.score),questions:count(p.questions),guesses:count(p.guesses),fineplays:count(p.fineplays)}));
      round.note = r.finalized || v.finalized ? 'このお題の確定記録' : '拍手受付中のため得点は変わります。';
    } else if (!v.hidden && v.playMode === 'cooperative' && v.mode === 'live' && v.scoreTotals?.scope === 'current') {
      round.players = rows(v.scoreTotals);
      // Only this mode exposes the complete current question/guess history.
      if (Array.isArray(v.entries)) {
        round.questions = v.entries.filter(e => e.kind === 'question').length;
        round.guesses = v.entries.filter(e => e.kind === 'guess').length;
      }
      round.note = '進行中のお題・未確定';
    }
    let cycle = null;
    if (v.cycleResult?.finalized === true) {
      const r = v.cycleResult;
      const podium = Array.isArray(r.podium) ? r.podium : [];
      const cycleName = id => text(podium.find(p => p.playerId === id)?.name) || name(id);
      cycle = {label:r.id === v.cycle?.id ? 'この一巡の確定結果' : '前の一巡の確定結果',
        rounds:Array.isArray(r.roundIds) ? r.roundIds.length : null,
        players:podium.map(p => ({name:cycleName(p.playerId),score:number(p.score),rank:count(p.rank)})),
        awards:(r.awards || []).filter(a => awards[a.code]).map(a => ({label:awards[a.code],
          names:(a.playerIds || []).map(cycleName),value:number(a.value),unit:a.metric === 'stars' ? '★' : a.code === 'applauseReceived' ? '回' : '件'}))};
    }
    // Whitelist every output. No round/player/room IDs, secrets, wallet or notes.
    return {at:text(at),room,round,cycle,cycleNote:cycle ? '' : '一巡の結果は、全員の出題と得点確定後に表示されます。'};
  }

  function format(r) {
    if (!r) return '';
    const lines = ['FINEPLAY · リザルト', '集計時点：' + discord(r.at), ''];
    if (r.room) {
      lines.push(r.room.label + '（' + r.room.note + '）');
      for (const p of r.room.players) lines.push(discord(p.name) + '：' + fmt(p.score) + '点');
      lines.push('');
    }
    lines.push('お題 ' + (r.round.number ?? '') + ' · ' + r.round.status, '範囲：' + discord(r.round.scope));
    if (r.round.questions !== null && r.round.guesses !== null) lines.push('質問 ' + r.round.questions + '・解答 ' + r.round.guesses);
    else if (r.round.progress !== null) lines.push('質問・解答の合計 ' + r.round.progress);
    if (r.round.answer) lines.push('答え：||' + discord(r.round.answer) + '||');
    lines.push(r.round.note);
    for (const p of r.round.players) lines.push(discord(p.name) + '：' + fmt(p.score) + '点');
    lines.push('');
    if (r.cycle) {
      lines.push(r.cycle.label + ' · ' + r.cycle.rounds + '題');
      for (const p of r.cycle.players) lines.push((p.rank === null ? '' : p.rank + '位 ') + discord(p.name) + '：' + fmt(p.score) + '点');
      for (const a of r.cycle.awards) lines.push(a.label + '：' + a.names.map(discord).join('・') + '（' + fmt(a.value) + a.unit + '）');
    } else lines.push(r.cycleNote);
    lines.push('', '部屋内の記録です。表示・コピーではゲームを終了・確定しません。');
    return lines.join('\n');
  }
  return Object.freeze({project,format});
});
