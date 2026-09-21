/* FINEPLAY 0.3.0 — friend preview. The demo is local and never joins a network room. */
'use strict';
const R=FPRules,$=s=>document.querySelector(s),uid=()=>{if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const demo=new URLSearchParams(location.search).get('demo')==='1';
const validRoom=s=>/^[a-f0-9-]{36}$/.test(s||'');
const P='fineplay:online:v2:',HAND='<img class="hand" src="assets/fineplay-hand.svg" alt="">';
let room=demo?'':new URLSearchParams(location.hash.slice(1)).get('r')||'',owner=false,me='',name='',token='',peer=null,conn=null,state=null,game=null,credentials={},channels=new Map(),seen=new Map();
let ready=false,busy=false,connecting=false,retryTimer=null,connectTimer=null,commandTimer=null,inflight=null,lastSeen=0,attempts=0,draft='',status='待機中',error='',filter='all',search='',order='old',renderRound='',renderCount=0,newHistory=false;
function on(id,fn){const e=$('#'+id);if(e)e.onclick=fn;}
function toast(t){$('#toast').textContent=t;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,5000);}
function modal(html){$('#modal').innerHTML=html;$('#modal').showModal();on('modal-close',closeModal);}
function closeModal(){if($('#modal').open)$('#modal').close();}
function load(k){try{return JSON.parse(sessionStorage.getItem(P+k)||'null');}catch{return null;}}
function persist(){if(demo)return;try{if(owner&&game)sessionStorage.setItem(P+'owner:'+room,JSON.stringify({game,credentials,name,me}));else if(room&&token)sessionStorage.setItem(P+'guest:'+room,JSON.stringify({name,token}));}catch{toast('このブラウザでは復帰用の保存ができません。タブを開いたまま遊んでください。');}}
function sendData(c,m){try{if(c?.open)c.send(m);}catch{}}
function broadcast(){persist();state=R.view(game,me);render();if(!demo)for(const [id,c] of channels)sendData(c,{type:'state',state:R.view(game,id)});}
function processCommand(actor,a,c){
 if(!a||typeof a.id!=='string'||a.id.length>80)return;
 const key=actor+':'+a.id;if(seen.has(key)){if(c){sendData(c,seen.get(key));sendData(c,{type:'state',state:R.view(game,actor)});}return;}
 let ack;try{game=R.apply(game,actor,a);ack={type:'ack',id:a.id,ok:true};}catch(e){ack={type:'ack',id:a.id,ok:false,error:e.message};}
 seen.set(key,ack);if(seen.size>1500)seen.delete(seen.keys().next().value);
 if(c)sendData(c,ack);else{busy=false;if(ack.ok){if(a.type==='ask')draft='';closeModal();}else toast(ack.error);}
 if(ack.ok)broadcast();else if(!c)render();
}
function send(type,extra={}){
 if(!ready||busy||!state)return;const a={...extra,type,id:uid(),roundId:state.roundId};
 if(demo||owner){processCommand(me,a,null);return;}
 busy=true;inflight={id:a.id,type};sendData(conn,{type:'command',action:a});render();clearTimeout(commandTimer);
 commandTimer=setTimeout(()=>{busy=false;inflight=null;toast('操作の確認が届きません。履歴を確認してから再操作してください。');render();},9000);
}
function resetPeer(){
 clearTimeout(retryTimer);retryTimer=null;clearTimeout(connectTimer);clearTimeout(commandTimer);inflight=null;busy=false;
 const old=peer;peer=null;conn=null;if(old){old.removeAllListeners();old.destroy();}
 channels.clear();ready=false;connecting=false;
 if(owner&&game)game.players.forEach(p=>p.online=p.id===me);
}
function retryLater(){if(demo||owner||retryTimer||attempts>=3)return;retryTimer=setTimeout(()=>{retryTimer=null;if(!ready){attempts++;connect(false);}},3500);}
function networkError(text){connecting=false;ready=false;busy=false;status='接続を確認';error=text;render();retryLater();}
let peerLibrary=null;
function ensurePeer(){
 if(window.Peer)return Promise.resolve();
 if(!peerLibrary)peerLibrary=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';s.crossOrigin='anonymous';
  const timer=setTimeout(()=>reject(new Error('通信ライブラリの読込がタイムアウトしました。')),12000);
  s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);peerLibrary=null;reject(new Error('通信ライブラリを読み込めません。'));};document.head.appendChild(s);
 });return peerLibrary;
}
async function connect(asOwner){
 if(demo||connecting)return;resetPeer();owner=asOwner;connecting=true;error='';status=owner?'部屋を開いています':'参加しています';render();
 try{await ensurePeer();}catch(e){networkError(e.message+' ページを再読み込みするか、ひとり体験をご利用ください。');return;}
 if(!connecting)return;
 peer=owner?new Peer('fineplay-v2-'+room,{debug:0}):new Peer({debug:0});const current=peer;
 connectTimer=setTimeout(()=>{if(peer===current&&!ready)networkError('接続に時間がかかっています。作成者のタブと回線を確認してください。');},20000);
 current.on('error',e=>{if(peer!==current)return;const messages={'peer-unavailable':'部屋が見つかりません。作成者がオンラインか、招待URLが合っているか確認してください。','unavailable-id':'同じ部屋が別のタブで開かれています。元のタブを使うか、少し待って再接続してください。','network':'接続サーバーにつながりません。回線を確認してください。','browser-incompatible':'このブラウザでは接続できません。通常のブラウザで開いてください。'};networkError(messages[e.type]||'接続を確立できませんでした。回線を確認し、再接続してください。');});
 current.on('disconnected',()=>{if(peer!==current)return;status='接続サーバーへ再接続中';render();try{current.reconnect();}catch{}});
 current.on('open',()=>{
  if(peer!==current)return;
  if(owner){clearTimeout(connectTimer);connecting=false;ready=true;attempts=0;status='オンライン';error='';broadcast();return;}
  const c=current.connect('fineplay-v2-'+room,{serialization:'json',reliable:true});conn=c;
  c.on('open',()=>sendData(c,{type:'hello',version:2,token,name}));
  c.on('data',m=>{
   if(c!==conn||!m||typeof m!=='object')return;
   if(m.type==='state'&&m.state?.version===2){clearTimeout(connectTimer);state=m.state;me=state.you;ready=true;connecting=false;attempts=0;error='';status='オンライン';lastSeen=Date.now();persist();render();}
   else if(m.type==='pulse'){lastSeen=Date.now();sendData(c,{type:'pong'});}
   else if(m.type==='ack'&&inflight?.id===m.id){const kind=inflight.type;inflight=null;clearTimeout(commandTimer);busy=false;if(m.ok){if(kind==='ask')draft='';closeModal();}else toast(m.error);render();}
   else if(m.type==='rejected'){attempts=3;networkError(String(m.error));c.close();}
  });
  c.on('close',()=>{if(c===conn)networkError(error||'作成者との接続が切れました。元のタブで復帰を待っています。');});
  c.on('error',()=>{if(c===conn)networkError('参加者間の通信を確立できませんでした。');});
 });
 if(owner)current.on('connection',acceptConnection);
}
function acceptConnection(c){
 let pid=null,last=0,burst=0;const timer=setTimeout(()=>{if(!pid)c.close();},12000);
 c.on('data',m=>{
  if(!m||typeof m!=='object')return;
  try{if(JSON.stringify(m).length>4000){c.close();return;}}catch{return;}
  const now=Date.now();if(now-last>1000){last=now;burst=0;}if(++burst>25){c.close();return;}
  if(!pid){if(m.type!=='hello'||m.version!==2||!validRoom(m.token))return;
   try{if(credentials[m.token]){pid=credentials[m.token];game=R.online(game,pid,true);}else{pid=uid();game=R.join(game,pid,m.name);credentials[m.token]=pid;}
    clearTimeout(timer);const old=channels.get(pid);channels.set(pid,c);if(old&&old!==c)old.close();broadcast();
   }catch(e){pid=null;sendData(c,{type:'rejected',error:e.message});setTimeout(()=>c.close(),300);}return;
  }
  if(channels.get(pid)!==c)return;if(m.type==='command')processCommand(pid,m.action,c);
 });
 c.on('close',()=>{clearTimeout(timer);if(pid&&channels.get(pid)===c){channels.delete(pid);game=R.online(game,pid,false);broadcast();}});c.on('error',()=>{});
}
setInterval(()=>{if(demo)return;if(owner&&ready){for(const c of channels.values())sendData(c,{type:'pulse'});}else if(ready&&lastSeen&&Date.now()-lastSeen>20000){networkError('作成者からの応答を待っています。');conn?.close();}},4000);
window.addEventListener('online',()=>{attempts=0;if(!demo&&!ready&&room&&name)connect(owner);});
window.addEventListener('pagehide',persist);
window.addEventListener('beforeunload',e=>{if(!demo&&owner&&ready&&channels.size){e.preventDefault();e.returnValue='';}});
const person=id=>state?.players.find(p=>p.id===id)?.name||'参加者';
const button=(id,text,cls='',off=false)=>`<button id="${id}" class="${cls}" ${busy||!ready||off?'disabled':''}>${text}</button>`;
const icon={yes:'○',no:'×',probably:'△',probablyNot:'◇',unknown:'?',correct:'○',incorrect:'×'};
const avatar=(p,i)=>`<span class="avatar a${i%4}" aria-hidden="true">${['✦','☾','❋','◇'][i%4]}</span>`;
function rail(){return `<aside class="rail"><a class="logo" href="home/" ${state?'target="_blank" rel="noopener"':''}>${HAND}<span>FINEPLAY<small>いい質問に、拍手。</small></span></a><nav aria-label="メニュー"><a class="selected" href="${demo?'?demo=1':'#main'}">${demo?'ひとり体験':'ゲームの卓'}</a><a href="guide/" target="_blank" rel="noopener">遊び方 ↗</a><button id="feedback">感想・不具合を伝える</button>${!demo?'<a href="?demo=1" target="_blank" rel="noopener">一人で画面を試す ↗</a>':'<a href="./" target="_blank" rel="noopener">本番の部屋をつくる ↗</a>'}</nav><div class="rail-copy">どんな質問から、<br>答えに近づこう。</div><img class="grove" src="assets/grove.svg" alt="星の帽子をかぶった小さなまじんが、森のランタンのそばで手を振っている"><span class="version">FRIENDS PREVIEW · 0.3</span></aside>`;}
function demoBar(){return `<section class="demo-bar"><div><b>ひとり体験</b><span>架空メンバー・この端末だけ。オンライン対戦ではありません。</span></div><div class="row"><button id="demo-answer">出題者を試す</button><button id="demo-ask">質問者を試す</button><button id="demo-result">リザルトを見る</button><button id="demo-reset">最初から</button></div></section>`;}
function header(){return `<header class="top"><div><span class="eyebrow">${state?'ROUND '+String(state.round).padStart(2,'0'):'PLAY WITH YOUR FRIENDS'}</span><h1>${state?esc(state.scope):'いつもの通話に、ひとつの謎を。'}</h1><p>${state?`出題：${esc(person(state.presenter))}　／　${state.mode==='sealed'?'FinePlayは終了後に発表':'FinePlayはその場で'}`:'人が出題、みんなで推理。音声はDiscordのまま。'}</p></div><div class="status"><span class="online-dot ${ready?'on':''}"></span>${demo?'ローカル体験':esc(status)}</div></header>`;}
function intro(){return `<section class="entry"><div class="entry-art"><img src="assets/grove.svg" alt="森のまじん"><div><span class="eyebrow">GOOD QUESTION, GOOD COMPANY.</span><h2>その一問に、<br>拍手。</h2><p>当てるまでの遠回りだって、<br>みんなでなら、いい時間。</p></div></div><div class="panel entry-form"><span class="eyebrow">${room?'JOIN YOUR FRIENDS':'MAKE A ROOM'}</span><h2>${room?'仲間の卓に入る':'今日の卓をつくる'}</h2><p>2〜12人・登録なし。作成者はPC推奨です。</p><form id="entry-form"><label for="nickname">呼ばれたい名前</label><input id="nickname" maxlength="24" required value="${esc(name)}" placeholder="ニックネーム" autocomplete="nickname"><button class="primary wide" ${connecting?'disabled':''}>${connecting?'接続しています…':room?'この卓に参加する →':'部屋をつくる →'}</button></form><div class="entry-demo"><b>今、一人でも大丈夫。</b><p>実際の操作画面で、回答・履歴・結果を試せます。</p><a class="btn" href="?demo=1">ひとりで画面を試す →</a></div><p class="small">招待URLを知る人が入室できます。仲間だけに共有してください。作成者はタブを開いたままに。</p></div></section>`;}
function settings(){const next=state.players.filter(p=>p.online);let selected=state.presenter;if(state.round)selected=next[(next.findIndex(p=>p.id===state.presenter)+1)%next.length]?.id;return `<label for="presenter">出題する人</label><select id="presenter">${next.map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('')}</select><label for="scope">お題の範囲</label><input id="scope" maxlength="80" value="${esc(state.scope)}"><label for="mode">FinePlayの発表</label><select id="mode"><option value="live">その場で拍手</option><option value="sealed" ${state.mode==='sealed'?'selected':''}>答え合わせの後</option></select>${button('start',state.round?'次のお題を始める →':'このメンバーで始める →','primary wide',next.length<2)}`;}
function members(){return `<section class="panel members"><div class="section-head"><h2>卓のメンバー</h2><span>${state.players.filter(p=>p.online).length}人</span></div><div class="roster">${state.players.map((p,i)=>`<div class="member ${p.online?'':'offline'}">${avatar(p,i)}<div><b>${esc(p.name)}${p.id===me?' <small>あなた</small>':''}</b><small>${p.id===state.presenter?'出題者':'質問者'}${p.id===state.owner?' · 部屋の作成者':''}${!p.online?' · 接続待ち':''}</small></div></div>`).join('')}</div>${!demo?button('invite','＋ 仲間を招待','wide quiet'):''}</section>`;}
function lobby(){return `<div class="lobby-grid"><section class="panel lobby"><img class="mascot" src="assets/genie.svg" alt="まじん"><span class="eyebrow">THE TABLE IS OPEN</span><h2>${state.players.filter(p=>p.online).length<2?'仲間を、待とう。':'全員そろった？'}</h2><p>招待URLをDiscordに貼ると、仲間が同じ卓に入れます。</p><div class="invite-field"><input readonly id="invite-url" aria-label="招待URL" value="${esc(inviteURL())}">${button('copylink','招待URLをコピー','primary')}</div>${owner?settings():`<p class="callout">${esc(person(state.owner))} が開始するのを待っています。</p>`}<p class="small">出題者は答えを頭か手元に。開始時に入力する必要はありません。</p></section>${members()}</div>`;}
function score(){const q=state.entries.filter(e=>e.kind==='question').length;return `<div class="score-strip"><div><span class="eyebrow">${R.done(state)?'FINAL SCORE':'QUESTIONS'}</span><b class="score-number">${String(state.entries.length).padStart(2,'0')}<small>問</small></b></div><span>質問 ${q} ＋ 解答宣言 ${state.entries.length-q}<br><small>少ない質問で、答えへ。</small></span><a class="history-jump" href="#history">履歴 ${state.entries.length}件 ↓</a></div>`;}
function scene(){const p=state.pending,isPresenter=me===state.presenter,last=state.entries.at(-1);return `<section class="panel scene"><div class="genie-line"><img src="assets/genie.svg" alt="小さなまじん"><p>${isPresenter?'いい質問には、世界を変える力がある。':'ここまでの答えから、次の一問を。'}<small>${demo?'サンプルを触って、操作を確かめてみよう。':'答えはまだ、出題者だけの秘密。'}</small></p></div><div class="question-stage"><span class="q-label">${p?'Q '+String(state.entries.length+1).padStart(2,'0'):last?'LATEST ANSWER':'NEXT QUESTION'}</span><p class="turn-who">${p?esc(person(p.asker))+' の'+(p.kind==='guess'?'解答宣言':'質問'):isPresenter?'質問を待っています':'あなたの次の一問'}</p><h2>${p?esc(p.text||'声で質問しています。'):last?esc(last.text||'声での質問（本文未記録）'):'何から、絞ろう。'}</h2>${!p&&last?`<span class="answer-chip ${last.answer}">${R.labels[last.answer]}</span>`:''}</div>${p?(isPresenter?`<div class="answer-title">${p.kind==='guess'?'答えを判定してください':'あなたの回答を選んでください'}</div><div class="answers ${p.kind==='guess'?'two':''}">${(p.kind==='guess'?['correct','incorrect']:['yes','no','probably','probablyNot','unknown']).map(k=>button('answer-'+k,`<span class="answer-icon">${icon[k]}</span><b>${R.labels[k]}</b>`,k)).join('')}</div>`:`<p class="callout">${esc(person(state.presenter))} が回答しています。</p>`):(!isPresenter?`<form id="question-form"><label for="question">質問のメモ <small>声だけでもOK。履歴を見返すなら、短く残そう。</small></label><input id="question" value="${esc(draft)}" maxlength="200" placeholder="例：天気によって出番が変わる？"><div class="row">${button('ask','この質問をする','primary grow')}${button('guess','答えがわかった','dark')}</div></form>`:`<p class="callout">質問者が「この質問をする」を押すと、回答ボタンが出ます。</p>`)}<div class="scene-tools">${p&&(isPresenter||owner||p.asker===me)?button('cancel','この質問を取り消す（0問）','quiet'):''}${!p&&isPresenter&&state.entries.length?button('undo','直前の回答を訂正','quiet'):''}${isPresenter?button('reveal','降参・お題を公開','quiet'):''}${demo&&!p?button('demo-nextquestion','次のサンプル質問','quiet'):''}</div></section>`;}
function fineplay(){const es=state.entries.filter(e=>e.votes>0),best=[...es].sort((a,b)=>b.votes-a.votes)[0];return `<section class="panel fineplay"><div class="fp-title">${HAND}<div><span class="eyebrow">GOOD QUESTIONS DESERVE A LITTLE MAGIC.</span><h2>FinePlay!</h2></div><strong>${state.hidden?'—':es.length}<small>いい質問</small></strong></div><p>${best?'「'+esc(best.text||'声での名質問')+'」':'「それ、いい質問！」を見つけたら、履歴から合図を。'}</p><span class="small">${best?esc(person(best.asker))+' · '+best.votes+'票　／　':''}${state.hidden?'他の人の票数は、答え合わせの後に発表。':'質問数からは引かず、いい質問として別に残します。'}</span></section>`;}
function result(){return `<section class="panel result"><div class="eyebrow">${state.phase==='solved'?'SOLVED — GOOD QUESTION, GREAT ANSWER.':'ROUND CLOSED'}</div><div class="result-magic"><span aria-hidden="true">✦</span><img src="assets/genie.svg" alt="よろこぶまじん"><span aria-hidden="true">✧</span></div><h2>${state.phase==='solved'?'正解！':'今回の答え'}</h2><div class="answer-reveal">${esc(state.reveal)}</div><p>ここまでの一問一問が、答えにつながった。</p><div class="row">${owner||demo?button('next','次のお題へ →','primary'):''}${button('share','Discord用の結果','dark')}${me===state.presenter&&state.phase==='solved'?button('undo','判定を訂正','quiet'):''}</div><span class="small">回答画像の自動生成は、まだありません。履歴は右側にそのまま残ります。</span></section>`;}
function historyPanel(){
 let rows=state.entries.map((e,i)=>({...e,n:i+1}));const needle=search.toLocaleLowerCase();rows=rows.filter(e=>(filter==='all'||filter==='fp'?(filter!=='fp'||e.votes>0||e.myVote):e.answer===filter)&&(!needle||[e.text,person(e.asker),R.labels[e.answer]].join(' ').toLocaleLowerCase().includes(needle)));if(order==='new')rows.reverse();
 return `<section class="panel history" id="history"><div class="section-head"><h2>ここまでの質問 <span>${state.entries.length}件</span></h2><button class="quiet" id="history-order">${order==='old'?'古い順 ↓':'新しい順 ↓'}</button></div><div class="history-filters"><input id="history-search" aria-label="履歴を検索" placeholder="質問・回答・名前で探す" value="${esc(search)}"><select id="history-filter" aria-label="履歴を絞り込む">${[['all','すべて'],['yes','はい'],['no','いいえ'],['probably','たぶんそう'],['probablyNot','たぶん違う'],['unknown','わからない'],['fp','FinePlay']].map(([v,t])=>`<option value="${v}" ${v===filter?'selected':''}>${t}</option>`).join('')}</select></div><div class="history-list" tabindex="0" aria-label="質問と回答の履歴">${rows.length?rows.map(e=>`<article class="history-item" data-entry="${esc(e.id)}"><span class="history-number">${String(e.n).padStart(2,'0')}</span><div class="history-body"><div class="history-meta"><span>${esc(person(e.asker))}${e.kind==='guess'?' · 解答宣言':''}</span><span class="answer-chip ${e.answer}">${R.labels[e.answer]}</span></div><p>${esc(e.text||'声での質問（本文未記録）')}</p><div class="history-actions">${e.kind==='question'?`<button data-vote="${esc(e.id)}" aria-pressed="${e.myVote}" class="vote ${e.myVote?'voted':''}" ${busy||!ready||e.asker===me?'disabled':''}>${HAND}<span>${e.myVote?'合図した':'FinePlay'}${e.votes?' · '+e.votes:''}${state.hidden&&e.myVote?'（発表待ち）':''}</span></button>${(me===state.presenter||e.asker===me)?`<button class="quiet" data-note="${esc(e.id)}">メモ</button>`:''}`:''}</div></div></article>`).join(''):`<p class="empty">${state.entries.length?'一致する質問がありません。':'回答すると、ここに履歴がたまっていきます。'}</p>`}</div>${newHistory?'<button id="history-latest" class="new-history">新しい履歴があります ↓</button>':''}<p class="history-note">質問・回答・誰の質問かを、いつでも確認。<br>声だけの質問は、必要なときに「メモ」で補おう。</p></section>`;
}
function render(){
 const focused=document.activeElement?.id,selection=focused?document.activeElement.selectionStart:null,list=$('.history-list'),scroll=list?.scrollTop||0,nearEnd=!list||list.scrollHeight-scroll-list.clientHeight<35;
 const fields={};for(const id of ['presenter','scope','mode'])if($('#'+id))fields[id]=$('#'+id).value;
 const sameRound=state&&state.roundId===renderRound;
 if(state&&sameRound&&state.entries.length>renderCount&&!nearEnd)newHistory=true;
 if(state&&!sameRound){filter='all';search='';newHistory=false;}
 document.body.classList.toggle('is-demo',demo);
 $('#app').innerHTML=`<div class="app-shell">${rail()}<div class="workspace" id="main">${demo?demoBar():''}${header()}${error?`<section class="error" role="alert">${esc(error)} <button id="retry">再接続</button> <a href="?demo=1" target="_blank" rel="noopener">ひとり体験 ↗</a></section>`:''}${state?(state.phase==='lobby'?lobby():`<div class="play-grid"><main class="game-column">${score()}${R.done(state)?result():scene()}${fineplay()}<p class="game-note">${demo?'体験データはこの端末だけ。本番の卓には送信されません。':owner?'あなたが部屋を支えています。タブを開いたままにしてください。':'会話はDiscord。質問・回答・FinePlayは、この卓で共有。'}</p></main><aside class="reference-column">${members()}${historyPanel()}</aside></div>`):intro()}<footer>FINEPLAY 0.3 · フレンド向け試遊版 <a href="guide/" target="_blank" rel="noopener">マニュアル ↗</a><button id="feedback-bottom" class="quiet">感想・不具合</button></footer></div></div>`;
 for(const [id,value] of Object.entries(fields))if($('#'+id))$('#'+id).value=value;
 bind();
 const newList=$('.history-list');if(newList){if(!sameRound||nearEnd){newList.scrollTop=order==='old'?newList.scrollHeight:0;}else newList.scrollTop=scroll;}
 if(focused&&$('#'+focused)&&['INPUT','TEXTAREA'].includes($('#'+focused).tagName)){const el=$('#'+focused);el.focus({preventScroll:true});try{el.setSelectionRange(selection,selection);}catch{}}
 renderRound=state?.roundId||'';renderCount=state?.entries.length||0;
}
function inviteURL(){return location.origin+location.pathname+'#r='+room;}
async function copy(text,title='コピーしてDiscordへ'){
 try{await navigator.clipboard.writeText(text);toast('コピーしました。内容を確認してDiscordに貼り付けてください。');}
 catch{modal(`<h2>${esc(title)}</h2><textarea id="copytext" rows="9" readonly>${esc(text)}</textarea><button id="modal-close">閉じる</button>`);$('#copytext').focus();$('#copytext').select();}
}
function safeDiscord(t){return String(t).replace(/[@<>|`*_\r\n]/g,c=>({'@':'＠','<':'＜','>':'＞','|':'｜','`':'｀','*':'＊','_':'＿','\n':' ','\r':' '}[c]));}
function feedback(){modal(`<h2>触ってくれて、ありがとう。</h2><p>起きたこと、うれしかったことを、いつものDiscordへ。自動送信はしません。</p><label for="report">試遊メモ</label><textarea id="report" rows="8" maxlength="2500">FINEPLAY 0.3 試遊メモ\n画面：${demo?'ひとり体験':'オンライン卓'}${state?' / '+state.phase:''}\n端末・ブラウザ：\n何をした：\nどうなった／こうなると嬉しい：\nいい質問・楽しかったところ：\n</textarea><p class="small">招待URLや個人情報、まだ公開していない答えは書かないでね。</p><div class="row"><button id="report-copy" class="primary">メモをコピー</button><button id="modal-close">閉じる</button></div>`);on('report-copy',()=>copy($('#report').value));}
function startRound(){send('start',{presenter:$('#presenter').value,scope:$('#scope').value,mode:$('#mode').value});}
function bind(){
 on('feedback',feedback);on('feedback-bottom',feedback);
 if($('#entry-form'))$('#entry-form').onsubmit=e=>{e.preventDefault();try{name=R.clean($('#nickname').value,24,true);}catch(err){toast(err.message);return;}if(room){token=load('guest:'+room)?.token||uid();persist();connect(false);}else{room=uid();me=uid();owner=true;game=R.create(me,name);state=R.view(game,me);credentials={};history.replaceState(null,'','#r='+room);persist();connect(true);}};
 on('retry',()=>{attempts=0;connect(owner);});on('start',startRound);on('copylink',()=>copy(inviteURL()));
 on('invite',()=>{modal(`<h2>仲間を招待する</h2><p>このリンクを知る人が入室できます。仲間だけに送ろう。</p><input readonly aria-label="招待URL" value="${esc(inviteURL())}"><div class="row"><button id="copy-invite" class="primary">招待URLをコピー</button><button id="modal-close">閉じる</button></div>`);on('copy-invite',()=>copy(inviteURL()));});
 if($('#question'))$('#question').oninput=e=>draft=e.target.value;
 if($('#question-form'))$('#question-form').onsubmit=e=>{e.preventDefault();send('ask',{kind:'question',text:draft});};
 on('guess',e=>{e?.preventDefault();modal('<h2>答えを宣言する</h2><p>正解でも、不正解でも1問。出題者が判定します。</p><label for="guess-text">答え</label><input id="guess-text" maxlength="200" placeholder="これが答え！"><div class="row"><button id="guess-send" class="primary">この答えを宣言する</button><button id="modal-close">戻る</button></div>');on('guess-send',()=>{if(!$('#guess-text').value.trim())return toast('答えを入力してください。');send('ask',{kind:'guess',text:$('#guess-text').value});});});
 for(const k of Object.keys(R.labels))on('answer-'+k,()=>send('answer',{pendingId:state.pending?.id,answer:k}));
 on('cancel',()=>send('cancel',{pendingId:state.pending?.id}));
 on('undo',()=>{modal('<h2>直前の回答をやり直す？</h2><p>最後の1問を回答待ちに戻します。その質問へのFinePlayは取り消されます。</p><div class="row"><button id="undo-confirm" class="primary">回答待ちに戻す</button><button id="modal-close">やめる</button></div>');on('undo-confirm',()=>send('undo'));});
 on('reveal',()=>{modal('<h2>答えを公開して終了する</h2><p>全員に答えが表示されます。質問数は増えません。</p><label for="reveal-text">答え</label><input id="reveal-text" maxlength="200"><div class="row"><button id="reveal-confirm" class="primary">公開して終了</button><button id="modal-close">戻る</button></div>');on('reveal-confirm',()=>send('reveal',{text:$('#reveal-text').value}));});
 on('next',()=>{if(demo){seedDemo();return;}modal(`<h2>次は、誰が出題する？</h2>${settings()}<button id="modal-close" class="quiet">戻る</button>`);on('start',startRound);});
 document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>{const e=state.entries.find(e=>e.id===b.dataset.vote);send('vote',{entryId:e.id,value:!e.myVote});});
 document.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>{const e=state.entries.find(e=>e.id===b.dataset.note);modal(`<h2>この質問を、残しておく。</h2><label for="note-text">質問メモ</label><textarea id="note-text" maxlength="200" rows="3">${esc(e.text)}</textarea><div class="row"><button id="note-save" class="primary">メモを保存</button><button id="modal-close">戻る</button></div>`);on('note-save',()=>send('note',{entryId:e.id,text:$('#note-text').value}));});
 if($('#history-search'))$('#history-search').oninput=e=>{search=e.target.value;render();};
 if($('#history-filter'))$('#history-filter').onchange=e=>{filter=e.target.value;render();};
 on('history-order',()=>{order=order==='old'?'new':'old';render();});
 on('history-latest',()=>{newHistory=false;search='';filter='all';render();const el=$('.history-list');el.scrollTop=order==='old'?el.scrollHeight:0;});
 on('share',()=>{const fp=state.entries.filter(e=>e.votes>0),best=[...fp].sort((a,b)=>b.votes-a.votes).slice(0,3);modal(`<h2>Discord用の結果</h2><p>内容を確認してからコピーしてください。答えと質問はネタバレ表記です。</p><textarea id="result-text" rows="10" readonly>${esc(`${demo?'【ひとり体験のサンプル結果】\n':''}FINEPLAY · ROUND ${state.round}\n${state.phase==='solved'?'正解':'未解決'} / ${state.entries.length}問\n範囲：${safeDiscord(state.scope)}\n答え：||${safeDiscord(state.reveal)}||\nFinePlay ${fp.length}問\n${best.map(e=>safeDiscord(person(e.asker))+'：||'+safeDiscord(e.text||'声での名質問')+'||（'+e.votes+'票）').join('\n')}`)}</textarea><div class="row"><button id="result-copy" class="primary">結果をコピー</button><button id="modal-close">閉じる</button></div>`);on('result-copy',()=>copy($('#result-text').value));});
 if(demo){on('demo-reset',seedDemo);on('demo-answer',()=>{me=game.presenter;broadcast();});on('demo-ask',()=>{me=game.players.find(p=>p.id!==game.presenter).id;broadcast();});on('demo-result',showDemoResult);on('demo-nextquestion',()=>{me=game.presenter;const asker=game.players.find(p=>p.id!==me).id;demoApply(asker,'ask',{kind:'question',text:'使うときに、形が変わる？'});broadcast();});}
}
function demoApply(actor,type,extra={}){game=R.apply(game,actor,{id:uid(),roundId:game.roundId,type,...extra});}
function seedDemo(){
 ready=true;owner=true;me='demo-presenter';name='まじん係';status='ローカル体験';seen.clear();filter='all';search='';order='old';draft='';renderRound='';
 game=R.create(me,name);game=R.join(game,'demo-asker-a','はる（体験用）');game=R.join(game,'demo-asker-b','あお（体験用）');demoApply(me,'start',{presenter:me,mode:'live',scope:'身近なものをあてよう'});
 [['人が作ったもの？','yes'],['食べられるもの？','no'],['片手で持てる？','yes'],['電気で動く？','no']].forEach(([text,answer],i)=>{demoApply(i%2?'demo-asker-b':'demo-asker-a','ask',{kind:'question',text});demoApply(me,'answer',{pendingId:game.pending.id,answer});});
 demoApply('demo-asker-b','vote',{entryId:game.entries[2].id,value:true});demoApply('demo-asker-a','ask',{kind:'question',text:'天気によって出番が変わる？'});broadcast();
}
function showDemoResult(){
 if(R.done(game)){broadcast();return;}me=game.presenter;
 if(game.pending)demoApply(me,'cancel',{pendingId:game.pending.id});
 demoApply(game.players.find(p=>p.id!==me).id,'ask',{kind:'guess',text:'傘'});demoApply(me,'answer',{pendingId:game.pending.id,answer:'correct'});broadcast();
}
if(demo){seedDemo();if(new URLSearchParams(location.search).get('screen')==='result')showDemoResult();}
else{
 if(room&&!validRoom(room)){error='招待リンクの形式が正しくありません。';room='';}
 const saved=room?load('owner:'+room):null,guest=room?load('guest:'+room):null;
 if(saved?.game?.version===2&&Array.isArray(saved.game.players)&&saved.game.players.some(p=>p.id===saved.me)){
  owner=true;game=saved.game;credentials=saved.credentials||{};name=saved.name;me=saved.me;game.players.forEach(p=>p.online=p.id===me);state=R.view(game,me);render();connect(true);
 }else if(guest&&validRoom(guest.token)){name=guest.name;token=guest.token;render();connect(false);}else render();
}
