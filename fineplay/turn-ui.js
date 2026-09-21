/* FINEPLAY 0.3.1 — presentation-only turn guidance; protocol and rules stay v2.
 * Loaded after play.js. No automatic/demo peer, no new answering permissions.
 */
(() => {
 'use strict';
 const originalBind=bind, originalRender=render, originalResult=result;
 let cluesOpen=false;
 const expandedEntries=new Set();
 const who=id=>demo?person(id).replace('（体験用）',''):person(id);
 function actors(){
  if(!state||state.phase!=='playing')return [];
  // Role membership and current action are separate. Multiple questioners are
  // eligible now; adding multiple answerers requires an explicit rules change.
  return state.pending?[state.presenter]:state.players.filter(p=>p.id!==state.presenter&&p.online).map(p=>p.id);
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
 function turnStrip(){
  const ids=actors(),people=ids.map(id=>state.players.find(p=>p.id===id)).filter(Boolean);
  return `<div class="turn-strip" role="status" aria-live="polite"><div class="turn-avatars" aria-hidden="true">${people.slice(0,3).map(p=>p.id===state.presenter?'<span class="turn-avatar active"><img src="assets/genie.svg" alt=""></span>':`<span class="turn-avatar active a${state.players.indexOf(p)%4}">${['✦','☾','❋','◇'][state.players.indexOf(p)%4]}</span>`).join('')}${people.length>3?`<span class="extra-actors">+${people.length-3}</span>`:''}</div><div><strong>${esc(activeText())}</strong><span>${!ready?'接続が戻るまで操作をお待ちください。':demo?(state.pending?(me===state.presenter?'下の回答を1つ選んでください。':'ひとり体験では、回答役にも切り替えられます。'):'自動では進みません。下のボタンで続けられます。'):state.pending?(me===state.presenter?'下の回答を1つ選んでください。':'回答が届くと、そのまま履歴に残ります。'):(me===state.presenter?'質問が届くと、回答ボタンが出ます。':'質問ボタンを押してから、Discordで話そう。')}</span></div></div>`;
 }
 function quickFP(){
  const e=[...state.entries].reverse().find(e=>e.kind==='question');
  if(!e)return '';
  const n=state.entries.indexOf(e)+1,self=e.asker===me;
  return `<div class="quick-fp"><div><span>回答済みの Q${String(n).padStart(2,'0')} に</span><p title="${esc(e.text||'声での質問')}">${esc(e.text||'声での質問')}</p></div><button data-vote="${esc(e.id)}" class="vote quick-vote ${e.myVote?'voted':''}" aria-pressed="${e.myVote}" ${!ready||busy||self?'disabled':''} title="${self?'自分の質問には付けられません':'この質問にFinePlayを付ける／取り消す'}">${HAND}<span>${self?'自分の質問':e.myVote?'FinePlay 済み':'いい質問！ FinePlay'}</span></button>${state.hidden?'<small class="sealed-note">票数は終了後に発表</small>':''}</div>`;
 }
 demoBar=()=>`<section class="demo-bar compact-demo"><b>ひとり体験 <span>一人で両方の役を試せます</span></b><details class="demo-options"><summary>体験の切り替え</summary><div class="row"><button id="demo-answer">回答役</button><button id="demo-ask">質問役</button><button id="demo-result">結果を見る</button><button id="demo-reset">最初から</button></div></details></section>`;
 header=()=>`<header class="top compact-top"><div><h1>${state?esc(state.scope):'いつもの通話に、ひとつの謎を。'}</h1>${!demo&&owner&&state?'<p>部屋の作成者：このタブを開いたままに。</p>':''}</div><div class="top-right">${state&&state.phase!=='lobby'?`<b class="compact-count" title="質問と判定済みの解答宣言の合計">${state.entries.length}<small>問</small></b><a class="history-jump" href="#history">履歴を見る ↓</a>`:''}${!demo?`<span class="status"><span class="online-dot ${ready?'on':''}"></span>${esc(status)}</span>`:''}</div></header>`;
 score=()=>'';
 members=()=>{
  const active=actors();
  return `<section class="panel members compact-members"><div class="section-head"><h2>メンバー <span>${state.players.length}人</span></h2>${!demo?button('invite','招待','quiet'):''}</div><div class="roster">${state.players.map((p,i)=>`<div class="member ${active.includes(p.id)?'turn-active':''} ${p.online?'':'offline'}" ${active.includes(p.id)?'aria-current="step"':''}>${p.id===state.presenter?'<span class="avatar genie-avatar"><img src="assets/genie.svg" alt=""></span>':avatar(p,i)}<div><b>${esc(who(p.id))}${p.id===me?' <small>あなた</small>':''}</b><small>${p.id===state.presenter?'回答係':'質問係'}${active.includes(p.id)?' · 今の番':''}${!p.online?' · 接続待ち':''}</small></div></div>`).join('')}</div></section>`;
 };
 scene=()=>{
  const p=state.pending,isPresenter=me===state.presenter,last=state.entries.at(-1);
  const subject=p?esc(p.text||'声で質問しています。'):last?esc(last.text||'声での質問（本文未記録）'):'何から、聞こう。';
  let action='';
  if(p&&isPresenter){
   action=`<div class="answers ${p.kind==='guess'?'two':''}">${(p.kind==='guess'?['correct','incorrect']:['yes','no','probably','probablyNot','unknown']).map(k=>button('answer-'+k,`<span class="answer-icon">${icon[k]}</span><b>${R.labels[k]}</b>`,k)).join('')}</div>`;
  }else if(p){
   action=demo?`<div class="turn-action">${button('turn-to-answer','回答役に切り替えて、答える →','primary wide')}</div>`:`<p class="wait-label">${esc(who(state.presenter))} の回答待ち</p>`;
  }else if(isPresenter){
   action=demo?`<div class="turn-action">${button('demo-nextquestion','次のサンプル質問へ →','primary wide')}</div>`:`<p class="wait-label">${actors().length?esc(actors().slice(0,2).map(who).join('・'))+(actors().length>2?' ほか':'')+' の質問待ち':'質問係の接続待ち'}</p>`;
  }else{
   action=`<form id="question-form"><label for="question">質問メモ <small>任意・声だけでもOK</small></label><input id="question" value="${esc(draft)}" maxlength="200" placeholder="例：外で使うもの？"><div class="row">${button('ask','この質問をする →','primary grow')}${button('guess','答えがわかった','dark')}</div></form>`;
  }
  const tools=`${p&&(isPresenter||owner||p.asker===me)?button('cancel','質問を取り消す','quiet'):''}${!p&&isPresenter&&state.entries.length?button('undo','直前の回答を訂正','quiet'):''}${isPresenter?button('reveal','降参・お題を公開','quiet'):''}`;
  return `<section class="panel scene focused-scene">${turnStrip()}<div class="question-stage ${p?'':'answered-stage'}"><span class="q-label">${p?'Q'+String(state.entries.length+1).padStart(2,'0')+' · '+esc(who(p.asker))+(p.kind==='guess'?' の解答':' の質問'):last?'回答済み · Q'+String(state.entries.length).padStart(2,'0'):'次の質問'}</span><h2>${subject}</h2>${!p&&last?`<span class="answer-chip ${last.answer}">${R.labels[last.answer]}</span>`:''}</div>${action}${quickFP()}${tools?`<details class="turn-tools"><summary>訂正・その他</summary><div class="scene-tools">${tools}</div></details>`:''}</section>`;
 };
 // Keep celebratory results. The large in-game promotional FP panel is removed;
 // the actionable quick vote and the existing history votes remain.
 fineplay=()=>{
  if(!R.done(state))return '';
  const es=state.entries.filter(e=>e.votes>0),best=[...es].sort((a,b)=>b.votes-a.votes)[0];
  return `<section class="panel result-fp"><h2>${HAND} FinePlay <small>${es.length}問</small></h2>${best?`<p>「${esc(best.text||'声での名質問')}」</p>`:''}${quickFP()}</section>`;
 };
 result=()=>originalResult().replace('<p>ここまでの一問一問が、答えにつながった。</p>','').replace('<span class="small">回答画像の自動生成は、まだありません。履歴は右側にそのまま残ります。</span>','');
 historyPanel=()=>{
  let rows=state.entries.map((e,i)=>({...e,n:i+1}));
  const needle=search.toLocaleLowerCase();
  rows=rows.filter(e=>(filter==='all'||(filter==='fp'?(e.votes>0||e.myVote):e.answer===filter))&&(!needle||[e.text,person(e.asker),R.labels[e.answer]].join(' ').toLocaleLowerCase().includes(needle)));
  if(order==='new')rows.reverse();
  return `<section class="panel history" id="history"><div class="section-head"><h2>ここまでの質問 <span>${state.entries.length}件</span></h2><button class="quiet" id="history-order">${order==='old'?'古い順 ↓':'新しい順 ↓'}</button></div><details id="clue-controls" ${cluesOpen?'open':''}><summary>履歴を探す${search||filter!=='all'?' · 絞り込み中':''}</summary><div class="history-filters"><input id="history-search" aria-label="履歴を検索" placeholder="質問・名前で探す" value="${esc(search)}"><select id="history-filter" aria-label="履歴を絞り込む">${[['all','すべて'],['yes','はい'],['no','いいえ'],['probably','たぶんそう'],['probablyNot','たぶん違う'],['unknown','わからない'],['fp','FinePlay']].map(([v,t])=>`<option value="${v}" ${filter===v?'selected':''}>${t}</option>`).join('')}</select></div></details><div class="history-list" tabindex="0" aria-label="質問と回答の履歴">${rows.map(e=>`<details class="history-item compact-clue" data-entry="${esc(e.id)}" ${expandedEntries.has(e.id)?'open':''}><summary title="クリックすると質問者・FinePlay・メモを表示"><span class="history-number">${String(e.n).padStart(2,'0')}</span><span class="clue-text">${e.kind==='guess'?'解答：':''}${esc(e.text||'声での質問（本文未記録）')}</span><span class="answer-chip ${e.answer}">${R.labels[e.answer]}</span></summary><div class="clue-detail"><small>${esc(who(e.asker))} の${e.kind==='guess'?'解答':'質問'}${e.myVote?' · FinePlay済み':''}</small><div class="history-actions">${e.kind==='question'?`<button data-vote="${esc(e.id)}" class="vote ${e.myVote?'voted':''}" aria-pressed="${e.myVote}" ${busy||!ready||e.asker===me?'disabled':''}>${HAND}<span>${e.asker===me?'自分の質問':e.myVote?'FinePlay 済み':'FinePlay'}${e.votes?' · '+e.votes:''}</span></button>${me===state.presenter||me===e.asker?`<button class="quiet" data-note="${esc(e.id)}">メモ</button>`:''}`:''}</div></div></details>`).join('')||`<p class="empty">${state.entries.length?'一致する質問がありません。':'回答がここにたまります。'}</p>`}</div>${newHistory?'<button id="history-latest" class="new-history">新しい履歴があります ↓</button>':''}</section>`;
 };

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
  const focus=active?.dataset?.vote?{vote:active.dataset.vote,quick:active.classList.contains('quick-vote')}:null;
  originalRender();
  document.body.classList.add('turn-ui-031');
  fitHistory();
  const nextList=document.querySelector('.history-list');if(nextList)nextList.scrollTop=atLatest?(order==='old'?nextList.scrollHeight:0):oldScroll;
  openMenus.forEach(s=>{const el=document.querySelector(s);if(el)el.open=true;});
  if(focus){const e=[...document.querySelectorAll('[data-vote]')].find(b=>b.dataset.vote===focus.vote&&b.classList.contains('quick-vote')===focus.quick);e?.focus({preventScroll:true});}
  const version=document.querySelector('.version');if(version)version.textContent='FRIENDS PREVIEW · 0.3.1';
  const footer=document.querySelector('footer');if(footer?.firstChild?.nodeType===3)footer.firstChild.textContent='FINEPLAY 0.3.1 ';
 };
 render();
})();
