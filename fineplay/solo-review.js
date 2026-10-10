/* Local synthetic partners, using only existing engine commands. No transport. */
(() => {
  'use strict';
  if (!demo || new URLSearchParams(location.search).get('role') === 'genie') return;
  const firstAsker = () => game.players.find(p => p.id !== game.presenter && p.role === 'player').id;
  const donors = () => game.fpRoster.filter(id => id !== game.presenter);
  let notice = 'まず FinePlay → もう1人から評価。そのあと答え合わせ → 拍手を試せます。';
  const priorRender = render;
  function action(fn, message) {
    try { fn(); notice = message; } catch (e) { notice = e.message; }
    broadcast();
  }
  function finish() {
    if (game.pending) demoApply(game.presenter, 'cancel', {pendingId:game.pending.id});
    demoApply(firstAsker(), 'ask', {kind:'guess',text:'傘'});
    demoApply(game.presenter, 'answer', {pendingId:game.pending.id,answer:'correct'});
    me = firstAsker();
  }
  render = () => {
    priorRender();
    if (window.FPR3?.anticipating()) return;
    if (!demo || !state || !ready || state.phase==='lobby' || state.phase==='preparing') return;
    const host = document.createElement('section');
    host.id = 'solo-review'; host.className = 'panel';
    host.style.cssText = 'border:2px solid #244638;margin:14px 0;padding:16px;min-width:0';
    const done = R.done(state), rated = game.problemRatings || {}, ds = donors();
    host.innerHTML = `<span class="eyebrow">R5 · ひとり体験</span><h2>ひとりで、獲得を試す</h2>
      <p>架空の相手を操作します。お題への評価・拍手は <b>${esc(person(state.presenter))}</b> の山に届きます。Superは2人からの評価で自動獲得。3人の卓では全員評価のUltraも付きます。</p>
      <div class="row" style="flex-wrap:wrap">
      ${button('solo-fine','① FinePlayを送る','primary',!!rated[ds[0]])}
      ${button('solo-super','② もう1人から評価 → Super','',!rated[ds[0]]||!!rated[ds[1]])}
      ${button('solo-finish','③ 答え合わせへ','',done)}
      ${button('solo-clap','④ 拍手を1回','',!done)}
      ${button('solo-answer','架空の相手が回答する','quiet',!state.pending)}
      ${button('solo-reset','最初から','quiet')}
      </div><p id="solo-notice" role="status" class="small">${esc(notice)}</p>
      <details><summary>重なり・次のお題も試す</summary><div class="row" style="flex-wrap:wrap;margin-top:12px">
      ${button('solo-many','拍手を12回送る','quiet',!done)}
      ${button('solo-undo','直前の回答を戻す','quiet',!!state.pending||!state.entries.length)}
      ${button('solo-next','次のお題へ（出題交代）','quiet',!done)}
      ${button('solo-project','現在の状態を再表示','quiet')}
      </div><p class="small">回答・質問は通常の画面でも操作できます。「最初から」は体験をリセットします。</p></details>`;
    document.querySelector('#r3-hud')?.after(host);
    const bindAction = (id, fn, message) => { document.getElementById(id).onclick = async () => {
      if (id === 'solo-next' && !await FPShared.settleApplause()) { toast('拍手の受付を確認してから進んでください。'); return; }
      action(fn, message);
    }; };
    bindAction('solo-fine', () => demoApply(ds[0], 'voteProblem', {stars:1}), '1人目のFinePlayを受け取りました。');
    bindAction('solo-super', () => demoApply(ds[1], 'voteProblem', {stars:1}), '2人の実際の評価からSuperを獲得しました。内訳で種類を確認できます。');
    bindAction('solo-finish', finish, '答え合わせ。拍手は出題者の山と点数に加わります。');
    bindAction('solo-answer', () => {
      const p = game.pending;
      const answer = p.kind === 'question' ? 'yes' : ['傘','かさ','カサ','umbrella'].includes(p.text.normalize('NFKC').toLowerCase()) ? 'correct' : 'incorrect';
      demoApply(game.presenter, 'answer', {pendingId:p.id,answer});
    }, '練習相手が回答しました。自由に質問・解答を続けられます。');
    bindAction('solo-reset', () => seedDemo(), '体験を最初から始めました。');
    const applaud = count => {
      const actor = firstAsker(), view = R.view(game, actor);
      demoApply(actor, 'applaud', {applauseId:view.applauseId,count:Math.min(100,view.applause.mine+count)});
      me = actor;
    };
    bindAction('solo-clap', () => applaud(1), '拍手を1回送りました。出題者の山を見てみよう。');
    bindAction('solo-many', () => applaud(12), '拍手を12回送りました。山は10個まで表示し、残りは内訳に残ります。');
    bindAction('solo-undo', () => demoApply(game.presenter, 'undo'), '直前の回答を戻しました。拍手の取り消しも通常ルールに従います。');
    bindAction('solo-next', () => {
      const next = game.cycle.roster.find(id => id !== game.presenter && !game.cycle.completed.includes(id)) || firstAsker();
      demoApply(game.owner, 'start', {presenter:next,mode:'live',playMode:'cooperative',scope:'身近なものをあてよう'});
      demoApply(next, 'begin', {text:'傘'}); me = firstAsker();
    }, '次のお題です。出題者が交代し、この部屋の累積点と獲得の山は引き継がれます。');
    if (document.querySelector('#next')) document.querySelector('#next').onclick = document.querySelector('#solo-next').onclick;
    bindAction('solo-project', () => {}, '同じエンジン状態から表示を作り直しました（オンライン再接続ではありません）。');
  };
  const originalSeed = seedDemo;
  seedDemo = () => { originalSeed(); me = firstAsker(); notice = '①〜④で、出題者の山が増える様子を試せます。'; broadcast(); };
  me = firstAsker(); broadcast();
})();
