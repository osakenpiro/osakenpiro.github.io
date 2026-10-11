/* FINEPLAY guided practice. Same rules and UI; scripted partner, never AI/network.
 * Only role demos are affected. Free sandbox and real rooms keep their behavior. */
(() => {
 'use strict';
 const role=new URLSearchParams(location.search).get('role');
 // The asker entry now uses the normal game UI with explicit solo partners.
 if(!demo||role!=='genie')return;
 const previousBind=bind, presenter='demo-presenter', asker='demo-asker-a', friend='demo-asker-b';
 const samples=[['雨の日に使うもの？','yes'],['使うときに、開くもの？','yes'],['食べられるもの？','no']];
 const incoming=['人が作ったもの？','雨の日に使うもの？','使うときに、開くもの？'];
 let timer=null,epoch=0,waiting=false;
 const normal=()=>state.entries.filter(e=>e.kind==='question');
 const remaining=()=>samples.filter(([q])=>!state.entries.some(e=>e.text===q));
 const face='<span class="fp-face sm"><img src="assets/genie-face.png" alt=""></span>';
 const memberFace=id=>id===presenter?face:`<span class="fp-face sm"><span class="fp-mark ${id===asker?'a1':'a2'}">${id===asker?'☾':'❋'}</span><span class="fp-role ask" aria-hidden="true">？</span></span>`;
 function later(action){
  const current=epoch;waiting=true;broadcast();
  timer=setTimeout(()=>{if(current!==epoch)return;waiting=false;try{action();}catch(e){toast(e.message);}broadcast();},600);
 }
 function nextIncoming(){
  if(game.pending||R.done(game))return;
  const n=game.entries.filter(e=>e.kind==='question').length;
  demoApply(asker,'ask',n<incoming.length?{kind:'question',text:incoming[n]}:{kind:'guess',text:'傘'});
 }
 function restart(){
  clearTimeout(timer);epoch++;waiting=false;closeModal();busy=false;ready=true;owner=true;
  me=role==='genie'?presenter:asker;name=role==='genie'?'まじん係':'はる';draft='';filter='all';search='';order='old';renderRound='';seen.clear();
  game=R.create(presenter,'まじん係（体験）');game=R.join(game,asker,'はる（体験）');game=R.join(game,friend,'あお（体験）');
  demoApply(presenter,'start',{presenter,mode:'live',scope:'身近なものをあてよう',secretAnswer:'傘'});
  if(role==='asker'){demoApply(friend,'ask',{kind:'question',text:'人が作ったもの？'});demoApply(presenter,'answer',{pendingId:game.pending.id,answer:'yes'});}else nextIncoming();
  broadcast();
 }
 const stage=()=>R.done(state)?'体験完了':role==='genie'?(state.pending?.kind==='guess'?'解答を判定する':'6択で答える'):(state.entries.some(e=>e.kind==='guess'&&e.answer==='incorrect')?'もう一度、答えを宣言':remaining().length?'質問して、絞る':'答えを宣言する');
 demoBar=()=>`<section class="demo-bar compact-demo tutorial-bar"><b>${role==='asker'?'質問役':'魔人役'}のチュートリアル</b><a href="home/">紹介に戻る</a><button id="demo-reset">最初から</button></section>`;
 function clap(){
  const e=state.entries.find(e=>e.kind==='question'&&e.asker!==me);if(!e)return '';
  return `<div class="tutorial-clap"><p><small>ほかの人のいい質問には、拍手。</small><br>「${esc(e.text)}」</p><button id="tutorial-clap" data-vote="${esc(e.id)}" class="vote card-vote${e.myVote?' voted':''}" aria-pressed="${e.myVote}">${HAND}<span>${e.myVote?'FinePlay 済み':'いい質問！ FinePlay'}</span></button></div>`;
 }
 function card(){
  const e=state.pending||state.entries.at(-1);if(!e)return '';
  return `<article class="fp-card ${state.pending?'is-open':'is-answered'}"><header class="fp-card-head">${memberFace(e.asker)}<b>${esc(person(e.asker))}</b><span>${e.kind==='guess'?'の解答宣言':'の質問'}</span><span class="fp-qno">Q${padNumber(state.pending?state.entries.length+1:state.entries.length)}</span></header><h2>${esc(e.text)}</h2>${!state.pending?`<span class="answer-chip ${e.answer}">${R.labels[e.answer]}</span>`:''}</article>`;
 }
 const padNumber=n=>String(n).padStart(2,'0');
 scene=()=>{
  let action='';const pending=state.pending;
  if(waiting)action='<p class="callout" role="status">練習の相手が応答しています…</p>';
  else if(role==='genie'&&pending)action=`<div class="answers ${pending.kind==='guess'?'two':'six'}">${(pending.kind==='guess'?['correct','incorrect']:['yes','no','partly','probably','probablyNot','unknown']).map(k=>button('answer-'+k,`<span class="answer-icon">${icon[k]}</span><b>${R.labels[k]}</b>`,k)).join('')}</div>`;
  else if(role==='asker'){
   const left=remaining();action=`${left.length?`<form id="question-form"><label for="tutorial-question">練習用の質問を、選んで送る</label><select id="tutorial-question">${left.map(([q])=>`<option value="${esc(q)}">${esc(q)}</option>`).join('')}</select><button id="ask" class="primary wide" type="submit">この質問をする →</button></form>`:'<p class="callout">手がかりがそろいました。答えを宣言してみよう。</p>'}<button id="guess" type="button" class="dark wide">答えがわかった</button><details class="tutorial-hint"><summary>答えのヒント</summary><p>雨の日に開いて使う「傘」です。「傘」か「かさ」と入力して宣言できます。</p></details>`;
  }
  const incorrect=state.entries.at(-1)?.answer==='incorrect';
  return `<section class="panel scene fp-scene tutorial-scene"><div class="fp-turn" role="status">${face}<div><strong>${stage()}</strong><span class="fp-note">${role==='genie'?'あなたは答える人。お題は「傘」。':'あなたは当てる人。まずは一問、聞いてみよう。'}</span></div></div><p class="tutorial-contract">練習の相手は台本で自動進行します。<b>本番では友達が答えます。</b></p>${card()}${incorrect?'<p class="callout">この練習のお題は「傘」。もう一度、解答を試せます。</p>':''}${action}${clap()}<p class="small tutorial-real">${role==='asker'?'本番は声で自由に質問。質問メモは任意です。':'本番も回答はこの6択。わかった人の解答を、最後に正誤判定します。'} 質問と回答は「履歴 ↓」で見返せます。</p></section>`;
 };
 result=()=>`<section class="panel result tutorial-result"><div class="eyebrow">TUTORIAL COMPLETE</div><div class="result-magic"><span aria-hidden="true">✦</span><img src="assets/genie-face.png" alt="よろこぶまじん"><span aria-hidden="true">✧</span></div><h2>正解！</h2><div class="answer-reveal">${esc(state.reveal)}</div><p>${state.entries.length}問で答え合わせ。いい質問には、FinePlay。</p><div class="row"><a id="tutorial-play" class="btn primary" href="./">仲間と遊ぶ・部屋をつくる →</a><button id="share" class="quiet">練習の結果をコピー</button></div><p class="small">作成者が「招待URLをコピー」で仲間を誘い、全員そろったら開始。友達の卓には、その人の招待URLから入ります。作成者はPC推奨・タブを開いたままに。</p><div class="row"><a class="btn" href="?demo=1&amp;role=${role==='asker'?'genie':'asker'}">${role==='asker'?'答える側':'質問する側'}も試す →</a><a class="btn quiet" href="home/#play">集合のしかたを見る</a></div></section>`;
 function guess(){
  if(waiting||game.pending||R.done(game))return;
  modal('<h2>答えを宣言する</h2><p>正解でも不正解でも、判定されたら1問。本番は出題者が判定します。</p><form id="tutorial-guess-form"><label for="guess-text">答え</label><input id="guess-text" maxlength="200" autocomplete="off" required><div class="row"><button id="guess-send" class="primary" type="submit">この答えを宣言する</button><button id="modal-close" type="button">戻る</button></div></form>');
  $('#guess-text').focus();
  $('#tutorial-guess-form').onsubmit=e=>{
   e.preventDefault();const text=$('#guess-text').value.trim();if(!text)return;
   send('ask',{kind:'guess',text});const id=game.pending?.id;if(!id)return;
   const correct=['傘','かさ','カサ','umbrella'].includes(text.normalize('NFKC').toLowerCase());
   later(()=>{if(game.pending?.id===id)demoApply(presenter,'answer',{pendingId:id,answer:correct?'correct':'incorrect'});});
  };
 }
 bind=()=>{
  previousBind();on('demo-reset',restart);on('guess',guess);
  if($('#question-form'))$('#question-form').onsubmit=e=>{
   e.preventDefault();if(waiting||game.pending)return;
   const sample=samples.find(([q])=>q===$('#tutorial-question').value);if(!sample)return;
   send('ask',{kind:'question',text:sample[0]});const id=game.pending?.id;if(!id)return;
   later(()=>{if(game.pending?.id===id)demoApply(presenter,'answer',{pendingId:id,answer:sample[1]});});
  };
  if(role==='genie')for(const k of Object.keys(R.labels))on('answer-'+k,()=>{
   if(waiting||!game.pending)return;
   send('answer',{pendingId:game.pending.id,answer:k});if(!R.done(game))later(nextIncoming);
  });
 };
 window.addEventListener('pagehide',()=>{clearTimeout(timer);epoch++;});
 window.addEventListener('pageshow',e=>{if(e.persisted)restart();});
 restart();
})();

/* Install after the modern render wrappers. Keep their scene, HUD, lamp and
 * history; only the asker practice controls use a small, explicit script. */
(() => {
 'use strict';
 if(!demo||new URLSearchParams(location.search).get('role')!=='asker')return;
 function install(){
  const presenter='demo-presenter',asker='demo-asker-a',friend='demo-asker-b';
  const samples=[['雨の日に使うもの？','yes'],['使うときに、開くもの？','yes'],['食べられるもの？','no']];
  const correctAnswers=new Set(['傘','かさ','カサ','umbrella']);
  const priorRender=render;
  let timer=null,run=0,responseId='',selected=samples[0][0],hintOpen=false;
  const remaining=()=>samples.filter(([q])=>!game.entries.some(e=>e.kind==='question'&&e.text===q));
  const cancelResponse=()=>{clearTimeout(timer);timer=null;responseId='';};
  const active=()=>demo&&me===asker&&ready&&!busy&&game?.phase==='playing'&&!game.pending;
  function respond(id,answer){
   cancelResponse();responseId=id;const current=run,roundId=game.roundId;
   timer=setTimeout(()=>{
    timer=null;
    if(current!==run||game.roundId!==roundId||game.pending?.id!==id){responseId='';return;}
    responseId='';
    try{demoApply(presenter,'answer',{pendingId:id,answer});}catch(e){toast(e.message);}
    broadcast();
   },600);
  }
  function askSample(event){
   event?.preventDefault();
   if(!active())return;
   const sample=remaining().find(([q])=>q===$('#tutorial-question')?.value);
   if(!sample)return;
   selected=sample[0];send('ask',{kind:'question',text:sample[0]});
   if(game.pending?.asker===asker&&game.pending.text===sample[0])respond(game.pending.id,sample[1]);
  }
  function guess(event){
   event?.preventDefault();if(!active()||!state.allowance.canGuess)return;
   modal('<h2>答えを宣言する</h2><p>この練習では台本で答え合わせします。本番では出題者が正誤を判定します。</p><form id="tutorial-guess-form"><label for="guess-text">答え</label><input id="guess-text" maxlength="200" autocomplete="off" required><div class="row"><button id="guess-send" class="primary" type="submit">この答えを宣言する</button><button id="modal-close" type="button">戻る</button></div></form>');
   $('#guess-text').focus();
   $('#tutorial-guess-form').onsubmit=e=>{
    e.preventDefault();if(!active()||!state.allowance.canGuess)return;
    const value=$('#guess-text').value.trim();if(!value)return;
    send('ask',{kind:'guess',text:value});
    if(game.pending?.kind!=='guess'||game.pending.asker!==asker)return;
    const answer=correctAnswers.has(value.normalize('NFKC').toLowerCase())?'correct':'incorrect';
    respond(game.pending.id,answer);
   };
  }
  function restart(){
   cancelResponse();run++;hintOpen=false;selected=samples[0][0];
   const previousRevision=Number.isSafeInteger(game?.rev)?game.rev:0;
   window.FPR3?.cancel();closeModal();busy=false;ready=true;owner=true;me=asker;name='はる';
   draft='';filter='all';search='';order='old';renderRound='';newHistory=false;seen.clear();
   game=R.create(presenter,'まじん係（体験）');game=R.join(game,asker,'はる（体験）');game=R.join(game,friend,'あお（体験）');
   // View controllers reject older revisions even across a local demo reset.
   // Keep their clock monotonic; the new engine round still owns all scores.
   game.rev=Math.max(game.rev,previousRevision);
   demoApply(presenter,'start',{presenter,mode:'live',playMode:'cooperative',scope:'身近なものをあてよう',secretAnswer:'傘'});
   demoApply(friend,'ask',{kind:'question',text:'人が作ったもの？'});
   demoApply(presenter,'answer',{pendingId:game.pending.id,answer:'yes'});
   status='台本つき・ひとり練習';error='';broadcast();
  }
  demoBar=()=>'<section class="demo-bar compact-demo tutorial-bar"><b>質問役の練習</b><a href="home/">紹介に戻る</a><button id="demo-reset" type="button">最初から</button></section>';
  function paint(){
   document.body.classList.add('tutorial-asker-guided');
   if(responseId&&game.pending?.id!==responseId)cancelResponse();
   on('demo-reset',restart);
   if(window.FPR3?.anticipating())return;
   const done=R.done(state),scene=$('.fp-scene'),destination=done?$('.result'):scene;
   if(!destination)return;
   const left=remaining(),last=state.entries.at(-1);
   const note=document.createElement('section');note.id='tutorial-practice';note.className='tutorial-practice';
   note.setAttribute('aria-label','質問役の練習ガイド');
   let message=state.pending?'台本の相手が'+(state.pending.kind==='guess'?'判定':'回答')+'しています…':
    done?'体験できました。本番では、招待URLを送って友達と遊びます。':
    last?.answer==='incorrect'?'今回は不正解。履歴の手がかりから、もう一度答えを宣言できます。':
    left.length?'選んで送ると、台本の回答が履歴に届きます。':'手がかりがそろいました。「答えがわかった」から宣言してみよう。';
   note.innerHTML='<strong>台本つき・ひとり練習</strong><p id="tutorial-practice-status" role="status">'+message+'</p>';
   if(!done){
    const hint=document.createElement('details');hint.className='tutorial-hint';hint.open=hintOpen;
    hint.innerHTML='<summary>説明・ヒント</summary><p class="tutorial-contract">AI判定・オンライン対戦は使いません。<b>本番では友達が答えます。</b></p><p>雨の日に開いて使う「傘」です。「傘」か「かさ」と宣言してみよう。</p>';
    hint.ontoggle=()=>{if(hint.isConnected)hintOpen=hint.open;};note.append(hint);
   }else{
    const contract=document.createElement('p');contract.className='tutorial-contract';contract.textContent='AI判定・オンライン対戦を使わない台本の練習でした。本番では友達が答えます。';note.append(contract);
    const links=document.createElement('div');links.className='row tutorial-room-actions';
    links.innerHTML='<a id="tutorial-play" class="btn primary" href="./">仲間と遊ぶ・部屋をつくる →</a><a class="btn quiet" href="?demo=1&amp;role=genie">答える側も試す →</a>';
    note.append(links);on('next',restart);if($('#next'))$('#next').textContent='練習をもう一度';
   }
   destination.prepend(note);
   // A role switch would turn a guided question into a manual sandbox. The
   // free sandbox retains those controls and is unaffected by this module.
   $('#turn-to-answer')?.remove();$('#demo-nextquestion')?.remove();
   if(state.pending){
    on('cancel',()=>{cancelResponse();send('cancel',{pendingId:state.pending?.id});});
    return;
   }
   const form=$('#question-form');if(!form)return;
   const label=form.querySelector('label[for="question"]'),input=$('#question');
   if(label){label.htmlFor='tutorial-question';label.textContent='練習用の質問を選ぶ';}
   if(input){
    const select=document.createElement('select');select.id='tutorial-question';
    for(const [q]of left){const option=document.createElement('option');option.value=q;option.textContent=q;select.append(option);}
    if(left.some(([q])=>q===selected))select.value=selected;
    select.onchange=()=>{selected=select.value;};
    (input.closest('.question-input')||input).replaceWith(select);
    if(!left.length){select.hidden=true;label?.remove();}
   }
   const ask=$('#ask');if(ask){ask.type='submit';ask.onclick=null;ask.hidden=!left.length;}
   form.onsubmit=askSample;on('guess',guess);$('#guess')?.setAttribute('type','button');
  }
  render=()=>{
   const focusId=document.activeElement?.id;
   priorRender();paint();
   if(focusId==='tutorial-question')$('#tutorial-question')?.focus({preventScroll:true});
  };
  seedDemo=restart;
  window.addEventListener('pagehide',()=>{cancelResponse();run++;});
  window.addEventListener('pageshow',event=>{if(event.persisted)restart();});
  restart();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
