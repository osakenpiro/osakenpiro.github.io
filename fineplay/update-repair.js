/* R4 local repair: public view/read controls only; no rules or transport changes. */
(() => {
  'use strict';
  const previousRender = render;
  let historyKey = '', following = true, lastTail = '', lastOrder = '', wasFiltered = false, suppressScroll = false;
  let buttonKey = '', stableApplause = null;
  const view = () => window.FPR3?.presentationView(state) || state;
  function plainHistory() {
    const p = FPAssist.publicSnapshot(view());
    return p.topics.map(t => [`第${t.round ?? '—'}題 · ${t.scope}`,t.reveal ? '答え：'+t.reveal : '答えは未公開',
      ...t.entries.map(q => `Q${q.number ?? '—'} ${q.by}：${q.text}\n→ ${q.answerLabel || q.answer}`),
      ...t.comments.map(c => `Q${c.question ?? '—'} コメント ${c.by}：${c.quotedEvidence}`)].join('\n')).join('\n\n');
  }
  function copyDialog() {
    modal(`<h2>質問・回答の履歴</h2><p class="small">今、公開できる内容だけ。JSON・AI用・Discord結果は別の操作です。</p><textarea id="repair-copy-text" rows="12" readonly aria-label="質問と回答のコピー">${esc(plainHistory())}</textarea><div class="row"><button id="repair-copy-confirm" class="primary">コピー</button><button id="modal-close">閉じる</button></div>`);
    document.querySelector('#repair-copy-confirm').onclick = async () => {
      const text = plainHistory(), box = document.querySelector('#repair-copy-text'); box.value = text;
      try { await navigator.clipboard.writeText(text); toast('コピーしました'); }
      catch { box.focus(); box.select(); toast('選択したテキストをコピーしてください'); }
    };
  }
  function historyUI(saved) {
    const panel = document.querySelector('#history'), list = panel?.querySelector('.history-list');
    if (!panel || !list) return;
    const key = JSON.stringify([room,state.roundId,me,state.locked]);
    const filtered = filter !== 'all' || !!search, tail = state.entries.at(-1)?.id || '';
    if (key !== historyKey) { following = true; lastTail = ''; }
    if (wasFiltered && !filtered) following = true;
    if (filtered) following = false;
    suppressScroll = true;
    if (following && (tail !== lastTail || order !== lastOrder || key !== historyKey)) list.scrollTop = order === 'new' ? 0 : list.scrollHeight;
    else if (key === historyKey && saved) list.scrollTop = saved.top;
    historyKey=key; lastTail=tail; lastOrder=order; wasFiltered=filtered;
    requestAnimationFrame(() => requestAnimationFrame(() => { suppressScroll=false; }));
    list.addEventListener('scroll', () => {
      if (suppressScroll || filter !== 'all' || search) return;
      following = order === 'new' ? list.scrollTop < 30 : list.scrollHeight-list.scrollTop-list.clientHeight < 30;
    }, {passive:true});
    const newest = document.querySelector('#presentation-newest');
    if (newest) { newest.textContent = following ? '最新を追う ✓' : '最新へ'; newest.onclick = () => {
      following=true; filter='all'; search=''; lastTail=''; render();
    }; }
    // Keep the existing copy buttons/handlers; place them at the history toolbar.
    const bar = document.querySelector('.assist-copybar');
    if (bar) { bar.querySelector('.assist-kicker')?.remove(); bar.classList.add('repair-copybar'); panel.querySelector('.history-filters')?.before(bar); }
    if (!document.querySelector('#repair-history-copy')) {
      const b=document.createElement('button'); b.id='repair-history-copy'; b.className='quiet'; b.textContent='履歴をコピー'; b.onclick=copyDialog;
      (bar || panel.querySelector('.section-head')).prepend(b);
    }
    const publicCopy=document.querySelector('#assist-public-copy'); if(publicCopy)publicCopy.textContent='公開JSON';
    const expand=document.querySelector('#history-large'); if(expand)expand.textContent='履歴を広く見る ⤢';
  }
  function tools() {
    const assist=document.querySelector('#layout-tools')||document.querySelector('.fp-assist'), scene=document.querySelector('.fp-scene,.scene');
    if(assist&&scene)scene.after(assist);
    const lifeline=document.querySelector('#assist-lifeline-panel');
    if(lifeline)lifeline.open=true;
  }
  function applause() {
    const fresh=document.querySelector('#applause-tap');
    const key=state ? JSON.stringify([room,state.roundId,state.applauseId,me]) : '';
    if(!fresh){stableApplause=null;buttonKey='';return;}
    if(stableApplause&&buttonKey===key&&fresh!==stableApplause){
      stableApplause.disabled=fresh.disabled;
      stableApplause.querySelector('#tap-count').textContent=fresh.querySelector('#tap-count').textContent;
      stableApplause.setAttribute('aria-label',fresh.getAttribute('aria-label')||'拍手を送る');
      if(state.finalized||state.result?.finalized)stableApplause.onclick=null;
      fresh.replaceWith(stableApplause);
    }else{stableApplause=fresh;buttonKey=key;}
    stableApplause.classList.add('repair-applause');
    stableApplause.querySelector('strong').textContent=me===state.presenter?'みんなの拍手':'拍手を送る';
  }
  function records() {
    if(state.locked||!state.awardTotals||!state.achievementTotals)return;
    const panel=document.createElement('section');panel.id='repair-room-records';panel.className='panel';
    const awards=state.awardTotals,totals=FPScorePile.totals(state);
    panel.innerHTML=`<details><summary>この部屋の記録 · 全お題</summary><p class="small">得点：${totals?.scope==='lifetime-live'?'進行中のお題を含む':'確定分'}。獲得・実績：確定したお題だけ。一巡の部門賞とは別の累積記録です。${state.awardCoverage?.partial?'古い記録の内訳は一部未収録。':''}</p><div class="stats-scroll"><table><thead><tr><th>メンバー</th><th>累積点</th><th>FP / Super / Ultra</th><th>拍手</th><th>実績</th></tr></thead><tbody>${state.players.map(p=>{const a=awards[p.id],score=totals?.players.find(x=>x.id===p.id)?.total;return `<tr><th>${esc(p.name)}</th><td>${Number.isFinite(score)?score:'未公開'}</td><td>${a?`${a.fineplayReceived.normalCount} / ${a.fineplayReceived.superCount} / ${a.fineplayReceived.ultraCount??0}`:'0 / 0 / 0'}</td><td>${a?.applauseReceived.count??0}</td><td>${Object.entries(state.achievementTotals[p.id]||{}).filter(([,n])=>n>0).map(([k,n])=>esc(({firstQuestion:'はじめの質問',fineplay:'FinePlay',superFineplay:'Super',ultraFineplay:'Ultra',correctGuess:'正解',tenQuestionsOrFewer:'10問以内',hundredApplause:'100拍手'})[k]||k)+' × '+n).join('、')||'—'}</td></tr>`;}).join('')}</tbody></table></div><small>アカウント通算ではありません。部屋の終了条件・セッション表彰・アカウント保存は未実装です。</small></details>`;
    document.querySelector('.game-column')?.append(panel);
  }
  function nav() {
    const target=document.querySelector('.rail nav');if(!target||document.querySelector('#repair-updates'))return;
    const a=document.createElement('a');a.id='repair-updates';a.href='updates/';a.target='_blank';a.rel='noopener noreferrer';a.textContent='更新履歴 ↗';target.append(a);
  }
  render=()=>{
    const x=scrollX,y=scrollY,focus=document.activeElement,focusId=focus?.id,selection=typeof focus?.selectionStart==='number'?[focus.selectionStart,focus.selectionEnd,focus.selectionDirection]:null;
    const list=document.querySelector('.history-list'),saved=list?{top:list.scrollTop}:null;
    const open=document.querySelector('#repair-room-records details')?.open;
    previousRender();
    if(window.FPR3?.anticipating())return;
    if(state){historyUI(saved);tools();applause();records();if(open)document.querySelector('#repair-room-records details')?.setAttribute('open','');}
    nav();const box=document.querySelector('#repair-copy-text');if(box)box.value=plainHistory();
    const target=focusId?document.getElementById(focusId):null;
    if(target){target.focus({preventScroll:true});if(selection)try{target.setSelectionRange(...selection);}catch{}}
    scrollTo(x,y);
  };
  // The click handlers can update labels without a render; normalize only typography.
  document.addEventListener('click',e=>{if(e.target.closest('#applause-tap')){const b=document.querySelector('#applause-tap');if(b)b.querySelector('strong').textContent=me===state.presenter?'みんなの拍手':'拍手を送る';}});
  window.FPRepair=Object.freeze({plainHistory});
  window.addEventListener('fineplay:history-follow',()=>{following=true;});
  render();
})();
