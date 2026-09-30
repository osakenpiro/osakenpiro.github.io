/* FINEPLAY 0.5 — deterministic, host-authoritative rules and private projections. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FPRules=api;})(globalThis,()=>{
 'use strict';
 const labels={yes:'はい',no:'いいえ',partly:'部分的にそう',probably:'たぶんそう',probablyNot:'たぶん違う',unknown:'わからない',correct:'正解！',incorrect:'不正解'};
 const cp=x=>JSON.parse(JSON.stringify(x));
 const must=(yes,message)=>{if(!yes)throw new Error(message);};
 const clean=(v,max,required=false)=>{must(typeof v==='string','文字で入力してください。');const s=v.trim();must(s.length<=max,`${max}文字以内で入力してください。`);must(!required||s.length>0,'入力してください。');return s;};
 const done=s=>['solved','passed'].includes(s.phase);
 const person=(s,id)=>s.players.find(p=>p.id===id);
 const spectator=(s,id)=>person(s,id)?.role==='spectator';
 const unlocked=(s,id)=>!spectator(s,id)||(s.unlocked||[]).includes(id);
 const canSee=(s,id,e)=>unlocked(s,id)&&(done(s)||s.playMode!=='competitive'||id===s.presenter||spectator(s,id)||e.asker===id);
 const questionText=t=>!t||/[?？]$/.test(t.trim())?t:t+'？';
 const grade=e=>Math.max(0,...Object.values(e.ratings||{}));
 const applause=s=>Object.values(s.applause||{}).reduce((a,b)=>a+b,0);
 const defaults={preset:'casual',limit:'none',attempts:3,guessCost:1,initialPoints:3,correctPoints:3,finePoints:1,superPoints:2,comboPoints:1};
 function rules(a={}){const r={...defaults,...a};must(['casual','dead'].includes(r.preset)&&['none','count','points'].includes(r.limit),'ルールの設定が不正です。');for(const k of ['attempts','guessCost','initialPoints','correctPoints','finePoints','superPoints','comboPoints'])must(Number.isInteger(r[k])&&r[k]>=0&&r[k]<=100,'点数・回数は0〜100の整数です。');if(r.preset==='casual')r.limit='none';if(r.limit==='count')must(r.attempts>0,'解答権は1回以上にしてください。');if(r.limit==='points')must(r.guessCost>0&&r.initialPoints>=r.guessCost,'点数消費では、最初に1回は解答できる点数にしてください。');return r;}
 const count=s=>({total:s.entries.length,questions:s.entries.filter(e=>e.kind==='question').length,guesses:s.entries.filter(e=>e.kind==='guess').length,fp:s.entries.filter(e=>grade(e)>0).length,votes:s.entries.reduce((a,e)=>a+Object.keys(e.ratings||{}).length,0),problemVotes:Object.keys(s.problemRatings||{}).length,applause:applause(s)});
 function playerStats(s,p){
  const es=s.entries.filter(e=>e.asker===p.id),r=s.rules||defaults,questionVotes=es.filter(e=>e.kind==='question').reduce((a,e)=>a+Object.keys(e.ratings||{}).length,0),guessVotes=es.filter(e=>e.kind==='guess').reduce((a,e)=>a+Object.keys(e.ratings||{}).length,0),problemGrade=p.id===s.presenter?Math.max(0,...Object.values(s.problemRatings||{})):0;
  const fineplays=es.filter(e=>grade(e)===1).length+(problemGrade===1?1:0),superFineplays=es.filter(e=>grade(e)===2).length+(problemGrade===2?1:0),combos=(s.combos||[]).filter(c=>c.asker===p.id).length,used=s.guessUsed?.[p.id]||0,correct=es.filter(e=>e.answer==='correct').length;
  const earned=fineplays*r.finePoints+superFineplays*r.superPoints+combos*r.comboPoints,dead=r.preset==='dead',applausePoints=p.id===s.presenter?applause(s)/100:0,score=earned+(dead?correct*r.correctPoints-used*r.guessCost:0)+applausePoints;
  const balance=r.initialPoints+earned+correct*r.correctPoints-used*r.guessCost;
  return {id:p.id,name:p.name,presenter:p.id===s.presenter,spectator:!(s.roundPlayers||[]).includes(p.id),questions:es.filter(e=>e.kind==='question').length,guesses:es.filter(e=>e.kind==='guess').length,total:es.length,questionVotes,guessVotes,problemVotes:p.id===s.presenter?Object.keys(s.problemRatings||{}).length:0,fineplays,superFineplays,combos,used,correct,score:Math.round(score*100)/100,balance,applause:p.id===s.presenter?applause(s):0,applausePoints};
 }
 function summary(s){return {counts:count(s),players:s.players.map(p=>playerStats(s,p))};}
 function allowance(s,id){const r=s.rules||defaults,p=person(s,id),v=playerStats(s,p||{id,name:''}),can=p&&!spectator(s,id)&&id!==s.presenter;return {used:v.used,left:r.limit==='count'?Math.max(0,r.attempts-v.used):null,balance:r.limit==='points'?v.balance:null,canGuess:!!can&&(r.limit==='count'?v.used<r.attempts:r.limit==='points'?v.balance>=r.guessCost:true)};}
 function create(owner,name){return {version:3,owner,presenter:owner,players:[{id:owner,name:clean(name,24,true),online:true,role:'player'}],round:0,roundId:'lobby',roundPlayers:[],phase:'lobby',scope:'なんでも',mode:'live',playMode:'cooperative',rules:rules(),pending:null,entries:[],secretAnswer:'',attributes:[],hints:[],comments:[],combos:[],unlocked:[],guessUsed:{},problemRatings:{},applause:{},applauseId:'',reveal:'',history:[],rev:0};}
 function join(s,id,name,role='player'){name=clean(name,24,true);must(s.players.length<12,'この卓は12人までです。');must(!s.players.some(p=>p.id===id||p.name===name),'その名前は参加済みです。別の名前を使ってください。');must(['player','spectator'].includes(role),'参加方法を選んでください。');const n=cp(s);n.players.push({id,name,online:true,role:s.phase==='lobby'?role:'spectator'});n.rev++;return n;}
 function online(s,id,value){const n=cp(s),p=person(n,id);if(p)p.online=!!value;n.rev++;return n;}
 const attributeList=a=>{must(Array.isArray(a)&&a.length<=12,'属性ラベルは12個までです。');return [...new Set(a.map(x=>clean(x,30,true)))];};
 function apply(s,actor,a){
  must(a&&typeof a==='object'&&typeof a.id==='string'&&a.id.length>=8&&a.id.length<=80,'操作データが不正です。');must(person(s,actor)?.online,'接続を確認してください。');must(a.roundId===s.roundId,'お題が変わりました。画面を確認してください。');
  const n=cp(s),presenter=actor===s.presenter,owner=actor===s.owner;
  if(a.type==='start'){
   must(owner,'部屋を作った人が開始してください。');must(s.phase==='lobby'||done(s),'先に今のお題を終了してください。');must(s.players.filter(p=>p.online&&p.role==='player').length>=2,'参加者が2人以上そろったら始められます。');must(person(s,a.presenter)?.online&&!spectator(s,a.presenter),'接続中の参加者から出題者を選んでください。');must(['live','sealed'].includes(a.mode),'FinePlayの表示設定が不正です。');
   const playMode=a.playMode||'cooperative';must(['cooperative','competitive'].includes(playMode),'協力か対戦を選んでください。');const r=rules(a.rules);must(!(r.limit==='points'&&a.mode==='sealed'),'点数消費ではFinePlayを「その場で」にしてください。');
   const secretAnswer=clean(a.secretAnswer??'',200);must(!secretAnswer||actor===a.presenter,'答えを登録できるのは出題者だけです。');
   if(done(s)){n.history.push({round:s.round,scope:s.scope,reveal:s.reveal,phase:s.phase,playMode:s.playMode,...summary(s),entries:cp(s.entries),comments:cp(s.comments)});n.history=n.history.slice(-10);}
   Object.assign(n,{round:s.round+1,roundId:a.id,roundPlayers:s.players.filter(p=>p.role==='player').map(p=>p.id),presenter:a.presenter,scope:clean(a.scope,80)||'なんでも',mode:a.mode,playMode,rules:r,phase:secretAnswer?'playing':'preparing',pending:null,entries:[],secretAnswer,attributes:[],hints:[],comments:[],combos:[],unlocked:[],guessUsed:{},problemRatings:{},applause:{},applauseId:'',reveal:''});
  }else if(a.type==='role'){
   must(s.phase==='lobby'||done(s),'役割の変更は次のお題の前にできます。');must(['player','spectator'].includes(a.role),'参加方法を選んでください。');person(n,actor).role=a.role;
  }else if(a.type==='unlock'){
   must(spectator(s,actor),'観戦者だけがアンロックできます。');if(!n.unlocked.includes(actor))n.unlocked.push(actor);
  }else if(a.type==='begin'||a.type==='setAnswer'){
   must(presenter&&(a.type==='begin'?s.phase==='preparing':s.phase==='playing'),'答えを準備できるのは出題者だけです。');n.secretAnswer=clean(a.text??'',200);n.attributes=attributeList(a.attributes??s.attributes);must(n.hints.every(x=>n.attributes.includes(x)),'公開済みの属性は残してください。');if(a.type==='begin')n.phase='playing';
  }else if(a.type==='hint'){
   must(presenter&&s.phase==='playing','ヒントを出せるのは出題者だけです。');const label=clean(a.label,30,true);must(s.attributes.includes(label),'登録済みの属性を選んでください。');if(!n.hints.includes(label))n.hints.push(label);
  }else if(a.type==='ask'){
   must(s.phase==='playing','いまは質問できません。');must(!presenter&&!spectator(s,actor),'質問できるのは質問者だけです。');must(!s.pending,'いまの質問の回答を待ってください。');must(s.entries.length<250,'250問に達しました。出題者がお題を公開してください。');must(['question','guess'].includes(a.kind),'質問の種類が不正です。');const text=clean(a.text,200,a.kind==='guess');
   if(a.kind==='guess'){must(allowance(s,actor).canGuess,'解答権が足りません。質問を続けて手がかりを集めよう。');n.guessUsed[actor]=(n.guessUsed[actor]||0)+1;}
   n.pending={id:a.id,asker:actor,kind:a.kind,text,n:s.entries.length+1};
  }else if(a.type==='answer'){
   must(presenter,'回答できるのは出題者だけです。');must(s.phase==='playing'&&s.pending&&s.pending.id===a.pendingId,'この質問は回答済み、または取り消されました。');const valid=s.pending.kind==='guess'?['correct','incorrect']:['yes','no','partly','probably','probablyNot','unknown'];must(valid.includes(a.answer),'回答を選んでください。');
   n.entries.push({...s.pending,answer:a.answer,ratings:{}});n.pending=null;if(a.answer==='correct'){n.phase='solved';n.applauseId=a.id;n.reveal=s.secretAnswer||s.pending.text;}
  }else if(a.type==='cancel'){
   must(s.phase==='playing'&&s.pending&&s.pending.id===a.pendingId,'この質問は終了しています。');must(presenter||owner||s.pending.asker===actor,'自分の質問だけ取り消せます。');n.pending=null;
  }else if(a.type==='vote'||a.type==='voteProblem'){
   must(s.phase==='playing'||done(s),'開始後にFinePlayを付けられます。');const e=a.type==='vote'?n.entries.find(e=>e.id===a.entryId):null;
   must(a.type==='voteProblem'?actor!==s.presenter&&unlocked(s,actor):e&&canSee(s,actor,e)&&e.asker!==actor,'自分の投稿・非公開の履歴には投票できません。');const g=a.grade??(a.value?1:0);must([0,1,2].includes(g),'FinePlayの種類が不正です。');const ratings=e?e.ratings:n.problemRatings;delete ratings[actor];if(g)ratings[actor]=g;
  }else if(a.type==='combo'){
   must(presenter&&(s.phase==='playing'||done(s)),'コンボ認定は出題者が行います。');must(Array.isArray(a.entryIds)&&a.entryIds.length===2&&a.entryIds[0]!==a.entryIds[1],'つながった2つの質問を選んでください。');const es=a.entryIds.map(id=>s.entries.find(e=>e.id===id));must(es.every(e=>e?.kind==='question')&&es[0].asker===es[1].asker,'同じ人の2つの質問を選んでください。');const ids=es.map(e=>e.id).sort(),key=ids.join(':');must(typeof a.value==='boolean','操作データが不正です。');n.combos=n.combos.filter(c=>c.key!==key);if(a.value)n.combos.push({key,entryIds:ids,asker:es[0].asker});
  }else if(a.type==='comment'){
   const e=s.entries.find(e=>e.id===a.entryId);must(e&&canSee(s,actor,e),'コメントできる履歴がありません。');must(n.comments.length<300,'コメントはこのお題で300件までです。');n.comments.push({id:a.id,entryId:e.id,author:actor,text:clean(a.text,200,true)});
  }else if(a.type==='applaud'){
   must(a.applauseId===s.applauseId&&done(s)&&actor!==s.presenter&&unlocked(s,actor),'答え合わせの後、出題者に拍手を送れます。');must(Number.isInteger(a.count)&&a.count>=0&&a.count<=100,'拍手は1人100回までです。');n.applause[actor]=Math.max(n.applause[actor]||0,a.count);
  }else if(a.type==='note'){
   const e=n.entries.find(e=>e.id===a.entryId);must(e&&canSee(s,actor,e),'質問が見つかりません。');must(presenter||e.asker===actor,'質問者か出題者が編集してください。');must(e.kind==='question','解答宣言は変更できません。');e.text=clean(a.text,200);
  }else if(a.type==='undo'){
   must(presenter,'回答の訂正は出題者が行ってください。');must(!s.pending&&s.entries.length>0&&s.phase!=='passed','いまは訂正できません。');const e=n.entries.pop();n.pending={id:a.id,asker:e.asker,kind:e.kind,text:e.text,n:e.n};n.comments=n.comments.filter(c=>c.entryId!==e.id);n.combos=n.combos.filter(c=>!c.entryIds.includes(e.id));n.applause={};n.applauseId='';n.phase='playing';n.reveal='';
  }else if(a.type==='reveal'){
   must(presenter&&s.phase==='playing','出題者だけがお題を公開できます。');n.reveal=clean(a.text??s.secretAnswer??'',200,true);n.pending=null;n.applauseId=a.id;n.phase='passed';
  }else throw new Error('対応していない操作です。');
  n.rev++;return n;
 }
 function view(s,viewer){
  must(person(s,viewer),'参加者が見つかりません。');const locked=!unlocked(s,viewer),hidden=s.mode==='sealed'&&!done(s),es=s.entries.filter(e=>canSee(s,viewer,e)),visible=new Set(es.map(e=>e.id));
  const v={version:3,owner:s.owner,presenter:s.presenter,players:cp(s.players),round:s.round,roundId:s.roundId,phase:s.phase,scope:s.scope,mode:s.mode,playMode:s.playMode,rules:cp(s.rules),pending:s.pending?(canSee(s,viewer,s.pending)?cp(s.pending):{private:true}):null,reveal:locked?'':s.reveal,history:locked?[]:s.history.map(h=>({...cp(h),entries:h.entries.map(e=>({id:e.id,n:e.n,asker:e.asker,kind:e.kind,text:e.text,answer:e.answer,votes:Object.keys(e.ratings).length,grade:grade(e)}))})),rev:s.rev,you:viewer,hidden,spectator:spectator(s,viewer),locked,hints:cp(s.hints),hintCount:s.hints.length,progress:s.entries.length,allowance:allowance(s,viewer),
   problem:{myVote:!!s.problemRatings[viewer],myGrade:s.problemRatings[viewer]||0,votes:hidden||locked?null:Object.keys(s.problemRatings).length,grade:hidden||locked?null:Math.max(0,...Object.values(s.problemRatings))},
   entries:es.map(e=>({id:e.id,n:e.n,asker:e.asker,kind:e.kind,text:e.text,answer:e.answer,myVote:!!e.ratings[viewer],myGrade:e.ratings[viewer]||0,votes:hidden?null:Object.keys(e.ratings).length,grade:hidden?null:grade(e)})),comments:s.comments.filter(c=>visible.has(c.entryId)).map(cp),combos:hidden?[]:s.combos.filter(c=>c.entryIds.every(id=>visible.has(id))).map(cp),applauseId:s.applauseId,applause:{mine:s.applause[viewer]||0,total:locked?0:applause(s),points:locked?0:applause(s)/100}};
  if(viewer===s.presenter&&!done(s)){v.secretAnswer=s.secretAnswer;v.attributes=cp(s.attributes);}
  if(done(s)&&!locked)v.result=summary(s);
  if(!hidden&&!locked)v.myStats=playerStats(s,person(s,viewer));
  return v;
 }
 return {labels,cp,clean,done,count,summary,create,join,online,apply,view,questionText,defaults,allowance};
});
