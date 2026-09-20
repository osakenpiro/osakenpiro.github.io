/* FINEPLAY 0.2.0. No microphone, AI, analytics, or answer-before-reveal storage. */
'use strict';
const R=FPRules,$=s=>document.querySelector(s),uid=()=>crypto.randomUUID();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validRoom=s=>/^[a-f0-9-]{36}$/.test(s||'');
let room=new URLSearchParams(location.hash.slice(1)).get('r')||'',owner=false,me='',name='',token='',peer=null,conn=null,state=null,game=null,credentials={},channels=new Map(),seen=new Map(),ready=false,busy=false,connecting=false,retryTimer=null,lastSeen=0,attempts=0,draft='',status='準備できています',error='',restored=false;
const P='fineplay:online:v2:';
function load(key){try{return JSON.parse(sessionStorage.getItem(P+key)||'null');}catch{return null;}}
function store(key,x){try{sessionStorage.setItem(P+key,JSON.stringify(x));return true;}catch{message('このブラウザでは保存できません。再読み込みすると復帰できない場合があります。');return false;}}
function persist(){if(owner&&game)store('owner:'+room,{game,credentials,name,me});else if(room&&token)store('guest:'+room,{name,token});}
function message(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(message.t);message.t=setTimeout(()=>$('#toast').hidden=true,5500);}
function modal(html){$('#modal').innerHTML=html;$('#modal').showModal();}
function closeModal(){$('#modal').close();}
function on(id,fn){const e=$('#'+id);if(e)e.onclick=fn;}
function broadcast(){if(!owner||!game)return;persist();state=R.view(game,me);render();for(const [id,c] of channels){if(c.open)safeSend(c,{type:'state',state:R.view(game,id)});}}
function safeSend(c,x){try{if(c?.open)c.send(x);}catch{}}
function resetPeer(){clearTimeout(retryTimer);if(peer){peer.removeAllListeners();peer.destroy();}peer=null;conn=null;ready=false;connecting=false;}
function peerError(e){const messages={'peer-unavailable':'部屋が見つかりません。部屋を作った人がページを開いているか確認してください。','network':'接続サーバーにつながりません。少し待って再接続してください。','unavailable-id':'元のタブがまだ接続中です。少し待って再接続してください。','browser-incompatible':'このブラウザでは接続できません。通常のChrome・Edge・Safariで開いてください。','webrtc':'参加者との通信を確立できませんでした。別の回線で試してください。','server-error':'接続サーバーでエラーが発生しました。'};error=messages[e.type]||'通信が途切れました。再接続してください。';connecting=false;if(!owner){ready=false;render();scheduleRetry();}else{if(!channels.size)ready=false;render();}}
function scheduleRetry(){if(owner||retryTimer||attempts>=10)return;retryTimer=setTimeout(()=>{retryTimer=null;if(!ready){attempts++;connect(false);}},3000);}
function connect(isOwner){
 if(connecting)return;resetPeer();owner=isOwner;connecting=true;error='';status=owner?'部屋を開いています…':'部屋につないでいます…';render();
 if(typeof Peer==='undefined'){connecting=false;error='通信ライブラリを読み込めません。ページを再読み込みしてください。';render();return;}
 peer=owner?new Peer('fineplay-v2-'+room,{debug:0}):new Peer({debug:0});
 const current=peer;
 const timeout=setTimeout(()=>{if(peer===current&&connecting){connecting=false;error='接続に時間がかかっています。部屋の作成者が接続中か確認してください。';render();if(!owner)scheduleRetry();}},18000);
 peer.on('error',e=>{clearTimeout(timeout);if(peer===current)peerError(e);});
 peer.on('disconnected',()=>{if(peer!==current)return;status='接続サーバーへ再接続中';if(owner)render();try{peer.reconnect();}catch{}});
 peer.on('open',()=>{
  if(peer!==current)return;clearTimeout(timeout);
  if(owner){connecting=false;ready=true;status='オンライン';attempts=0;broadcast();}
  else{conn=peer.connect('fineplay-v2-'+room,{serialization:'json',reliable:true});const c=conn;
   const joinTimer=setTimeout(()=>{if(c===conn&&!ready){connecting=false;error='卓との通信を確立できません。作成者の接続と回線を確認してください。';render();c.close();scheduleRetry();}},18000);
   c.on('open',()=>safeSend(c,{type:'hello',version:2,token,name}));
   c.on('data',m=>{if(c!==conn||!m||typeof m!=='object')return;
    if(m.type==='state'&&m.state?.version===2){clearTimeout(joinTimer);state=m.state;me=state.you;ready=true;connecting=false;attempts=0;error='';status='オンライン';lastSeen=Date.now();persist();render();}
    else if(m.type==='pulse'){lastSeen=Date.now();safeSend(c,{type:'pong'});}
    else if(m.type==='ack'){busy=false;clearTimeout(send.timer);if(m.ok){if(send.kind==='ask')draft='';closeModal();}else message(m.error);render();}
    else if(m.type==='rejected'){error=String(m.error);attempts=10;ready=false;connecting=false;c.close();render();}
   });
   c.on('close',()=>{clearTimeout(joinTimer);if(c!==conn)return;ready=false;connecting=false;busy=false;status='接続が切れました';if(!error)error='部屋を作った人との接続を待っています。';render();scheduleRetry();});
   c.on('error',e=>{if(c===conn)peerError(e);});
  }
 });
 if(owner)peer.on('connection',acceptConnection);
}
function acceptConnection(c){
 let pid=null,last=0,burst=0;const timer=setTimeout(()=>{if(!pid)c.close();},12000);
 c.on('data',m=>{
  if(!m||typeof m!=='object')return;
  let size;try{size=JSON.stringify(m).length;}catch{return;}if(size>4000){c.close();return;}
  const now=Date.now();if(now-last>1000){last=now;burst=0;}if(++burst>25){c.close();return;}
  if(!pid){
   if(m.type!=='hello'||m.version!==2||!validRoom(m.token))return;
   try{
    if(credentials[m.token]){pid=credentials[m.token];game=R.online(game,pid,true);}
    else{pid=uid();game=R.join(game,pid,m.name);credentials[m.token]=pid;}
    clearTimeout(timer);const old=channels.get(pid);channels.set(pid,c);if(old&&old!==c)old.close();broadcast();
   }catch(e){pid=null;safeSend(c,{type:'rejected',error:e.message});setTimeout(()=>c.close(),300);}
   return;
  }
  if(channels.get(pid)!==c)return;
  if(m.type==='command')processCommand(pid,m.action,c);
 });
 c.on('close',()=>{clearTimeout(timer);if(pid&&channels.get(pid)===c){channels.delete(pid);game=R.online(game,pid,false);broadcast();}});
 c.on('error',()=>{});
}
function processCommand(actor,a,c){
 if(!a||typeof a.id!=='string')return;
 const key=actor+':'+a.id;if(seen.has(key)){if(c)safeSend(c,seen.get(key));return;}
 let ack;try{game=R.apply(game,actor,a);ack={type:'ack',id:a.id,ok:true};}catch(e){ack={type:'ack',id:a.id,ok:false,error:e.message};}
 seen.set(key,ack);if(seen.size>1500)seen.delete(seen.keys().next().value);
 if(c)safeSend(c,ack);else{busy=false;if(!ack.ok)message(ack.error);else{if(a.type==='ask')draft='';closeModal();}}
 if(ack.ok)broadcast();else if(!c)render();
}
function send(type,extra={}){
 if(!ready||busy||!state)return;const a={...extra,type,id:uid(),roundId:state.roundId};send.kind=type;
 if(owner)processCommand(me,a,null);else{busy=true;safeSend(conn,{type:'command',action:a});render();clearTimeout(send.timer);send.timer=setTimeout(()=>{busy=false;message('操作の確認が届きません。履歴を確認してから操作してください。');render();},9000);}
}
setInterval(()=>{if(owner&&ready){for(const c of channels.values())safeSend(c,{type:'pulse'});}else if(ready&&lastSeen&&Date.now()-lastSeen>18000){ready=false;status='接続を確認しています';render();conn?.close();scheduleRetry();}},4000);
window.addEventListener('online',()=>{attempts=0;if(!ready&&room&&name)connect(owner);});
window.addEventListener('pagehide',()=>persist());
window.addEventListener('beforeunload',e=>{if(owner&&ready&&channels.size){e.preventDefault();e.returnValue='';}});
const pname=id=>state?.players.find(p=>p.id===id)?.name||'参加者';
const btn=(id,text,cls='')=>`<button id="${id}" class="${cls}" ${busy||!ready?'disabled':''}>${text}</button>`;
function help(){return `<details><summary>遊び方・接続について</summary><p>Discordで話しながら遊ぶ、人間アキネーター。出題者は答えを頭か手元に保持します。質問者は「この質問をする」を押してから声で質問。文章は空欄でもOKです。</p><p>回答の5択を押すと1問。解答宣言も正誤を問わず1問。相談・取り消しは0問。FinePlayは別表彰で、質問数から引きません。自分以外の質問に1人1票。「終了後に発表」も選べます。</p><p><b>部屋を作った人は、このタブを開いたままに。</b>作成者が再読み込みした場合は接続復帰を待ちます。タブを閉じたり、スマホで休止すると卓が止まります。作成者はPC推奨。出題者の交代は可能です。</p><p>参加リンクを知る人が入室できます。仲間だけに共有してください。名前・質問・投票を参加者間で通信します。PeerJSの接続サーバーと必要時の中継を使用します。回線によって接続できない場合があります。録音・アカウント登録・AI判定はありません。</p><p>身内向けの試遊版です。本人認証ではなくブラウザ単位の参加で、厳密な不正対策や通信保証、ホスト移譲はありません。過去の卓をサーバーに保存する機能もありません。</p></details>`;}
function landing(){return `<section class="landing"><div class="pitch"><div class="eyebrow">A GOOD QUESTION CHANGES THE GAME.</div><h1>その一問に、<br><em>拍手。</em></h1><p>みんなの声で、答えに近づく。<br>当てた人だけじゃない。<br>「いい質問」をした人も、主役になる。</p><div class="steps"><span>01 話す</span><span>02 絞る</span><span>03 拍手する</span></div></div><section class="card entryform"><div class="eyebrow">${room?'JOIN YOUR FRIENDS':'LET’S PLAY'}</div><h2>${room?'仲間の卓に入る':'今日の卓をつくる'}</h2><p class="muted">${room?'名前を入れたら、同じスコアボードへ。':'部屋をつくって、招待URLをDiscordへ。'}</p><form id="entry"><label for="name">呼ばれたい名前</label><input id="name" maxlength="24" autocomplete="nickname" placeholder="ニックネーム" value="${esc(name)}" required><button type="submit" class="primary" ${connecting?'disabled':''}>${connecting?'接続しています…':room?'この卓に参加する →':'部屋をつくる →'}</button></form><p class="small">2〜12人・登録なし・マイクはDiscordのまま。</p>${error?`<p class="error" role="alert">${esc(error)}</p>`:''}${room?'<a href="./" class="small">別の卓をつくる</a>':''}${help()}</section></section>`;}
function settings(){const next=state.round?state.players[(state.players.findIndex(p=>p.id===state.presenter)+1)%state.players.length]?.id:state.presenter;return `<div class="formgrid"><div><label for="presenter">出題する人</label><select id="presenter">${state.players.filter(p=>p.online).map(p=>`<option value="${p.id}" ${p.id===next?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div><label for="mode">FinePlayの発表</label><select id="mode"><option value="live">その場で拍手</option><option value="sealed" ${state.mode==='sealed'?'selected':''}>答え合わせの後</option></select></div></div><label for="scope">お題の範囲</label><input id="scope" maxlength="80" value="${esc(state.scope)}" placeholder="例：ゲームのキャラクター">${btn('start',state.round?'次のお題を始める →':'このメンバーで始める →','primary wide')}`;}
function roomPanel(){return `<section class="card"><div class="eyebrow">THE TABLE IS OPEN</div><h2>${state.players.filter(p=>p.online).length<2?'仲間を、待とう。':'全員そろった？'}</h2><p class="muted">招待リンクを共有すると、各自の端末から入室できます。</p><div class="invite"><input id="invite" aria-label="仲間用の招待URL" readonly value="${esc(inviteURL())}">${btn('copylink','招待URLをコピー','dark')}</div>${owner?settings():`<p class="waiting">${esc(pname(state.owner))} が開始するのを待っています。</p>`}<p class="small">正解は入力せず、出題者が頭か手元に持っておこう。</p></section>`;}
function actionPanel(){
 const p=state.pending,isPresenter=state.presenter===me;
 if(R.done(state))return `<section class="card result"><div class="eyebrow">${state.phase==='solved'?'SOLVED':'ANSWER REVEALED'}</div><h2>${esc(state.reveal)}</h2><p class="muted">${state.phase==='solved'?'お見事。答えにたどり着いた。':'今回はここまで。また次のお題で。'}</p><p>質問ログから、今日のFinePlayを選ぼう。</p><div class="row">${btn('share','Discord用の結果','dark')}${owner?btn('next','次のお題へ →','primary'):''}${isPresenter&&state.phase==='solved'?btn('undo','判定を訂正','quiet'):''}</div></section>`;
 if(p)return `<section class="card turn"><div class="eyebrow">${p.kind==='guess'?'FINAL GUESS':'QUESTION ON THE TABLE'}</div><h2>${esc(pname(p.asker))} の${p.kind==='guess'?'解答宣言':'質問'}</h2><div class="currentQuestion">${esc(p.text||'声で質問しています。')}</div>${isPresenter?(p.kind==='guess'?`<div class="answers two">${btn('correct','正解！','primary')}${btn('incorrect','ちがいます')}</div>`:`<div class="answers">${Object.entries(R.labels).filter(([k])=>!['correct','incorrect'].includes(k)).map(([k,v])=>btn('answer-'+k,v,k==='yes'?'yes':k==='no'?'no':'')).join('')}</div>`):`<p class="waiting">${esc(pname(state.presenter))} の回答を待っています。</p>`}${isPresenter||owner||p.asker===me?btn('cancel','質問を取り消す（0問）','quiet'):''}</section>`;
 if(isPresenter)return `<section class="card turn"><div class="eyebrow">YOU ARE THE ANSWERER</div><h2>質問を、待とう。</h2><p class="muted">質問者がボタンを押したら、5択で答えてください。<br>正解はまだ、誰にも見せなくて大丈夫。</p><div class="row">${state.entries.length?btn('undo','直前の回答を訂正','quiet'):''}${btn('reveal','降参・お題を公開','quiet')}</div></section>`;
 return `<section class="card turn"><div class="eyebrow">YOUR NEXT QUESTION</div><h2>何から、絞ろう。</h2><label for="qtext">質問メモ <span class="muted">／ 声で話すだけなら空欄でOK</span></label><input id="qtext" maxlength="200" placeholder="それは、人が作ったもの？" value="${esc(draft)}"><div class="row">${btn('ask','この質問をする','primary grow')}${btn('guess','答えがわかった','dark')}</div><p class="small">先にボタンを押してから、Discordで質問しよう。</p></section>`;
}
function logPanel(){return `<section class="card log"><div class="sectionhead"><h3>ここまでの質問</h3><span class="eyebrow">QUESTION LOG</span></div>${state.entries.length?state.entries.map((e,i)=>`<article><span class="qnum">${String(i+1).padStart(2,'0')}</span><div class="logbody"><p>${e.kind==='guess'?'解答：':''}${esc(e.text||'声での質問')}</p><div class="meta"><span>${esc(pname(e.asker))}</span><b class="chip ${['no','incorrect','probablyNot'].includes(e.answer)?'no':''}">${R.labels[e.answer]}</b>${e.votes?`<span class="fpchip">✦ ${e.votes}拍手</span>`:''}</div>${e.kind==='question'?`<div class="logactions"><button data-vote="${e.id}" class="${e.myVote?'voted':'quiet'}" ${e.asker===me||!ready||busy?'disabled':''}>${e.myVote?'✦ 拍手した':'✦ FinePlay'}${state.hidden&&e.myVote?'（発表待ち）':''}</button>${e.asker===me||state.presenter===me?`<button data-note="${e.id}" class="quiet">メモ</button>`:''}</div>`:''}</div></article>`).reverse().join(''):'<p class="empty">まだ、まっさらな卓。<br>最初の質問をどうぞ。</p>'}</section>`;}
function sidebar(){const fp=state.entries.filter(e=>e.votes>0),best=[...fp].sort((a,b)=>b.votes-a.votes)[0];return `<aside><section class="card applause"><div class="eyebrow">GOOD QUESTIONS DESERVE APPLAUSE.</div><h2>FinePlay</h2><div class="fpnumber">${state.hidden?'—':String(fp.length).padStart(2,'0')}<span>${state.hidden?'終了後に発表':'いい質問'}</span></div><p>${best?'「'+esc(best.text||'声での名質問')+'」':state.hidden?'拍手はしまっておいて、<br>答え合わせのあとに。':'答えを当てた人だけが、<br>主役じゃない。'}</p>${best?`<p class="small">${esc(pname(best.asker))} · ${best.votes}拍手</p>`:''}</section><section class="card"><h3>卓のメンバー</h3><div class="members">${state.players.map((p,i)=>`<div class="member ${p.online?'':'offline'}"><span class="avatar">${i+1}</span><div><b>${esc(p.name)}${p.id===me?' <small>あなた</small>':''}</b><small>${p.online?(p.id===state.presenter?'出題者':'質問する人'):'接続待ち'}${p.id===state.owner?' / 部屋の作成者':''}</small></div><span class="light ${p.online?'on':''}"></span></div>`).join('')}</div></section><p class="note">${owner?'あなたが部屋の作成者です。<br>このタブを開いたままにしてください。':`部屋の作成者：${esc(pname(state.owner))}<br>作成者との接続中だけ遊べます。`}</p></aside>`;}
function render(){
 const focus=document.activeElement?.id,sel=focus&&document.activeElement.selectionStart;
 const remembered={};for(const id of ['scope','mode','presenter'])if($('#'+id))remembered[id]=$('#'+id).value;
 const online=ready?'online':connecting?'connecting':'offline';
 let body=state?`<div class="roomline"><span>ROUND <b>${String(state.round).padStart(2,'0')}</b> ${state.phase!=='lobby'?'／ '+esc(state.scope):''}</span><div class="row">${btn('invitebutton','仲間を招待','quiet')}${btn('exit','退出','quiet')}</div></div>${!ready?`<section class="notice error">${esc(error||status)} <button id="retry">再接続</button></section>`:error?`<section class="notice error">${esc(error)}</section>`:''}<div class="layout"><main>${state.phase==='lobby'?roomPanel():`<section class="scorecard"><div><span class="eyebrow">${R.done(state)?'FINAL SCORE':'QUESTIONS'}</span><div class="score">${String(state.entries.length).padStart(2,'0')}<span>問</span></div><span class="small">質問 ${state.entries.filter(e=>e.kind==='question').length} ＋ 解答宣言 ${state.entries.filter(e=>e.kind==='guess').length}</span></div><div class="last"><span class="eyebrow">${state.entries.length?'LATEST ANSWER':'LET’S BEGIN'}</span><h2>${state.entries.length?R.labels[state.entries.at(-1).answer]:'一問で、変わる。'}</h2><p>${esc(state.entries.at(-1)?.text||'いい質問で、候補を絞っていこう。')}</p></div></section>${actionPanel()}${logPanel()}`}</main>${sidebar()}</div><section class="bottomhelp">${help()}</section>`:landing();
 $('#app').innerHTML=`<div class="shell"><header><div><a class="brand" href="./">FINE<span>PLAY</span></a><p>いい質問に、拍手。</p></div><span class="connection ${online}"><i></i>${state?esc(status):'FOR DISCORD FRIENDS'}</span></header>${body}<footer><span>FINEPLAY 0.2 · 人間同士の推理クイズ</span><span>話すのはDiscord。ここはみんなの卓。</span></footer></div>`;
 for(const [id,value] of Object.entries(remembered))if($('#'+id))$('#'+id).value=value;
 bind();if(focus&&$('#'+focus)&&['INPUT','TEXTAREA'].includes($('#'+focus).tagName)){const e=$('#'+focus);e.focus({preventScroll:true});try{e.setSelectionRange(sel,sel);}catch{}}
}
function inviteURL(){return location.origin+location.pathname+'#r='+room;}
async function clipboard(text){try{await navigator.clipboard.writeText(text);message('コピーしました。Discordに貼り付けてください。');}catch{modal(`<h2>コピーして仲間へ</h2><textarea id="copyText" rows="6" readonly>${esc(text)}</textarea><button id="closemodal">閉じる</button>`);on('closemodal',closeModal);$('#copyText').select();}}
function startFromForm(){send('start',{presenter:$('#presenter').value,mode:$('#mode').value,scope:$('#scope').value});}
function bind(){
 if($('#entry'))$('#entry').onsubmit=e=>{e.preventDefault();try{name=R.clean($('#name').value,24,true);}catch(err){message(err.message);return;}
  if(room){token=load('guest:'+room)?.token||uid();persist();connect(false);}
  else{room=uid();me=uid();owner=true;game=R.create(me,name);state=R.view(game,me);credentials={};history.replaceState(null,'','#r='+room);persist();connect(true);}
 };
 on('retry',()=>{attempts=0;connect(owner);});on('copylink',()=>clipboard(inviteURL()));
 on('invitebutton',()=>{modal(`<h2>仲間を招待する</h2><p>このリンクを知る人が入室できます。仲間だけに送ろう。</p><input id="roomurl" readonly value="${esc(inviteURL())}"><button id="docopy" class="primary">招待URLをコピー</button><button id="closemodal" class="quiet">閉じる</button>`);on('docopy',()=>clipboard(inviteURL()));on('closemodal',closeModal);});
 on('start',startFromForm);on('ask',()=>send('ask',{kind:'question',text:draft}));if($('#qtext'))$('#qtext').oninput=e=>draft=e.target.value;
 on('guess',()=>{modal('<h2>答えを宣言する</h2><p>解答宣言も1問。出題者が正誤を判定します。</p><label for="gtext">これが答え！</label><input id="gtext" maxlength="200" placeholder="答えを入力"><button id="gsubmit" class="primary">この答えを宣言する</button><button id="closemodal" class="quiet">戻る</button>');on('gsubmit',()=>{if(!$('#gtext').value.trim())return message('答えを入力してください。');send('ask',{kind:'guess',text:$('#gtext').value});});on('closemodal',closeModal);});
 for(const key of ['yes','no','probably','probablyNot','unknown','correct','incorrect'])on(['correct','incorrect'].includes(key)?key:'answer-'+key,()=>send('answer',{answer:key,pendingId:state.pending?.id}));
 on('cancel',()=>send('cancel',{pendingId:state.pending?.id}));
 on('undo',()=>{modal('<h2>直前の回答をやり直す？</h2><p>最後の1問を回答待ちに戻します。その質問へのFinePlayは取り消されます。</p><button id="confirmundo" class="primary">回答待ちに戻す</button><button id="closemodal" class="quiet">やめる</button>');on('confirmundo',()=>send('undo'));on('closemodal',closeModal);});
 on('reveal',()=>{modal('<h2>答えを公開して終了する</h2><p>質問数は増やしません。全員に答えが見えるようになります。</p><label for="rtext">今回の答え</label><input id="rtext" maxlength="200"><button id="rsubmit" class="primary">公開して終了</button><button id="closemodal" class="quiet">戻る</button>');on('rsubmit',()=>send('reveal',{text:$('#rtext').value}));on('closemodal',closeModal);});
 document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>{const e=state.entries.find(e=>e.id===b.dataset.vote);send('vote',{entryId:e.id,value:!e.myVote});});
 document.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>{const e=state.entries.find(e=>e.id===b.dataset.note);modal(`<h2>いい質問を、残そう。</h2><textarea id="ntext" maxlength="200" rows="3">${esc(e.text)}</textarea><button id="nsubmit" class="primary">メモを保存</button><button id="closemodal" class="quiet">戻る</button>`);on('nsubmit',()=>send('note',{entryId:e.id,text:$('#ntext').value}));on('closemodal',closeModal);});
 on('next',()=>{modal(`<h2>次は、誰が出題する？</h2>${settings()}<button id="closemodal" class="quiet">戻る</button>`);on('start',startFromForm);on('closemodal',closeModal);});
 on('share',()=>{const safe=t=>String(t).replace(/[@<>|`*_\r\n]/g,c=>({'@':'＠','<':'＜','>':'＞','|':'｜','`':'｀','*':'＊','_':'＿','\n':' ','\r':' '}[c]));const fp=state.entries.filter(e=>e.votes>0),best=[...fp].sort((a,b)=>b.votes-a.votes).slice(0,3);clipboard(`FINEPLAY · ROUND ${state.round}\n${state.phase==='solved'?'正解':'未解決'} / ${state.entries.length}問\n範囲：${safe(state.scope)}\n答え：||${safe(state.reveal)}||\nFinePlay ${fp.length}問\n${best.map(e=>`${safe(pname(e.asker))}：||${safe(e.text||'声での名質問')}||（${e.votes}拍手）`).join('\n')}`);});
 on('exit',()=>{modal(`<h2>${owner?'卓を閉じますか？':'この卓を出ますか？'}</h2><p>${owner?'作成者が退出すると、全員の卓が止まります。':'このタブの参加情報を消して退出します。'}</p><button id="doexit" class="dark">退出する</button><button id="closemodal" class="quiet">戻る</button>`);on('doexit',()=>{ready=false;resetPeer();try{sessionStorage.removeItem(P+(owner?'owner:':'guest:')+room);}catch{}location.href=location.pathname;});on('closemodal',closeModal);});
}
if(room&&!validRoom(room)){error='招待リンクの形式が正しくありません。';room='';}
if(room){const saved=load('owner:'+room),guest=load('guest:'+room);if(saved?.game?.version===2){owner=true;game=saved.game;credentials=saved.credentials||{};name=saved.name;me=saved.me;game.players.forEach(p=>p.online=p.id===me);state=R.view(game,me);restored=true;}else if(guest){name=guest.name;token=guest.token;}}
render();
// On recovery, keep only the original owner role; a guest never elects itself host.
if(restored)connect(true);else if(room&&name&&token)connect(false);
