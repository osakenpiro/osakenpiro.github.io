/* R3 integration: only the existing viewer projection enters these components. */
(() => {
  'use strict';
  const node = (tag, cls, text) => {
    const e = document.createElement(tag); e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  function projectHUD(v, selfId, connected) {
    const totals = window.FPScorePile.totals(v);
    const scores = new Map(totals ? totals.players.map(p => [p.id, p.total]) : []);
    const awards = window.FPScorePile.project(v);
    // The engine admits any eligible questioner. cycle.pending is the presenter
    // rotation, NOT a sequential question turn. Never invent a questioner here.
    const presenter = v.players.find(p => p.id === v.presenter);
    const answering = connected && !v.locked && v.phase === 'playing' && v.pending && !v.pending.private && presenter?.online;
    return {
      players: v.players.map(p => ({id:p.id, name:p.name,
        role:p.id === v.presenter ? 'genie' : p.role === 'spectator' ? 'spectator' : 'player',
        ...(p.id === v.presenter ? {avatarUrl:'assets/genie-face.png'} : {}),
        score:scores.get(p.id), scoreVisible:Number.isFinite(scores.get(p.id)), awards:awards[p.id]})),
      activePlayerId:answering ? v.presenter : null,
      activeLabel:answering ? (v.pending.kind === 'guess' ? '判定してください' : '回答してください') : '', selfId
    };
  }
  const key = () => state ? JSON.stringify([room,state.roundId,me,state.locked,state.presenter,state.role,state.spectator]) : '';
  const host = node('div','r3-lamp-host'); host.id = 'r3-lamp';
  const hudHost = node('section','r3-hud-host'); hudHost.id = 'r3-hud';
  const toolbar = node('div','r3-hud-toolbar');
  const caption = node('span','r3-score-caption'); toolbar.append(caption);
  const cards = node('div','r3-hud-cards'); hudHost.append(toolbar,cards);
  let hud = null, current = null, lamp = null, identity = '', revision = -1;
  const consumed = new Set();
  let lastView = null, lastKey = '', lastReady = false, rendering = false;
  const anticipating = () => !!current && !current.revealed && valid(current);
  function valid(run) {
    if (!run || !state || !ready || document.hidden || state.locked || state.hidden || key() !== run.identity || state.rev < run.rev) return false;
    const e = state.entries.find(e => e.id === run.entryId);
    return e?.kind === 'guess' && e.answer === run.event.outcome &&
      (run.event.outcome !== 'correct' || (state.phase === 'solved' && state.entries.at(-1)?.id === e.id));
  }
  function paintResult() {
    document.body.classList.toggle('r3-reveal-pending',anticipating());
    const result = document.querySelector('.result');
    if (!result) return;
    result.classList.toggle('r3-lamp-result', !!current && current.event.outcome === 'correct');
    result.classList.toggle('r3-awaiting-reveal', !!current && current.event.outcome === 'correct' && !current.revealed);
  }
  function cancel() {
    current = null; lamp?.cancel(); host.remove(); paintResult();
  }
  function sync() {
    const next = key();
    if (!state || !ready || document.hidden || next !== identity || state.rev < revision || (current && !valid(current))) cancel();
    identity = next; revision = state?.rev ?? -1;
  }
  function ensureLamp() {
    if (lamp) return;
    lamp = window.FPLampReveal.mount(host, {
      onReveal(event) {
        const run = current;
        if (run?.event !== event && run?.event.eventId !== event.eventId) return;
        if (!valid(run)) { cancel(); return; }
        run.revealed = true; paintResult();
        render();
        if (event.outcome === 'correct' && valid(run)) run.sound('correct', event.eventId);
      },
      onComplete(event) {
        const run = current;
        if (!run || run.event.eventId !== event.eventId || !valid(run)) { cancel(); return; }
        run.complete = true;
        if (event.outcome === 'incorrect') run.sound('incorrect', event.eventId);
        paintResult();
      }
    });
  }
  function verdict(outcome, eventId, sound) {
    sync();
    if (!state || !ready || document.hidden || state.locked || state.hidden) return;
    const entryId = eventId.slice('answer:'.length);
    const token = JSON.stringify([room,state.roundId,eventId]);
    if (consumed.has(token) || consumed.size >= 12000) return;
    const event = {eventId,roundId:state.roundId,outcome,
      ...(outcome === 'correct' && state.phase === 'solved' && typeof state.reveal === 'string' ? {answerText:state.reveal} : {})};
    const run = {event,entryId,identity:key(),rev:state.rev,sound,revealed:false,complete:false};
    if (!valid(run)) return;
    cancel(); consumed.add(token); current = run; ensureLamp();
    lamp.play(event).catch(error => { cancel(); console.error('R3 lamp:',error); });
  }
  function paintHUD() {
    const members = document.querySelector('.members');
    if (!members || !state) { hudHost.remove(); return; }
    const snapshot = projectHUD(state,me,ready);
    if (hud) hud.update(snapshot); else hud = window.FPPlayerHUD.mount(cards,snapshot);
    const totals = window.FPScorePile.totals(state), scope = totals?.scope, from = totals?.fromRound || 1;
    caption.textContent = !totals ? '得点は未公開' : (state.lifetimeScoreTotals ? 'この部屋の累積点' : scope === 'current' ? 'このお題の現在点' : '確定累積点') + (['confirmed','finalized'].includes(scope) ? ' · 確定分' : ' · 今のお題を含む') + (from>1?'（第'+from+'題〜）':'');
    for (const e of [...toolbar.children]) if (e !== caption) e.remove();
    // Move bound nodes instead of recreating commands or widening permissions.
    for (const control of members.querySelectorAll('button,select,input')) toolbar.append(control);
    for (const slot of cards.querySelectorAll('[data-fp-hud-actions]')) {
      const p = state.players.find(p => p.id === slot.dataset.fpHudActions);
      slot.replaceChildren(node('small','r3-member-status',[
        p.id === state.owner ? '作成者' : '',p.online ? '' : '接続待ち',
        ((state.nextPlayers || []).includes(p.id) || (p.id === me && state.joiningNext === true)) ? '次のお題に参加予定' : ''
      ].filter(Boolean).join(' · ')));
    }
    members.replaceWith(hudHost);
    // Full-width band, after the current question on narrow screens.
    const column = document.querySelector('.game-column');
    const anchor = column?.querySelector('.fp-scene,.scene,.result');
    if (anchor) anchor.after(hudHost); else column?.append(hudHost);
    document.querySelector('#display-scores')?.remove(); document.body.classList.remove('display-has-scores');
  }
  function paintLamp() {
    if (!current) return;
    // Identical placement for both unrevealed outcomes; keep the previous public UI.
    const target = !current.revealed ? document.querySelector('.game-column') : current.event.outcome === 'correct' ? document.querySelector('.result') : document.querySelector('.fp-scene,.scene');
    if (target) target.prepend(host);
    // A subsequent question should not retain a stale incorrect verdict card.
    if (current.complete && current.event.outcome === 'incorrect' && state.pending) cancel();
    const oldSkip = document.querySelector('#presentation-skip');
    if (oldSkip && current?.event.outcome === 'correct') {
      oldSkip.onclick = () => host.querySelector('.fp-lamp-skip')?.click();
      oldSkip.hidden = true; // The lamp supplies one accessible skip control.
    }
    paintResult();
  }
  function paintApplauseIcon() {
    // One applause asset across the earned pile, sound settings and tap control.
    // Preserve the existing controls, listeners, accessible labels and praise text.
    for (const target of document.querySelectorAll('#applause-tap,.applause-panel h2')) {
      target.querySelectorAll('.hand,.praise-symbol,.r4-applause-icon').forEach(icon => icon.remove());
      const icon = node('img', 'hand r4-applause-icon');
      icon.src = 'assets/sound-icons/applause.svg'; icon.alt = '';
      icon.setAttribute('aria-hidden', 'true'); target.prepend(icon);
    }
  }
  const previousRender = render;
  render = () => {
    const focused = document.activeElement;
    const restoreFocus = hudHost.contains(focused) || host.contains(focused);
    const x = scrollX, y = scrollY, list = cards.querySelector('.fp-hud-list'), left = list?.scrollLeft || 0;
    sync();
    if (state && ready && lastReady && !document.hidden && !state.locked && !state.hidden && lastView && lastKey === key() && lastView.phase === 'playing' && state.rev > lastView.rev) {
      const e = state.entries.find(e => e.kind === 'guess' && (e.answer === 'correct' && state.phase === 'solved' && state.entries.at(-1)?.id === e.id || e.answer === 'incorrect' && lastView.pending?.id === e.id) && !lastView.entries.some(p => p.id === e.id));
      if (e) verdict(e.answer,'answer:'+e.id,(kind,eventId) => window.FPSound?.enqueue({kind,eventId,roundId:state.roundId}));
    }
    if (anticipating()) { paintLamp(); return; }
    host.remove(); hudHost.remove(); rendering = true;
    try { previousRender(); } finally { rendering = false; }
    paintHUD(); paintLamp(); paintApplauseIcon(); lastView = state; lastKey = key(); lastReady = ready;
    if (list) list.scrollLeft = left;
    const focusTarget = focused?.isConnected ? focused : focused?.id ? document.getElementById(focused.id) : null;
    if (restoreFocus && focusTarget && !focusTarget.hidden) focusTarget.focus({preventScroll:true});
    scrollTo(x,y);
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancel(); lastView = null; } else render(); });
  window.addEventListener('pagehide', cancel);
  // Block stale gameplay controls while the DOM intentionally shows the previous view.
  document.addEventListener('click', e => {
    if (anticipating() && !host.contains(e.target) && e.target.closest('button,a,summary')) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('submit', e => { if (anticipating()) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  window.FPR3 = Object.freeze({verdict,cancel:() => { if (!rendering || !current || !valid(current)) cancel(); },projectHUD,anticipating,
    presentationView:v => anticipating() && v === state ? lastView : v});
  render();
})();
