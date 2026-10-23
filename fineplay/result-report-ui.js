/* Local R6 candidate: arbitrary-time public result preview and manual copy. */
(() => {
  'use strict';
  const previousRender = render;
  let trigger = null;
  const audienceStates = new WeakMap();
  const audienceText = r => window.FPAudienceResult?.format(r) || '';
  const audienceSection = () => window.FPAudienceResult ? '<section class="r6-result-audience"><h3>この遊びを紹介する</h3><p class="small">名前や答えを入れずに、今回のお題の数字を共有できます。</p><details class="r6-result-copy-preview"><summary>紹介用のテキストを確認</summary><textarea id="r6-audience-text" readonly rows="6" aria-label="名前と答えを含まない紹介用の結果" placeholder="お題が終わると、紹介用の結果を作れます。"></textarea></details><div class="r6-audience-actions"><button id="r6-audience-copy" type="button" class="quiet">紹介用の結果をコピー</button><span id="r6-audience-status" class="small" role="status"></span></div></section>' : '';
  function refreshAudience(root, report) {
    const preview = root.querySelector('#r6-audience-text');
    const button = root.querySelector('#r6-audience-copy');
    if (!preview || !button) return null;
    let record = audienceStates.get(root);
    if (!record) { record = {value:'',revision:0,pending:null}; audienceStates.set(root, record); }
    const value = audienceText(report);
    if (value !== record.value) {
      record.value = value; record.revision++;
      root.querySelector('#r6-audience-status').textContent = '';
    }
    preview.value = value;
    button.disabled = !value || !!record.pending;
    return record;
  }
  async function copyAudience(root) {
    if (!root || document.getElementById('r6-result-report') !== root || document.getElementById('modal')?.open === false) return;
    const record = refreshAudience(root, current());
    if (!record?.value || record.pending) return;
    const operation = {value:record.value,revision:record.revision};
    record.pending = operation;
    root.querySelector('#r6-audience-status').textContent = '';
    refreshAudience(root, current());
    const stillCurrent = () => {
      if (document.getElementById('r6-result-report') !== root || document.getElementById('modal')?.open === false) return false;
      refreshAudience(root, current());
      return record.pending === operation && record.revision === operation.revision;
    };
    try {
      await navigator.clipboard.writeText(operation.value);
      if (stillCurrent()) root.querySelector('#r6-audience-status').textContent = '紹介用の結果をコピーしました';
    } catch {
      if (stillCurrent()) {
        const preview = root.querySelector('#r6-audience-text');
        preview.closest('details').open = true; preview.focus(); preview.select();
        root.querySelector('#r6-audience-status').textContent = 'テキストを選択しました。コピーして共有できます。';
      }
    } finally {
      if (record.pending === operation) record.pending = null;
      if (document.getElementById('r6-result-report') === root) refreshAudience(root, current());
    }
  }
  const current = () => {
    if (!ready || window.FPR3?.anticipating()) return null;
    const v = window.FPR3 ? window.FPR3.presentationView(state) : state;
    return window.FPResultReport.project(v, {totals:window.FPScorePile.totals,at:new Date().toLocaleString('ja-JP')});
  };
  const points = n => n === null ? '未公開' : Number(n).toLocaleString('ja-JP',{maximumFractionDigits:2}) + '点';
  const table = (players, ranked = false) => players.length ? `<div class="r6-result-table-wrap"><table class="r6-result-table"><thead><tr>${ranked ? '<th scope="col">順位</th>' : ''}<th scope="col">メンバー</th><th scope="col">得点</th></tr></thead><tbody>${players.map(p => `<tr>${ranked ? `<td>${p.rank ?? '—'}位</td>` : ''}<th scope="row">${esc(p.name)}</th><td>${esc(points(p.score))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">公開できる得点はまだありません。</p>';
  const progress = r => r.round.questions !== null && r.round.guesses !== null ? `質問 ${r.round.questions}・解答 ${r.round.guesses}` : `質問・解答の合計 ${r.round.progress ?? '—'}`;
  const content = r => `${r.room ? `<section><h3>${esc(r.room.label)}</h3><p class="small">${esc(r.room.note)}</p>${table(r.room.players)}</section>` : ''}
    <details class="r6-result-section" data-result-section="round" ${r.room ? '' : 'open'}>
      <summary><strong>お題 ${r.round.number ?? ''} · ${esc(r.round.status)}</strong><span>${esc(progress(r))} · 内訳</span></summary>
      <div class="r6-result-section-body"><p>${esc(r.round.scope)}</p>
        ${r.round.answer ? `<details class="r6-result-answer"><summary>公開された答えを見る</summary><p>${esc(r.round.answer)}</p></details>` : ''}
        <p class="small">${esc(r.round.note)}</p>${table(r.round.players)}</div>
    </details>
    <section><h3>${r.cycle ? esc(r.cycle.label) : '一巡の結果'}</h3>${r.cycle ? `<p class="small">全${r.cycle.rounds}題 · 確定</p>${table(r.cycle.players,true)}${r.cycle.awards.map(a => `<p><strong>${esc(a.label)}</strong> ${esc(a.names.join('・'))}</p>`).join('')}` : `<p class="small">${esc(r.cycleNote)}</p>`}</section>`;

  function refresh() {
    const dialog = document.getElementById('modal');
    const root = dialog?.querySelector('#r6-result-report');
    if (!root) return;
    const r = current();
    const body = root.querySelector('[data-result-body]');
    const preview = root.querySelector('#r6-result-text');
    const button = root.querySelector('#r6-result-copy');
    refreshAudience(root, r);
    // Clear stale answer/score immediately on undo, viewer/phase changes or reveal.
    if (!r) {
      body.textContent = !ready ? '接続を確認してください。リザルトは最新の状態を受信してから表示します。' : '現在、公開できるリザルトはありません。';
      preview.value = ''; button.disabled = true;
      root.querySelector('[data-result-time]').textContent = '';
      return;
    }
    const opened = body.querySelector('.r6-result-answer')?.open;
    const sections = new Map([...body.querySelectorAll('[data-result-section]')].map(d => [d.dataset.resultSection, d.open]));
    const focused = document.activeElement?.closest('[data-result-section]')?.dataset.resultSection;
    body.innerHTML = content(r);
    for (const d of body.querySelectorAll('[data-result-section]')) if (sections.has(d.dataset.resultSection)) d.open = sections.get(d.dataset.resultSection);
    if (opened && body.querySelector('.r6-result-answer')) body.querySelector('.r6-result-answer').open = true;
    if (focused) body.querySelector('[data-result-section="' + focused + '"] > summary')?.focus({preventScroll:true});
    preview.value = window.FPResultReport.format(r);
    root.querySelector('[data-result-time]').textContent = '集計時点：' + r.at;
    button.disabled = false;
  }
  function open() {
    if (!current()) return;
    modal('<section id="r6-result-report"><div class="r6-result-heading"><div><h2>リザルト</h2><p class="small" data-result-time></p></div><button id="modal-close" type="button" class="quiet">閉じる</button></div><p class="small">今の部屋の記録。表示・コピーだけで、プレイは続けられます。</p><div data-result-body></div>' + audienceSection() + '<details class="r6-result-copy-preview"><summary>部屋内の記録を確認（名前・公開済みの答えを含む）</summary><textarea id="r6-result-text" readonly rows="9" aria-label="部屋内のリザルト"></textarea></details><div class="r6-result-footer"><button id="r6-result-copy" type="button" class="primary">部屋の記録をコピー</button><span id="r6-result-copy-status" role="status"></span></div></section>');
    refresh();
    const audienceButton = document.getElementById('r6-audience-copy');
    const audienceRoot = document.getElementById('r6-result-report');
    if (audienceButton) audienceButton.onclick = () => copyAudience(audienceRoot);
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
