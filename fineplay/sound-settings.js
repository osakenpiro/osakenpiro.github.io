/* Rendering adapter. FPSound exclusively owns preferences, persistence and audio. */
(() => {
  'use strict';
  const kinds = [['question','新しい質問'],['correct','正解'],['incorrect','不正解'],['fineplay','FinePlay'],['applause','拍手'],['comment','新しいコメント']];
  const api = window.FPSound;
  const connected = api && ['getSnapshot','subscribe','setMaster','setVolume','setEvent','resume','preview'].every(k => typeof api[k] === 'function');
  const bar = document.createElement('section');
  bar.className = 'fp-sound-bar'; bar.setAttribute('aria-label','音の操作');
  bar.innerHTML = '<button type="button" id="fp-sound-master" role="switch" aria-checked="false" aria-label="全体の音">音 <span>利用不可</span></button><button type="button" id="fp-sound-open" aria-haspopup="dialog" aria-controls="fp-sound-dialog">音設定</button><span class="fp-sound-summary" role="status"></span><button type="button" class="fp-sound-resume" hidden>音を再開</button>';
  const dialog = document.createElement('dialog');
  dialog.id = 'fp-sound-dialog'; dialog.setAttribute('aria-labelledby','fp-sound-title');
  dialog.innerHTML = '<header><h2 id="fp-sound-title">音設定</h2><button type="button" id="fp-sound-close" aria-label="音設定を閉じる" autofocus>閉じる</button></header><p class="fp-sound-state" role="status"></p><button type="button" class="fp-sound-resume" hidden>音を再開</button><label class="fp-sound-volume" for="fp-sound-volume">全体音量 <output id="fp-sound-volume-value"></output></label><input id="fp-sound-volume" type="range" min="0" max="100" step="1"><h3>鳴らす場面</h3><p id="fp-sound-reason"></p><div class="fp-sound-events"></div><p class="fp-sound-help">変更はすぐに反映されます。個別OFFは自動音だけを止めます。試聴で設定は変わりません。</p>';
  document.body.append(dialog);
  const master = bar.querySelector('#fp-sound-master'), open = bar.querySelector('#fp-sound-open');
  const range = dialog.querySelector('input');
  kinds.forEach(([kind,label]) => {
    const row = document.createElement('div'); row.className = 'fp-sound-event';
    row.innerHTML = `<button type="button" class="fp-sound-switch" role="switch" aria-checked="false" aria-label="${label}の音" data-kind="${kind}"><img src="assets/sound-icons/${kind}.svg" width="48" height="48" alt="" aria-hidden="true"><span>${label}</span><span class="fp-sound-pill" aria-hidden="true">—</span></button><button type="button" class="fp-sound-preview" aria-label="${label}の音を試聴" aria-describedby="fp-sound-reason" data-preview="${kind}">試聴</button>`;
    row.querySelector('.fp-sound-switch').addEventListener('click', () => invoke('setEvent',kind,!api.getSnapshot().preferences.events[kind]));
    row.querySelector('.fp-sound-preview').addEventListener('click', () => invoke('preview',kind));
    dialog.querySelector('.fp-sound-events').append(row);
  });
  function mount() {
    const target = document.querySelector('.workspace');
    if (target && bar.parentElement !== target) target.prepend(bar);
  }
  function paint() {
    let snapshot;
    try {snapshot = connected ? api.getSnapshot() : null;} catch {snapshot = null;}
    const p = snapshot?.preferences, unavailable = !p || snapshot.status === 'unavailable';
    const status = unavailable ? '利用不可' : !p.master ? 'OFF' : snapshot.status === 'suspended' ? '待機' : p.volume === 0 ? '音量0' : !kinds.some(([k])=>p.events[k]) ? '自動音OFF' : snapshot.status === 'ready' ? 'ON' : '待機';
    master.disabled = unavailable; master.setAttribute('aria-checked', String(!!p?.master)); master.querySelector('span').textContent = status;
    const reason = unavailable ? '音は利用できません。サウンド機能が未接続、または利用できない状態です。' : !p.master ? '全体の音がOFFのため、試聴できません。' : p.volume === 0 ? '音量0のため、試聴できません。' : snapshot.status !== 'ready' ? '音は再開待ちです。「音を再開」を押してください。' : !kinds.some(([k])=>p.events[k]) ? '全場面の自動音がOFFです。試聴はできます。' : '個別OFFの音も試聴できます。';
    dialog.querySelector('#fp-sound-reason').textContent = reason;
    dialog.querySelector('.fp-sound-state').textContent = snapshot?.error ? '音の状態: '+snapshot.error : '音 '+status;
    bar.querySelector('.fp-sound-summary').textContent = snapshot?.error ? '音のエラー（音設定で確認）' : ['音量0','自動音OFF','利用不可','待機'].includes(status) ? reason : '';
    range.disabled = unavailable; range.value = p ? String(Math.round(p.volume*100)) : '0';
    dialog.querySelector('output').textContent = p ? Math.round(p.volume*100)+'%' : '—';
    document.querySelectorAll('.fp-sound-resume').forEach(b=>b.hidden=unavailable || !p.master || snapshot.status !== 'suspended');
    kinds.forEach(([k])=>{
      const b=dialog.querySelector(`[data-kind="${k}"]`); b.disabled=unavailable;
      b.setAttribute('aria-checked',String(!!p?.events[k])); b.querySelector('.fp-sound-pill').textContent=p ? p.events[k] ? 'ON':'OFF' : '—';
      dialog.querySelector(`[data-preview="${k}"]`).disabled=unavailable || !p.master || p.volume<=0 || snapshot.status!=='ready';
    });
  }
  async function invoke(method,...args) {
    if (!connected) return;
    try {await api[method](...args); paint();}
    catch {paint(); dialog.querySelector('.fp-sound-state').textContent='音の操作に失敗しました。音の状態を確認してください。';bar.querySelector('.fp-sound-summary').textContent='音の操作に失敗しました';}
  }
  master.addEventListener('click',()=>invoke('setMaster',!api.getSnapshot().preferences.master));
  range.addEventListener('input',()=>invoke('setVolume',Number(range.value)/100));
  document.querySelectorAll('.fp-sound-resume').forEach(b=>b.addEventListener('click',()=>invoke('resume')));
  // bar is not mounted yet, so bind its explicit resume separately.
  bar.querySelector('.fp-sound-resume').addEventListener('click',()=>invoke('resume'));
  open.addEventListener('click',()=>{paint();dialog.showModal();});
  dialog.querySelector('#fp-sound-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>open.focus({preventScroll:true}));
  dialog.addEventListener('keydown',event=>{
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(e=>e.getClientRects().length);
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  });
  if (connected) api.subscribe(paint);
  mount(); paint();
  new MutationObserver(mount).observe(document.getElementById('app'),{childList:true,subtree:true});
})();
