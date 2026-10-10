/* Local R6 candidate: arbitrary-time public result preview and manual copy. */
(() => {
  'use strict';
  const previousRender = render;
  let trigger = null;
  const current = () => {
    if (!ready || window.FPR3?.anticipating()) return null;
    const v = window.FPR3 ? window.FPR3.presentationView(state) : state;
    return window.FPResultReport.project(v, {totals:window.FPScorePile.totals,at:new Date().toLocaleString('ja-JP')});
  };
  const points = n => n === null ? '未公開' : Number(n).toLocaleString('ja-JP',{maximumFractionDigits:2}) + '点';
  const table = (players, ranked = false) => players.length ? `<div class="r6-result-table-wrap"><table class="r6-result-table"><thead><tr>${ranked ? '<th scope="col">順位</th>' : ''}<th scope="col">メンバー</th><th scope="col">得点</th></tr></thead><tbody>${players.map(p => `<tr>${ranked ? `<td>${p.rank ?? '—'}位</td>` : ''}<th scope="row">${esc(p.name)}</th><td>${esc(points(p.score))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">公開できる得点はまだありません。</p>';
  const content = r => `${r.room ? `<section><h3>${esc(r.room.label)}</h3><p class="small">${esc(r.room.note)}</p>${table(r.room.players)}</section>` : ''}<section><h3>お題 ${r.round.number ?? ''} · ${esc(r.round.status)}</h3><p>${esc(r.round.scope)}</p><p class="small">${r.round.questions !== null && r.round.guesses !== null ? `質問 ${r.round.questions}・解答 ${r.round.guesses}` : `質問・解答の合計 ${r.round.progress ?? '—'}`}</p>${r.round.answer ? `<details class="r6-result-answer"><summary>公開された答えを見る</summary><p>${esc(r.round.answer)}</p></details>` : ''}<p class="small">${esc(r.round.note)}</p>${table(r.round.players)}</section><section><h3>${r.cycle ? esc(r.cycle.label) : '一巡の結果'}</h3>${r.cycle ? `<p class="small">全${r.cycle.rounds}題 · 確定</p>${table(r.cycle.players,true)}${r.cycle.awards.map(a => `<p><strong>${esc(a.label)}</strong> ${esc(a.names.join('・'))}</p>`).join('')}` : `<p class="small">${esc(r.cycleNote)}</p>`}</section>`;

  function refresh() {
    const dialog = document.getElementById('modal');
    const root = dialog?.querySelector('#r6-result-report');
    if (!root) return;
    const r = current();
    const body = root.querySelector('[data-result-body]');
    const preview = root.querySelector('#r6-result-text');
    const button = root.querySelector('#r6-result-copy');
    // Clear stale answer/score immediately on undo, viewer/phase changes or reveal.
    if (!r) {
      body.textContent = !ready ? '接続を確認してください。リザルトは最新の状態を受信してから表示します。' : '現在、公開できるリザルトはありません。';
      preview.value = ''; button.disabled = true;
      root.querySelector('[data-result-time]').textContent = '';
      return;
    }
    const opened = body.querySelector('.r6-result-answer')?.open;
    body.innerHTML = content(r);
    if (opened && body.querySelector('.r6-result-answer')) body.querySelector('.r6-result-answer').open = true;
    preview.value = window.FPResultReport.format(r);
    root.querySelector('[data-result-time]').textContent = '集計時点：' + r.at;
    button.disabled = false;
  }
  function open() {
    if (!current()) return;
    modal('<section id="r6-result-report"><div class="r6-result-heading"><div><h2>リザルト</h2><p class="small" data-result-time></p></div><button id="modal-close" type="button" class="quiet">閉じる</button></div><p class="small">今の部屋の記録。表示・コピーだけで、プレイは続けられます。</p><div data-result-body></div><details class="r6-result-copy-preview"><summary>共有するテキストを確認</summary><textarea id="r6-result-text" readonly rows="9" aria-label="共有するリザルト"></textarea></details><div class="r6-result-footer"><button id="r6-result-copy" type="button" class="primary">リザルトをコピー</button><span id="r6-result-copy-status" role="status"></span></div></section>');
    refresh();
    document.getElementById('r6-result-copy').onclick = async () => {
      refresh();
      const r = current();
      if (!r) return;
      const value = window.FPResultReport.format(r);
      document.getElementById('r6-result-text').value = value;
      try {
        await navigator.clipboard.writeText(value);
        if (document.getElementById('r6-result-copy-status')) document.getElementById('r6-result-copy-status').textContent = 'コピーしました';
      } catch {
        const preview = document.getElementById('r6-result-text');
        if (!preview) return;
        preview.closest('details').open = true; preview.focus(); preview.select();
        document.getElementById('r6-result-copy-status').textContent = 'テキストを選択しました。コピーして共有できます。';
      }
    };
  }
  function paint() {
    const head = document.querySelector('#r3-hud .fp-hud-heading');
    if (head) {
      if (!trigger) {
        trigger = document.createElement('button'); trigger.id = 'r6-open-results';
        trigger.type = 'button'; trigger.className = 'quiet r6-result-trigger';
        trigger.textContent = 'リザルト'; trigger.onclick = open;
      }
      if (trigger.parentElement !== head) head.append(trigger);
      trigger.disabled = !current();
      trigger.title = trigger.disabled ? '現在公開できる記録はありません' : '今の結果を表示・コピー';
    } else trigger?.remove();
    refresh();
  }
  render = (...args) => { const value = previousRender(...args); paint(); return value; };
  paint();
})();
