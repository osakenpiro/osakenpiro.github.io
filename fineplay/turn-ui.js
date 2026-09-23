/* FINEPLAY 0.4 — presentation layer loaded after play.js.
 * Rules, protocol v2, storage keys, invite links and permissions are untouched.
 * Information is re-layered, not deleted: role + person + turn + connection sit on one
 * icon, the asker sits on the question card, the FinePlay hand sits on the answered
 * question it targets, and history rows carry author and FP marks inline.
 * Adds a scripted per-role single-player tutorial. No AI opponent, no network in demo.
 */
(() => {
 'use strict';
 const originalBind=bind,originalRender=render,originalResult=result,originalRail=rail;
 const roleParam=demo?new URLSearchParams(location.search).get('role'):'';
 const tutorial=roleParam==='genie'||roleParam==='asker'?roleParam:'';
 const FACE='assets/genie-face.png',GROVE='assets/genie-grove.png';
 const glyph=['✦','☾','❋','◇'];
 const expandedEntries=new Set();
 const INTRO_KEY='fineplay:intro:'+tutorial;
 let cluesOpen=false,introShown=!tutorial;
 // The role briefing is shown once per browser session, and can be skipped with &intro=0.
 try{if(tutorial&&(sessionStorage.getItem(INTRO_KEY)==='1'||new URLSearchParams(location.search).get('intro')==='0'))introShown=true;}catch{}
 const who=id=>demo?person(id).replace('（体験用）','（体験）'):person(id);
 const pad=n=>String(n).padStart(2,'0');

 // Role membership and the current action are separate models.
 function actors(){
  if(!state||state.phase!=='playing')return [];
  return state.pending?[state.presenter]:state.players.filter(p=>p.id!==state.presenter&&p.online).map(p=>p.id);
 }
 function verb(p){
  if(!p.online)return '接続待ち';
  if(state.phase!=='playing')return '待機';
  if(state.pending)return p.id===state.presenter?'回答中':'回答を待っています';
  return p.id===state.presenter?'質問を待っています':'質問できます';
 }
 function activeText(){
  if(!ready)return '接続を確認しています';
  if(R.done(state))return '答え合わせ';
  if(state.pending){
   const p=state.players.find(p=>p.id===state.presenter);
   if(!p?.online)return `${who(state.presenter)} の接続待ち`;
   return me===state.presenter?'あなたが答える番':`${who(state.presenter)} が答える番`;
  }
  return me===state.presenter?'次は、質問する人の番':'あなたが質問できます';
 }
 // One icon carries person, role, current turn and connection.
 function faceEl(id,cls=''){
  const p=state.players.find(p=>p.id===id);
  if(!p)return '';
  const i=state.players.indexOf(p),genie=id===state.presenter,turn=actors().includes(id);
  return `<span class="fp-face ${cls}${turn?' is-turn':''}${p.online?'':' is-off'}">${genie?`<img src="${FACE}" alt="">`:`<span class="fp-mark a${i%4}">${glyph[i%4]}</span>`}<span class="fp-role ${genie?'genie':'ask'}" aria-hidden="true">${genie?'魔':'？'}</span></span>`;
 }
 function voteButton(e,variant){
  const self=e.asker===me,n=e.n||state.entries.indexOf(e)+1;
  const label=self?'自分の質問':e.myVote?'FinePlay 済み':'いい質問！ FinePlay';
  return `<button data-vote="${esc(e.id)}" class="vote ${variant}-vote${e.myVote?' voted':''}" aria-pressed="${e.myVote}" ${!ready||busy||self?'disabled':''} title="${self?'自分の質問には付けられません':`Q${pad(n)} にFinePlayを付ける／取り消す`}">${HAND}<span>${label}</span>${e.votes?`<b class="vote-count">${e.votes}</b>`:''}</button>`;
 }

 rail=()=>originalRail().replace('assets/grove.svg',GROVE).replace('FRIENDS PREVIEW · 0.3','FRIENDS PREVIEW · 0.4.1');

 header=()=>{
  const lobby=!state||state.phase==='lobby';
  const title=state?esc(state.scope):'いつもの通話に、ひとつの謎を。';
  const sub=lobby?'人が出題、みんなで推理。':`出題：${esc(who(state.presenter))}${state.mode==='sealed'?'　／　FinePlayは終了後':''}`;
  return `<header class="top fp-top"><div class="fp-top-id"><span class="fp-face md${lobby?'':' is-turn'}"><img src="${FACE}" alt=""></span><div><h1>${title}</h1><p>${sub}</p></div></div><div class="fp-top-right">${!lobby?`<b class="fp-count" title="質問と判定済みの解答宣言の合計">${state.entries.length}<small>問</small></b><a class="history-jump" href="#history">履歴 ↓</a>`:''}${!demo?`<span class="status"><span class="online-dot ${ready?'on':''}"></span>${esc(status)}</span>`:''}</div></header>`;
 };

 score=()=>'';

 members=()=>`<section class="panel members fp-members"><div class="section-head"><h2>メンバー <span>${state.players.length}人</span></h2>${!demo?button('invite','招待','quiet'):''}</div><div class="roster">${state.players.map(p=>{
  const turn=actors().includes(p.id);
  return `<div class="member${turn?' turn-active':''}${p.online?'':' offline'}"${turn?' aria-current="step"':''}>${faceEl(p.id,'md')}<b>${esc(who(p.id))}${p.id===me?'<small>あなた</small>':''}</b><small class="member-role">${p.id===state.presenter?'魔人（回答）':'質問'}</small><small class="member-verb">${verb(p)}</small></div>`;
 }).join('')}</div></section>`;

 // The asker, the number and the answer live on the question itself.
 function questionCard(){
  const p=state.pending,last=state.entries.at(-1);
  if(p){
   return `<article class="fp-card is-open"><header class="fp-card-head">${faceEl(p.asker,'sm')}<b>${esc(who(p.asker))}</b><span>${p.kind==='guess'?'が答えを宣言':'が質問しました'}</span><span class="fp-qno">Q${pad(state.entries.length+1)}</span></header><h2>${esc(p.text||'声で質問しています。')}</h2></article>`;
  }
  if(last){
   return `<article class="fp-card is-answered"><header class="fp-card-head">${faceEl(last.asker,'sm')}<b>${esc(who(last.asker))}</b><span>${last.kind==='guess'?'の解答宣言':'の質問'}</span><span class="fp-qno">Q${pad(state.entries.length)}</span></header><h2>${esc(last.text||'声での質問（本文未記録）')}</h2><div class="fp-card-foot"><span class="fp-answered-by">${faceEl(state.presenter,'xs')}<span class="answer-chip ${last.answer}">${R.labels[last.answer]}</span></span>${last.kind==='question'?voteButton(last,'card'):''}</div>${state.hidden&&last.kind==='question'?'<p class="sealed-note">票数は終了後に発表</p>':''}</article>`;
  }
  return `<article class="fp-card is-empty"><h2>何から、聞こう。</h2></article>`;
 }
 // While a new question is pending, the hand still points at one named earlier question.
 function pendingFP(){
  if(!state.pending)return '';
  const e=[...state.entries].reverse().find(e=>e.kind==='question');
  if(!e)return '';
  return `<div class="fp-prev"><span class="fp-prev-no">Q${pad(state.entries.indexOf(e)+1)}</span><p title="${esc(e.text||'声での質問')}">${esc(e.text||'声での質問')}</p>${voteButton(e,'prev')}</div>`;
 }

 scene=()=>{
  const p=state.pending,isPresenter=me===state.presenter,act=actors();
  let action='';
  if(p&&isPresenter){
   action=`<div class="answers ${p.kind==='guess'?'two':''}">${(p.kind==='guess'?['correct','incorrect']:['yes','no','probably','probablyNot','unknown']).map(k=>button('answer-'+k,`<span class="answer-icon">${icon[k]}</span><b>${R.labels[k]}</b>`,k)).join('')}</div>`;
  }else if(p){
   action=demo?`<div class="turn-action">${button('turn-to-answer','回答役に切り替えて、答える →','primary wide')}</div>`:`<p class="wait-label">${esc(who(state.presenter))} の回答待ち</p>`;
  }else if(isPresenter){
   action=demo?`<div class="turn-action">${button('demo-nextquestion','次のサンプル質問へ →','primary wide')}</div>`:`<p class="wait-label">${act.length?esc(act.slice(0,2).map(who).join('・'))+(act.length>2?' ほか':'')+' の質問待ち':'質問係の接続待ち'}</p>`;
  }else{
   action=`<form id="question-form"><label for="question">質問メモ <small>任意・声だけでもOK</small></label><input id="question" value="${esc(draft)}" maxlength="200" placeholder="例：外で使うもの？"><div class="row">${button('ask','この質問をする →','primary grow')}${button('guess','答えがわかった','dark')}</div></form>`;
  }
  const tools=`${p&&(isPresenter||owner||p.asker===me)?button('cancel','質問を取り消す','quiet'):''}${!p&&isPresenter&&state.entries.length?button('undo','直前の回答を訂正','quiet'):''}${isPresenter?button('reveal','降参・お題を公開','quiet'):''}`;
  return `<section class="panel scene fp-scene"><div class="fp-turn" role="status" aria-live="polite"><span class="fp-turn-faces">${act.slice(0,3).map(id=>faceEl(id,'sm')).join('')}${act.length>3?`<span class="extra-actors">+${act.length-3}</span>`:''}</span><div><strong>${esc(activeText())}</strong>${tutorial==='genie'&&!R.done(state)?'<span class="fp-note">お題は「傘」</span>':''}</div>${tutorial?`<a class="fp-swap" href="?demo=1&amp;role=${tutorial==='genie'?'asker':'genie'}">${tutorial==='genie'?'質問役へ':'魔人役へ'} →</a>`:''}</div>${questionCard()}${action}${pendingFP()}${tools?`<details class="turn-tools"><summary>訂正・その他</summary><div class="scene-tools">${tools}</div></details>`:''}</section>`;
 };

 fineplay=()=>{
  if(!R.done(state))return '';
  const es=state.entries.filter(e=>e.votes>0),best=[...es].sort((a,b)=>b.votes-a.votes)[0];
  return `<section class="panel result-fp"><h2>${HAND} FinePlay <small>${es.length}問</small></h2>${best?`<p>「${esc(best.text||'声での名質問')}」<small>${esc(who(best.asker))} · ${best.votes}票</small></p>`:'<p class="small">いい質問には、履歴から合図を。</p>'}</section>`;
 };
 result=()=>originalResult().replace('<p>ここまでの一問一問が、答えにつながった。</p>','').replace('<span class="small">回答画像の自動生成は、まだありません。履歴は右側にそのまま残ります。</span>','<span class="small">質問と回答は、右の履歴にそのまま残ります。</span>');

 historyPanel=()=>{
  let rows=state.entries.map((e,i)=>({...e,n:i+1}));
  const needle=search.toLocaleLowerCase();
  rows=rows.filter(e=>(filter==='all'||(filter==='fp'?(e.votes>0||e.myVote):e.answer===filter))&&(!needle||[e.text,person(e.asker),R.labels[e.answer]].join(' ').toLocaleLowerCase().includes(needle)));
  if(order==='new')rows.reverse();
  const list=rows.map(e=>`<details class="history-item compact-clue" data-entry="${esc(e.id)}" ${expandedEntries.has(e.id)?'open':''}><summary title="開くと、メモとFinePlayの操作が出ます"><span class="history-number">${pad(e.n)}</span><span class="clue-main"><span class="clue-text">${e.kind==='guess'?'解答：':''}${esc(e.text||'声での質問（本文未記録）')}</span><span class="clue-tags">${faceEl(e.asker,'xs')}<span class="clue-who">${esc(who(e.asker))}</span>${e.myVote||e.votes?`<span class="clue-fp${e.myVote?' mine':''}">${HAND}${e.votes?`<b>${e.votes}</b>`:''}</span>`:''}</span></span><span class="answer-chip ${e.answer}">${R.labels[e.answer]}</span></summary><div class="clue-detail"><div class="history-actions">${e.kind==='question'?voteButton(e,'row'):'<small>解答宣言には合図を付けられません。</small>'}${e.kind==='question'&&(me===state.presenter||me===e.asker)?`<button class="quiet" data-note="${esc(e.id)}">メモを直す</button>`:''}</div></div></details>`).join('');
  return `<section class="panel history" id="history"><div class="section-head"><h2>ここまでの質問 <span>${state.entries.length}件</span></h2><button class="quiet" id="history-order">${order==='old'?'古い順 ↓':'新しい順 ↓'}</button></div><details id="clue-controls" ${cluesOpen?'open':''}><summary>履歴を探す${search||filter!=='all'?' · 絞り込み中':''}</summary><div class="history-filters"><input id="history-search" aria-label="履歴を検索" placeholder="質問・名前で探す" value="${esc(search)}"><select id="history-filter" aria-label="履歴を絞り込む">${[['all','すべて'],['yes','はい'],['no','いいえ'],['probably','たぶんそう'],['probablyNot','たぶん違う'],['unknown','わからない'],['fp','FinePlay']].map(([v,t])=>`<option value="${v}" ${filter===v?'selected':''}>${t}</option>`).join('')}</select></div></details><div class="history-list" tabindex="0" aria-label="質問と回答の履歴">${list||`<p class="empty">${state.entries.length?'一致する質問がありません。':'回答がここにたまります。'}</p>`}</div>${newHistory?'<button id="history-latest" class="new-history">新しい履歴があります ↓</button>':''}</section>`;
 };

 // Scripted single-player tutorial. It uses the real rules and the real UI.
 const STEPS={genie:['役を知る','質問を受ける','5択で答える','履歴とFinePlay','解答を判定'],asker:['役を知る','質問を書く','回答を見る','FinePlay','答えを宣言']};
 function tutorialState(){
  if(!state)return {i:0,tip:''};
  if(R.done(state))return {i:4,tip:'結果です。「体験の切り替え」の「最初から」で、何度でも試せます。'};
  if(tutorial==='genie'){
   if(state.pending&&state.pending.kind==='guess')return {i:4,tip:'解答宣言が届きました。合っていれば「正解！」を選びます。'};
   if(state.pending)return {i:2,tip:`${who(state.pending.asker)} の質問に、5択のどれかで答えてください。文章で答える欄はありません。`};
   return {i:3,tip:'回答が履歴に入りました。いい質問だと思ったら FinePlay。「次のサンプル質問へ」で続けられます。'};
  }
  if(state.pending&&state.pending.kind==='guess')return {i:4,tip:'宣言を出しました。お試しでは、自分で回答役に切り替えて判定します。'};
  if(state.pending)return {i:2,tip:'まじん係の番です。お試しでは「回答役に切り替えて、答える」で自分が答えられます。'};
  if(state.entries.length>4)return {i:3,tip:'回答が履歴に入りました。いい質問には FinePlay。答えがわかったら「答えがわかった」。'};
  return {i:1,tip:'質問メモを書いて「この質問をする」。声だけでもOKですが、履歴に残すなら短く書きます。'};
 }
 function stepDots(){
  const {i}=tutorialState(),steps=STEPS[tutorial];
  return `<span class="fp-dots" role="img" aria-label="${i+1} / ${steps.length}・${esc(steps[i]||'')}">${steps.map((s,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</span>`;
 }

 demoBar=()=>`<section class="demo-bar compact-demo"><b>${tutorial==='genie'?'魔人役のお試し':tutorial==='asker'?'質問役のお試し':'ひとり体験'}</b>${tutorial?stepDots():'<span class="demo-hint">相手は台本のサンプル</span>'}<details class="demo-options"><summary>体験の切り替え</summary><div class="row"><button id="demo-answer">回答役</button><button id="demo-ask">質問役</button><button id="demo-result">結果を見る</button><button id="demo-reset">最初から</button></div></details></section>`;

 bind=()=>{
  originalBind();
  on('turn-to-answer',()=>{if(demo){me=game.presenter;broadcast();}});
  const d=$('#clue-controls');if(d)d.ontoggle=()=>{cluesOpen=d.open;};
  document.querySelectorAll('.compact-clue').forEach(el=>el.ontoggle=()=>{if(!el.isConnected)return;if(el.open)expandedEntries.add(el.dataset.entry);else expandedEntries.delete(el.dataset.entry);fitHistory();});
  if(demo)on('demo-nextquestion',()=>{
   if(!ready||busy||game.phase!=='playing'||game.pending)return;
   me=game.presenter;
   const samples=['使うときに、形が変わる？','持ち歩いて使える？','雨をよけるもの？'];
   const text=samples[Math.max(0,game.entries.length-5)%samples.length];
   try{demoApply(game.players.find(p=>p.id!==me&&p.online).id,'ask',{kind:'question',text});broadcast();}catch(e){toast(e.message);}
  });
 };
 function fitHistory(){
  const list=document.querySelector('.history-list');if(!list)return;
  list.style.maxHeight=innerWidth>760?Math.max(150,innerHeight-list.getBoundingClientRect().top-22)+'px':'';
 }
 let resizeFrame=0;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(fitHistory);});
 render=()=>{
  const oldList=document.querySelector('.history-list'),oldScroll=oldList?.scrollTop||0;
  const atLatest=!oldList||(order==='old'?oldList.scrollHeight-oldScroll-oldList.clientHeight<35:oldScroll<35);
  if(state&&renderRound!==state.roundId)expandedEntries.clear();
  const d=$('#clue-controls');if(d)cluesOpen=d.open;
  const openMenus=['.demo-options','.turn-tools'].filter(s=>document.querySelector(s)?.open);
  const active=document.activeElement;
  const focus=active?.dataset?.vote?{vote:active.dataset.vote,variant:active.className.match(/(card|prev|row)-vote/)?.[1]||''}:null;
  originalRender();
  document.body.classList.add('turn-ui-040');
  // Keep every illustration on the approved reference art, including play.js-owned views.
  document.querySelectorAll('img[src$="assets/grove.svg"]').forEach(i=>i.src=GROVE);
  document.querySelectorAll('img[src$="assets/genie.svg"]').forEach(i=>i.src=FACE);
  if(tutorial)document.body.classList.add('is-tutorial');
  fitHistory();
  const nextList=document.querySelector('.history-list');if(nextList)nextList.scrollTop=atLatest?(order==='old'?nextList.scrollHeight:0):oldScroll;
  openMenus.forEach(s=>{const el=document.querySelector(s);if(el)el.open=true;});
  if(focus){const e=[...document.querySelectorAll('[data-vote]')].find(b=>b.dataset.vote===focus.vote&&(b.className.match(/(card|prev|row)-vote/)?.[1]||'')===focus.variant);e?.focus({preventScroll:true});}
  const footer=document.querySelector('footer');if(footer?.firstChild?.nodeType===3)footer.firstChild.textContent='FINEPLAY 0.4.1 ';
 };
 if(demo&&tutorial){
  try{
   if(tutorial==='asker'){
    if(game.pending)demoApply(game.pending.asker,'cancel',{pendingId:game.pending.id});
    me=game.players.find(p=>p.id!==game.presenter).id;
   }else me=game.presenter;
   broadcast();
  }catch(e){render();}
 }
 render();
})();
