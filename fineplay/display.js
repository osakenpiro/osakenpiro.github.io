/* Display-only proposal. Read the existing role-filtered view; never raw game state. */
(()=>{'use strict';
 const LINK='<span aria-hidden="true">↔</span>',EXPAND='<span aria-hidden="true">⤢</span>';
 const tutorialRole=demo&&new URLSearchParams(location.search).get('role')==='genie';
 const fmt=n=>String(Math.round(n*100)/100);
 const dialog=document.createElement('dialog');dialog.id='display-dialog';dialog.setAttribute('aria-labelledby','display-title');document.body.append(dialog);
 let mode='',first='',second='',large=true,returnTo=null,dialogKey='',scoreKey='',previous=new Map(),pulses=new Map(),dockScroll=0;
 const originalRender=render;
 const key=()=>state?[room,state.roundId,me,state.locked,state.hidden].join(':'):'';
 const normal=e=>e.kind==='question'&&['yes','no','partly','probably','probablyNot','unknown','personal'].includes(e.answer);
 const questions=()=>state.entries.filter(normal);
 const mayCombo=()=>me===state.presenter&&!state.locked&&!state.finalized&&!state.result?.finalized&&(state.phase==='playing'||R.done(state));
 const paired=e=>questions().some(other=>other.id!==e.id&&other.asker===e.asker);
 const comboButton=e=>mayCombo()&&normal(e)?`<button class="quiet display-combo" data-display-combo="${esc(e.id)}" ${!paired(e)||!ready||busy?'disabled':''}>${LINK} Combo</button>`:'';
 function visibleRows(){let rows=state.entries.filter(e=>(filter==='all'||(filter==='fp'?e.votes>0||e.myVote:e.answer===filter))&&(!search||[R.questionText(e.text),person(e.asker),e.answerLabel||R.labels[e.answer]].join(' ').toLocaleLowerCase().includes(search.toLocaleLowerCase())));return order==='new'?[...rows].reverse():rows;}
 function remember(){const f=document.activeElement;returnTo={x:scrollX,y:scrollY,list:$('.history-list')?.scrollTop,id:f?.id,entry:f?.dataset.displayCombo,element:f};}
 function restore(){const saved=returnTo;returnTo=null;if(!saved)return;const list=$('.history-list');if(list&&saved.list!==undefined)list.scrollTop=saved.list;const focus=saved.element?.isConnected?saved.element:saved.id?document.getElementById(saved.id):saved.entry?document.querySelector(`[data-display-combo="${CSS.escape(saved.entry)}"]`):$('#history-large');focus?.focus({preventScroll:true});scrollTo({left:saved.x,top:saved.y,behavior:'instant'});}
 dialog.addEventListener('close',()=>{mode='';dialog.innerHTML='';document.body.classList.remove('display-modal-open');restore();});
 function open(view,id=''){remember();mode=view;first=id;second='';dialogKey=key();paintDialog();dialog.showModal();document.body.classList.add('display-modal-open');}
 function paintDialog(){
  if(!mode||!state)return;
  const active=document.activeElement,focused=dialog.contains(active)?active?.id:null,selectedValue=active?.dataset.candidate,scroll=dialog.querySelector('.display-list')?.scrollTop||0;
  const close='<button id="display-close" class="quiet">戻る</button>';
  if(mode==='history'){
   const rows=visibleRows();dialog.innerHTML=`<header class="display-head"><h2 id="display-title">質問履歴 <small>${rows.length}件</small></h2>${close}</header><div class="display-toolbar"><span>${order==='old'?'古い順':'新しい順'}</span><div role="group" aria-label="文字サイズ"><button id="display-font-normal" aria-pressed="${!large}">標準</button><button id="display-font-large" aria-pressed="${large}">大きく</button></div></div><div class="display-list ${large?'display-large':''}" tabindex="0" aria-label="拡大した質問履歴">${rows.map(e=>`<article class="display-question"><div class="display-meta"><b>Q${String(e.n).padStart(2,'0')}</b><span>${esc(person(e.asker))}${e.kind==='guess'?' · 解答宣言':''}</span><span class="answer-chip ${e.answer}">${esc(e.answerLabel||R.labels[e.answer])}</span></div><p>${esc(e.kind==='question'?R.questionText(e.text)||'声での質問（本文未記録）':e.text||'声での解答')}</p>${comboButton(e)}</article>`).join('')||'<p>表示できる履歴はまだありません。</p>'}</div>`;
   dialog.querySelector('#display-font-normal').onclick=()=>{large=false;paintDialog();};dialog.querySelector('#display-font-large').onclick=()=>{large=true;paintDialog();};
  }else{
   if(!mayCombo()){dialog.close();return;}
   const es=questions();if(!es.some(e=>e.id===first))first='';const a=es.find(e=>e.id===first),candidates=a?es.filter(e=>e.id!==a.id&&e.asker===a.asker):[];if(!candidates.some(e=>e.id===second))second='';
   const b=candidates.find(e=>e.id===second),existing=b&&state.combos.some(c=>c.entryIds.includes(first)&&c.entryIds.includes(second));
   dialog.innerHTML=`<header class="display-head"><h2 id="display-title">${LINK} Combo</h2>${close}</header><label for="display-first">1問目</label><select id="display-first"><option value="">質問を選ぶ</option>${es.map(e=>`<option value="${esc(e.id)}" ${e.id===first?'selected':''}>Q${e.n} ${esc(person(e.asker))} · ${esc(R.questionText(e.text)||'声での質問')}</option>`).join('')}</select>${a?`<article class="display-anchor"><small>Q${a.n} · ${esc(person(a.asker))}</small><p>${esc(R.questionText(a.text)||'声での質問')}</p></article>`:''}<fieldset class="display-candidates"><legend>${a?esc(person(a.asker))+' のつながる質問':'2問目'}</legend><div class="display-list display-large">${candidates.map(e=>`<label class="display-choice ${e.id===second?'selected':''}"><input type="radio" name="display-second" data-candidate="${esc(e.id)}" value="${esc(e.id)}" ${e.id===second?'checked':''}><span><small>Q${e.n} · ${esc(e.answerLabel||R.labels[e.answer])}</small><span>${esc(R.questionText(e.text)||'声での質問')}</span></span></label>`).join('')||`<p>${a?'同じ質問者の別の回答済み質問はありません。':'1問目を選ぶと候補が表示されます。'}</p>`}</div></fieldset><div class="display-actions"><span class="display-recognized" role="status">${existing?'認定済み':b?'2問を選択':''}</span><button id="display-combo-save" class="primary" ${!b||existing||busy||!ready?'disabled':''}>${LINK} 認定する <small>＋${state.rules.comboPoints}</small></button><button id="display-combo-remove" class="quiet" ${!b||(!existing&&!state.hidden)||busy||!ready?'disabled':''}>認定を取り消す</button></div>`;
   dialog.querySelector('#display-first').onchange=e=>{first=e.target.value;second='';paintDialog();};dialog.querySelectorAll('[data-candidate]').forEach(input=>input.onchange=()=>{second=input.value;paintDialog();});
   const submit=value=>{if(!mayCombo()||!a||!b||a.asker!==b.asker||a.id===b.id)return;send('combo',{entryIds:[a.id,b.id],value});};dialog.querySelector('#display-combo-save').onclick=()=>submit(true);dialog.querySelector('#display-combo-remove').onclick=()=>submit(false);
  }
  dialog.querySelector('#display-close').onclick=()=>dialog.close();dialog.querySelectorAll('[data-display-combo]').forEach(b=>b.onclick=()=>{mode='combo';first=b.dataset.displayCombo;second='';paintDialog();dialog.querySelector('#display-first')?.focus({preventScroll:true});});
  const list=dialog.querySelector('.display-list');if(list)list.scrollTop=scroll;
  const next=focused?document.getElementById(focused):selectedValue?dialog.querySelector(`[data-candidate="${CSS.escape(selectedValue)}"]`):null;next?.focus({preventScroll:true});
 }
 function paintHistory(){
  $('#combo-new')?.remove();const history=$('#history');if(!history||state.locked)return;
  const head=history.querySelector('.section-head');head?.insertAdjacentHTML('afterend',`<div class="display-history-tools"><button id="history-large" class="quiet">${EXPAND} 大きく見る</button>${mayCombo()?`<button id="history-combo" class="quiet" ${!questions().some(paired)||!ready||busy?'disabled':''}>${LINK} Combo</button>`:''}</div>`);
  on('history-large',()=>open('history'));on('history-combo',()=>open('combo'));
  history.querySelectorAll('[data-entry]').forEach(row=>{const e=state.entries.find(e=>e.id===row.dataset.entry);if(e)row.querySelector('.clue-detail .row')?.insertAdjacentHTML('beforeend',comboButton(e));});
  history.querySelectorAll('[data-display-combo]').forEach(b=>b.onclick=()=>open('combo',b.dataset.displayCombo));
 }
 function publicScores(){return state.scoreTotals&&!state.locked?new Map(state.scoreTotals.players.map(p=>[p.id,p.total])):new Map();}
 function paintScores(){
  if(!state||state.phase==='lobby'||state.phase==='preparing'||state.locked||tutorialRole){$('#display-scores')?.remove();document.body.classList.remove('display-has-scores');previous.clear();pulses.clear();scoreKey='';return;}
  const scores=publicScores(),nextKey=key()+':'+state.scoreTotals?.scope,now=performance.now();if(nextKey!==scoreKey){previous.clear();pulses.clear();scoreKey=nextKey;}
  for(const [id,value]of scores){if(previous.has(id)&&value>previous.get(id))pulses.set(id,now);else if(previous.has(id)&&value<previous.get(id))pulses.delete(id);}
  previous=scores;for(const [id,start]of pulses)if(!scores.has(id)||now-start>=650)pulses.delete(id);
  const confirmed=state.scoreTotals?.scope==='confirmed',title=confirmed?'確定点':'現在点',from=state.scoreTotals?.fromRound||1,caption=confirmed&&from>1?title+'（第'+from+'題〜）':title;
  const focused=document.activeElement?.id==='display-score-list';
  let dock=$('#display-scores');if(!dock){dock=document.createElement('section');dock.id='display-scores';dock.setAttribute('aria-label',caption);document.body.append(dock);}dock.innerHTML=`<span class="display-score-title">${esc(caption)}</span><div id="display-score-list" class="display-score-list" tabindex="0" aria-label="${esc(caption)}・左右にスクロール">${state.players.filter(p=>p.role!=='spectator').map(p=>{const value=scores.get(p.id),known=Number.isFinite(value),start=pulses.get(p.id),negative=known&&value<0;return `<div class="display-score ${p.id===me?'is-me':''} ${start!==undefined?'score-added':''}" data-score-player="${esc(p.id)}" ${start!==undefined?`style="--score-delay:-${now-start}ms"`:''}><span title="${esc(p.name)}">${esc(p.name)}</span><b ${known?'':`aria-label="${esc(p.name)}の得点は未公開"`}>${known?fmt(value):'—'}<small>${known?'点':'未公開'}</small></b>${known&&Math.abs(value)>10?`<small class="display-score-overflow" title="棒の範囲は±10点">${negative?'‹':'›'}</small>`:''}<span class="display-score-track" title="±10点" aria-hidden="true"><i class="${negative?'negative':''}" style="width:${known?Math.min(10,Math.abs(value))*4:0}px;${negative?'right:50%':'left:50%'}"></i></span></div>`;}).join('')}</div>`;
  const list=dock.querySelector('.display-score-list');list.scrollLeft=dockScroll;list.onscroll=()=>{dockScroll=list.scrollLeft;};if(focused)list.focus({preventScroll:true});document.body.classList.add('display-has-scores');
 }
 render=()=>{const x=scrollX,y=scrollY;originalRender();if(state&&!tutorialRole)paintHistory();paintScores();if(dialog.open){if(!state||dialogKey!==key()||state.phase==='lobby')dialog.close();else paintDialog();}scrollTo({left:x,top:y,behavior:'instant'});};
 render();
})();
