/* FINEPLAY whole version: host-authoritative rules, schema-preserving migration. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FPRules=api;})(globalThis,()=>{
const Legacy=(()=>{
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
 const defaults={preset:'casual',limit:'none',attempts:3,costModel:'staged',guessCost:1,initialPoints:3,correctPoints:3,finePoints:1,superPoints:2,comboPoints:1};
 function rules(a={}){const r={...defaults,...a};must(['flat','staged'].includes(r.costModel),'解答の減点方式を選んでください。');must(['casual','dead'].includes(r.preset)&&['none','count','points'].includes(r.limit),'ルールの設定が不正です。');for(const k of ['attempts','guessCost','initialPoints','correctPoints','finePoints','superPoints','comboPoints'])must(Number.isInteger(r[k])&&r[k]>=0&&r[k]<=100,'点数・回数は0〜100の整数です。');if(r.preset==='casual')r.limit='none';if(r.limit==='count')must(r.attempts>0,'解答権は1回以上にしてください。');if(r.limit==='points')must(r.guessCost>0&&(r.costModel==='staged'||r.initialPoints>=r.guessCost),'点数消費では基本消費を1以上にし、定額式では初回分の持ち点を用意してください。');return r;}
 const count=s=>({total:s.entries.length,questions:s.entries.filter(e=>e.kind==='question').length,guesses:s.entries.filter(e=>e.kind==='guess').length,fp:s.entries.filter(e=>grade(e)>0).length,votes:s.entries.reduce((a,e)=>a+Object.keys(e.ratings||{}).length,0),problemVotes:Object.keys(s.problemRatings||{}).length,applause:applause(s)});
 // Missing costModel denotes an existing 0.5 round; keep its flat costs intact.
 function guessCost(s,attempt){const r=s.rules||defaults;if(r.preset==='casual')return 0;return r.costModel==='staged'?(attempt<=3?0:attempt<=6?r.guessCost:2*r.guessCost):r.guessCost;}
 function guessPenalty(s,used){const r=s.rules||defaults;if(r.preset==='casual')return 0;return r.costModel==='staged'?(Math.min(3,Math.max(0,used-3))+2*Math.max(0,used-6))*r.guessCost:used*r.guessCost;}
 function playerStats(s,p){
  const es=s.entries.filter(e=>e.asker===p.id),r=s.rules||defaults,questionVotes=es.filter(e=>e.kind==='question').reduce((a,e)=>a+Object.keys(e.ratings||{}).length,0),guessVotes=es.filter(e=>e.kind==='guess').reduce((a,e)=>a+Object.keys(e.ratings||{}).length,0),problemGrade=p.id===s.presenter?Math.max(0,...Object.values(s.problemRatings||{})):0;
  const fineplays=es.filter(e=>grade(e)===1).length+(problemGrade===1?1:0),superFineplays=es.filter(e=>grade(e)===2).length+(problemGrade===2?1:0),combos=(s.combos||[]).filter(c=>c.asker===p.id).length,used=s.guessUsed?.[p.id]||0,correct=es.filter(e=>e.answer==='correct').length;
  const earned=fineplays*r.finePoints+superFineplays*r.superPoints+combos*r.comboPoints,dead=r.preset==='dead',penalty=guessPenalty(s,used),applausePoints=p.id===s.presenter?applause(s)/100:0,score=earned+(dead?correct*r.correctPoints-penalty:0)+applausePoints;
  const balance=r.initialPoints+earned+correct*r.correctPoints-penalty;
  return {id:p.id,name:p.name,presenter:p.id===s.presenter,spectator:!(s.roundPlayers||[]).includes(p.id),questions:es.filter(e=>e.kind==='question').length,guesses:es.filter(e=>e.kind==='guess').length,total:es.length,questionVotes,guessVotes,problemVotes:p.id===s.presenter?Object.keys(s.problemRatings||{}).length:0,fineplays,superFineplays,combos,used,correct,guessPenalty:penalty,score:Math.round(score*100)/100,balance,applause:p.id===s.presenter?applause(s):0,applausePoints};
 }
 function summary(s){return {counts:count(s),players:s.players.map(p=>playerStats(s,p))};}
 // A compact confirmed ledger survives the ten-topic history cap. Old saves
 // recover only retained history and expose its starting round explicitly.
 const roundTotal=n=>Math.round(n*100)/100;
 function addCompleted(ledger,players){for(const p of players)if(!p.spectator)ledger.totals[p.id]=roundTotal((ledger.totals[p.id]||0)+p.score);return ledger;}
 function completedLedger(s){if(s.completedScores)return cp(s.completedScores);const hs=s.history||[],ledger={fromRound:hs[0]?.round||Math.max(1,s.round),totals:{}};for(const h of hs)addCompleted(ledger,h.players||[]);return ledger;}
 function scoreTotals(s,viewer){if(!unlocked(s,viewer))return null;const current=s.playMode==='cooperative'&&s.mode==='live',ledger=current?null:completedLedger(s);if(ledger&&done(s))addCompleted(ledger,summary(s).players);return {scope:current?'current':'confirmed',fromRound:current?s.round:ledger.fromRound,players:s.players.filter(p=>p.role!=='spectator').map(p=>({id:p.id,total:current?playerStats(s,p).score:ledger.totals[p.id]||0}))};}
 function allowance(s,id){const r=s.rules||defaults,p=person(s,id),v=playerStats(s,p||{id,name:''}),nextCost=guessCost(s,v.used+1),can=p&&!spectator(s,id)&&id!==s.presenter;return {used:v.used,nextCost,freeLeft:r.preset==='dead'&&r.costModel==='staged'?Math.max(0,3-v.used):null,left:r.limit==='count'?Math.max(0,r.attempts-v.used):null,balance:r.limit==='points'?v.balance:null,canGuess:!!can&&(r.limit==='count'?v.used<r.attempts:r.limit==='points'?v.balance>=nextCost:true)};}
 function create(owner,name){return {version:3,owner,presenter:owner,players:[{id:owner,name:clean(name,24,true),online:true,role:'player'}],round:0,roundId:'lobby',roundPlayers:[],nextPlayers:[],completedScores:{fromRound:1,totals:{}},phase:'lobby',scope:'なんでも',mode:'live',playMode:'cooperative',rules:rules(),pending:null,entries:[],secretAnswer:'',attributes:[],hints:[],comments:[],combos:[],unlocked:[],guessUsed:{},problemRatings:{},applause:{},applauseId:'',reveal:'',history:[],rev:0};}
 function join(s,id,name,role='player'){name=clean(name,24,true);must(s.players.length<12,'この卓は12人までです。');must(!s.players.some(p=>p.id===id||p.name===name),'その名前は参加済みです。別の名前を使ってください。');must(['player','spectator'].includes(role),'参加方法を選んでください。');const n=cp(s);n.players.push({id,name,online:true,role:s.phase==='lobby'?role:'spectator'});n.rev++;return n;}
 function online(s,id,value){const n=cp(s),p=person(n,id);if(p)p.online=!!value;n.rev++;return n;}
 const attributeList=a=>{must(Array.isArray(a)&&a.length<=12,'属性ラベルは12個までです。');return [...new Set(a.map(x=>clean(x,30,true)))];};
 function apply(s,actor,a){
  must(a&&typeof a==='object'&&typeof a.id==='string'&&a.id.length>=8&&a.id.length<=80,'操作データが不正です。');must(person(s,actor)?.online,'接続を確認してください。');must(a.roundId===s.roundId,'お題が変わりました。画面を確認してください。');
  const n=cp(s),presenter=actor===s.presenter,owner=actor===s.owner;
  if(a.type==='start'){
   must(owner,'部屋を作った人が開始してください。');must(s.phase==='lobby'||done(s),'先に今のお題を終了してください。');const queued=new Set(s.nextPlayers||[]);for(const p of n.players)if(p.online&&p.role==='spectator'&&queued.has(p.id))p.role='player';must(n.players.filter(p=>p.online&&p.role==='player').length>=2,'参加者が2人以上そろったら始められます。');must(person(n,a.presenter)?.online&&!spectator(n,a.presenter),'接続中の参加者から出題者を選んでください。');must(['live','sealed'].includes(a.mode),'FinePlayの表示設定が不正です。');
   const playMode=a.playMode||'cooperative';must(['cooperative','competitive'].includes(playMode),'協力か対戦を選んでください。');const r=rules(a.rules);must(!(r.limit==='points'&&a.mode==='sealed'),'点数消費ではFinePlayを「その場で」にしてください。');
   const secretAnswer=clean(a.secretAnswer??'',200);must(!secretAnswer||actor===a.presenter,'答えを登録できるのは出題者だけです。');
   if(done(s)){n.completedScores=addCompleted(completedLedger(s),summary(s).players);n.history.push({round:s.round,scope:s.scope,reveal:s.reveal,phase:s.phase,playMode:s.playMode,...summary(s),entries:cp(s.entries),comments:cp(s.comments)});n.history=n.history.slice(-10);}
   Object.assign(n,{round:s.round+1,roundId:a.id,roundPlayers:n.players.filter(p=>p.role==='player').map(p=>p.id),nextPlayers:(s.nextPlayers||[]).filter(id=>person(n,id)?.role==='spectator'),presenter:a.presenter,scope:clean(a.scope,80)||'なんでも',mode:a.mode,playMode,rules:r,phase:secretAnswer?'playing':'preparing',pending:null,entries:[],secretAnswer,attributes:[],hints:[],comments:[],combos:[],unlocked:[],guessUsed:{},problemRatings:{},applause:{},applauseId:'',reveal:''});
  }else if(a.type==='joinNext'){
   must(spectator(s,actor)&&s.round>0&&(s.phase==='preparing'||s.phase==='playing'||done(s)),'観戦中に次のゲームへの参加を予約できます。');must(typeof a.value==='boolean','参加予約の設定が不正です。');n.nextPlayers=(n.nextPlayers||[]).filter(id=>id!==actor);if(a.value)n.nextPlayers.push(actor);
  }else if(a.type==='role'){
   must(s.phase==='lobby'||done(s),'役割の変更は次のお題の前にできます。');must(['player','spectator'].includes(a.role),'参加方法を選んでください。');person(n,actor).role=a.role;n.nextPlayers=(n.nextPlayers||[]).filter(id=>id!==actor);
  }else if(a.type==='unlock'){
   must(spectator(s,actor),'観戦者だけがアンロックできます。');if(!n.unlocked.includes(actor))n.unlocked.push(actor);
  }else if(a.type==='begin'||a.type==='setAnswer'){
   must(presenter&&(a.type==='begin'?s.phase==='preparing':s.phase==='playing'),'答えを準備できるのは出題者だけです。');n.secretAnswer=clean(a.text??'',200);n.attributes=attributeList(a.attributes??s.attributes);must(n.hints.every(x=>n.attributes.includes(x)),'公開済みの属性は残してください。');if(a.type==='begin')n.phase='playing';
  }else if(a.type==='hint'||a.type==='unhint'){
   must(presenter&&s.phase==='playing','ヒントを出せるのは出題者だけです。');const label=clean(a.label,30,true);must(s.attributes.includes(label),'登録済みの属性を選んでください。');if(a.type==='unhint')n.hints=n.hints.filter(x=>x!==label);else if(!n.hints.includes(label))n.hints.push(label);
  }else if(a.type==='ask'){
   must(s.phase==='playing','いまは質問できません。');must(!presenter&&!spectator(s,actor),'質問できるのは質問者だけです。');must(!s.pending,'いまの質問の回答を待ってください。');must(s.entries.length<250,'250問に達しました。出題者がお題を公開してください。');must(['question','guess'].includes(a.kind),'質問の種類が不正です。');const text=clean(a.text,200,a.kind==='guess');
   if(a.kind==='guess'){must(allowance(s,actor).canGuess,'解答権が足りません。質問を続けて手がかりを集めよう。');n.guessUsed[actor]=(n.guessUsed[actor]||0)+1;}
   n.pending={id:a.id,asker:actor,kind:a.kind,text,n:s.entries.length+1};
  }else if(a.type==='answer'){
   must(presenter,'回答できるのは出題者だけです。');must(s.phase==='playing'&&s.pending&&s.pending.id===a.pendingId,'この質問は回答済み、または取り消されました。');const valid=s.pending.kind==='guess'?['correct','incorrect']:['yes','no','partly','probably','probablyNot','unknown','personal'];must(valid.includes(a.answer),'回答を選んでください。');
   n.entries.push({...s.pending,answer:a.answer,ratings:{}});n.pending=null;if(a.answer==='correct'){n.phase='solved';n.applauseId=a.id;n.reveal=s.secretAnswer||s.pending.text;}
  }else if(a.type==='cancel'){
   must(s.phase==='playing'&&s.pending&&s.pending.id===a.pendingId,'この質問は終了しています。');must(presenter||owner||s.pending.asker===actor,'自分の質問だけ取り消せます。');n.pending=null;
  }else if(a.type==='vote'||a.type==='voteProblem'){
   must(s.phase==='playing'||done(s),'開始後にFinePlayを付けられます。');const e=a.type==='vote'?n.entries.find(e=>e.id===a.entryId):null;
   must(a.type==='voteProblem'?actor!==s.presenter&&unlocked(s,actor):e&&canSee(s,actor,e)&&e.asker!==actor,'自分の投稿・非公開の履歴には投票できません。');const g=a.grade??(a.value?1:0);must([0,1,2].includes(g),'FinePlayの種類が不正です。');const ratings=e?e.ratings:n.problemRatings;delete ratings[actor];if(g)ratings[actor]=g;
  }else if(a.type==='combo'){
   must(presenter&&(s.phase==='playing'||done(s)),'コンボ認定は出題者が行います。');must(Array.isArray(a.entryIds)&&a.entryIds.length===2&&a.entryIds[0]!==a.entryIds[1],'つながった2つの質問を選んでください。');const es=a.entryIds.map(id=>s.entries.find(e=>e.id===id));must(es.every(e=>e?.kind==='question')&&es[0].asker===es[1].asker,'同じ人の2つの質問を選んでください。');const ids=es.map(e=>e.id).sort(),key=ids.join(':');must(typeof a.value==='boolean','操作データが不正です。');n.combos=n.combos.filter(c=>c.key!==key);if(a.value)n.combos.push({key,entryIds:ids,asker:es[0].asker});
  }else if(a.type==='comment'){
   const e=s.entries.find(e=>e.id===a.entryId);must(e&&canSee(s,actor,e),'コメントできる履歴がありません。');must(n.comments.length<300,'コメントはこのお題で300件までです。');n.comments.push({id:a.id,entryId:e.id,author:actor,at:Date.now(),seq:n.rev+1,text:clean(a.text,200,true)});
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
  const v={version:3,owner:s.owner,presenter:s.presenter,players:cp(s.players),round:s.round,roundId:s.roundId,joiningNext:(s.nextPlayers||[]).includes(viewer),...(viewer===s.owner?{nextPlayers:cp(s.nextPlayers||[])}:{}),phase:s.phase,scope:s.scope,mode:s.mode,playMode:s.playMode,rules:cp(s.rules),pending:s.pending?(canSee(s,viewer,s.pending)?cp(s.pending):{private:true}):null,reveal:locked?'':s.reveal,history:locked?[]:s.history.map(h=>({...cp(h),entries:h.entries.map(e=>({id:e.id,n:e.n,asker:e.asker,kind:e.kind,text:e.text,answer:e.answer,votes:Object.keys(e.ratings).length,grade:grade(e)}))})),rev:s.rev,you:viewer,hidden,spectator:spectator(s,viewer),locked,hints:cp(s.hints),hintCount:s.hints.length,progress:s.entries.length,allowance:allowance(s,viewer),
   problem:{myVote:!!s.problemRatings[viewer],myGrade:s.problemRatings[viewer]||0,votes:hidden||locked?null:Object.keys(s.problemRatings).length,grade:hidden||locked?null:Math.max(0,...Object.values(s.problemRatings))},
   entries:es.map(e=>({id:e.id,n:e.n,asker:e.asker,kind:e.kind,text:e.text,answer:e.answer,myVote:!!e.ratings[viewer],myGrade:e.ratings[viewer]||0,votes:hidden?null:Object.keys(e.ratings).length,grade:hidden?null:grade(e)})),comments:s.comments.filter(c=>visible.has(c.entryId)).map(cp),combos:hidden?[]:s.combos.filter(c=>c.entryIds.every(id=>visible.has(id))).map(cp),applauseId:s.applauseId,applause:{mine:s.applause[viewer]||0,total:locked?0:applause(s),points:locked?0:applause(s)/100}};
  if(viewer===s.presenter&&!done(s)){v.secretAnswer=s.secretAnswer;v.attributes=cp(s.attributes);}
  if(done(s)&&!locked)v.result=summary(s);
  v.scoreTotals=scoreTotals(s,viewer);
  if(!hidden&&!locked)v.myStats=playerStats(s,person(s,viewer));
  return v;
 }
 return {labels,cp,clean,done,count,summary,create,join,online,apply,view,questionText,defaults,allowance,guessCost,guessPenalty};
})();
 'use strict';
 const cp=Legacy.cp, must=(ok,message)=>{if(!ok)throw new Error(message);}, person=(s,id)=>s.players.find(p=>p.id===id);
 const isNew=s=>s.rulesSchema===2, done=Legacy.done, own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const difficultyLabels={easy:'やさしめ',normal:'ふつう',hard:'むずかしめ',expert:'超むずかしめ'};
 const difficultyActions=['requestDifficulty','setDifficulty','publishDifficulty','retractDifficulty'];
 const participant=(s,id)=>(s.roundPlayers||[]).includes(id)&&person(s,id)?.role==='player';
 const unlocked=(s,id)=>person(s,id)?.role!=='spectator'||(s.unlocked||[]).includes(id);
 const eligible=(s,id)=>participant(s,id)&&id!==s.presenter;
 const see=(s,id,e)=>unlocked(s,id)&&(done(s)||s.playMode!=='competitive'||id===s.presenter||person(s,id)?.role==='spectator'||e.asker===id);
 const cents=n=>Math.round(n*100)/100;
 const FP_RULE='distinct-donors/1',FP_CONTRACT='fineplay-fp/3';
 const automatic=s=>s.fpRuleVersion===FP_RULE;
 // Membership is independent of temporary connectivity. Old entries retain
 // their original topic roster; new questions freeze formal members at ask time.
 const fpRoster=(s,e=null)=>e?.fpRoster||s.fpRoster||s.roundPlayers||[];
 const fpPublic=s=>done(s)||(s.mode==='live'&&s.playMode==='cooperative');
 function fpTarget(s,e=null){return {scope:e?'question':'topic',roundId:s.roundId,rewardId:e?(e.rewardId||e.id):s.roundId,entryId:e?e.id:null,recipientId:e?e.asker:s.presenter};}
 function honors(s,e=null){
  const target=fpTarget(s,e),roster=fpRoster(s,e),eligibleIds=roster.filter(id=>id!==target.recipientId),ratings=e?e.ratings:s.problemRatings;
  const ballots=Object.entries(ratings||{}).filter(([id,g])=>eligibleIds.includes(id)&&Number.isInteger(g)&&g>=1&&g<=3);
  const donorCount=ballots.length,eligibleDonorCount=eligibleIds.length,normalStars=ballots.reduce((n,[,g])=>n+g,0),superBonus=5*Math.max(0,donorCount-1),ultra=eligibleDonorCount>=2&&donorCount===eligibleDonorCount,ultraBonus=ultra?20:0;
  return {target,donorCount,eligibleDonorCount,normalStars,normalPoints:normalStars,superBonus,ultraBonus,bonusPoints:superBonus+ultraBonus,score:normalStars+superBonus+ultraBonus,super:donorCount>=2,ultra};
 }
 function fpEvents(s){
  const targets=[],events=[];if(!automatic(s)||!fpPublic(s))return {targets,events};
  for(const e of [null,...s.entries.filter(e=>e.kind==='question')]){const h=honors(s,e);if(!h.super)continue;const targetRef=targets.length;
   targets.push({target:h.target,donorCount:h.donorCount,eligibleDonorCount:h.eligibleDonorCount,totalBonus:h.bonusPoints});
   const add=(stage,threshold,amount)=>events.push({targetRef,stage,threshold,amount});
   for(let threshold=2;threshold<=h.donorCount;threshold++)add('super',threshold,5);if(h.ultra)add('ultra',h.eligibleDonorCount,20);
  }return {targets,events};
 }
 function resolveFPEvents(v){
  must(v&&Array.isArray(v.fpEvents),'FP event projection is unavailable.');
  if(v.fpContractVersion!==FP_CONTRACT)return cp(v.fpEvents);
  must(Array.isArray(v.fpEventTargets)&&v.fpEventTargets.length<=251,'FP target dictionary is unavailable.');
  if(v.locked||!fpPublic(v)){must(v.fpEvents.length===0&&v.fpEventTargets.length===0,'Private FP events must be empty.');return [];}
  const targets=v.fpEventTargets,keys=new Set();for(const h of targets){const t=h?.target;must(t&&t.roundId===v.roundId&&['question','topic'].includes(t.scope)&&typeof t.rewardId==='string','FP target reference is inconsistent.');
   must(Number.isInteger(h.donorCount)&&Number.isInteger(h.eligibleDonorCount)&&h.donorCount>=2&&h.donorCount<=h.eligibleDonorCount&&h.eligibleDonorCount<=11,'FP donor counts are inconsistent.');
   const key=JSON.stringify([t.roundId,t.scope,t.rewardId]);must(!keys.has(key),'Duplicate FP target identity.');keys.add(key);
   const visible=t.scope==='topic'?v.problem?.honors:v.entries.find(e=>e.id===t.entryId&&e.asker===t.recipientId)?.honors;
   must(visible&&canonical(visible.target)===canonical(t)&&visible.donorCount===h.donorCount&&visible.eligibleDonorCount===h.eligibleDonorCount&&visible.bonusPoints===h.totalBonus,'FP target reference is unavailable.');
  }
  const ids=new Set();return v.fpEvents.map(e=>{must(Number.isInteger(e.targetRef)&&e.targetRef>=0&&e.targetRef<targets.length,'FP event target reference is unavailable.');const h=targets[e.targetRef],target=h.target;
   must((e.stage==='super'&&Number.isInteger(e.threshold)&&e.threshold>=2&&e.threshold<=h.donorCount&&e.amount===5)||(e.stage==='ultra'&&h.eligibleDonorCount>=2&&h.donorCount===h.eligibleDonorCount&&e.threshold===h.eligibleDonorCount&&e.amount===20),'FP stage is inconsistent.');
   const id='fp1:'+JSON.stringify([target.roundId,target.scope,target.rewardId,e.stage,e.threshold]);must(!ids.has(id),'Duplicate FP event identity.');ids.add(id);
   return {id,contractVersion:FP_CONTRACT,target:cp(target),stage:e.stage,donorCount:h.donorCount,eligibleDonorCount:h.eligibleDonorCount,threshold:e.threshold,amount:e.amount,totalBonus:h.totalBonus,reveal:'public'};
  });
 }
 function fpVoteInfo(s,e){const h=honors(s,e);return {count:h.donorCount,stars:h.normalStars,score:h.score,normalCount:h.donorCount,superCount:h.super?1:0,ultraCount:h.ultra?1:0,normalStars:h.normalStars,normalPoints:h.normalPoints,superBonus:h.superBonus,ultraBonus:h.ultraBonus,bonusPoints:h.bonusPoints};}
 const slots=[{id:'search',label:'検索',enabled:true,cost:1},{id:'aiHint',label:'AIヒント',enabled:true,cost:1},{id:'attribute',label:'属性のお願い',enabled:true,cost:1},{id:'custom',label:'お助け',enabled:false,cost:1}];
 const defaults={...Legacy.defaults,correctPoints:15,superPoints:5,freeGuessQuota:3,applausePoints:1,customAnswerLabel:'おれのなかではそう',lifelines:cp(slots)};
 const labels={...Legacy.labels,personal:defaults.customAnswerLabel};
 function rules(input={}){
  const r={...defaults,...input};
  must(['casual','dead'].includes(r.preset)&&['none','count','points'].includes(r.limit)&&['flat','staged'].includes(r.costModel),'ルールの設定が不正です。');
  for(const k of ['attempts','guessCost','initialPoints','correctPoints','finePoints','superPoints','comboPoints','freeGuessQuota','applausePoints'])must(Number.isInteger(r[k])&&r[k]>=0&&r[k]<=100,'点数・回数は0〜100の整数です。');
  if(r.preset==='casual')r.limit='none';if(r.limit==='count')must(r.attempts>0,'解答上限は1回以上です。');
  r.customAnswerLabel=Legacy.clean(r.customAnswerLabel,30,true);
  must(!input.lifelines||(Array.isArray(input.lifelines)&&input.lifelines.length===4),'お助けは4枠です。');
  r.lifelines=slots.map(def=>{const x=input.lifelines?.find(x=>x.id===def.id)||def;must(typeof x.enabled==='boolean'&&Number.isInteger(x.cost)&&x.cost>=0&&x.cost<=100,'お助けの費用は0〜100の整数です。');return {id:def.id,label:Legacy.clean(x.label,30,true),enabled:x.enabled,cost:x.cost};});
  return r;
 }
 const emptyCategories=()=>({fineplayReceived:{count:0,stars:0,score:0,normalCount:0,superCount:0,ultraCount:0,normalStars:0,normalPoints:0,superBonus:0,ultraBonus:0,bonusPoints:0},applauseReceived:{count:0,score:0},questions:0,guesses:0,correct:0,combos:0,score:0});
 function addCategories(to,x){for(const k of ['questions','guesses','correct','combos','score'])to[k]=cents((to[k]||0)+(x[k]||0));for(const k of ['fineplayReceived','applauseReceived'])for(const [key,value]of Object.entries(x[k]||{}))to[k][key]=cents((to[k][key]||0)+value);return to;}
 function migrate(input){
  const s=cp(input);must(s&&s.version===3&&Array.isArray(s.players),'保存された部屋の形式を確認してください。');
  if(!s.difficulty)s.difficulty={epoch:s.round||0,requests:[],value:null,published:false};
  if(!s.rulesSchema)s.rulesSchema=1;
  s.rules=s.rules||cp(Legacy.defaults);s.roundPlayers=s.roundPlayers||s.players.filter(p=>p.role!=='spectator').map(p=>p.id);
  if(!s.guessQuotaUsed)s.guessQuotaUsed=cp(s.guessUsed||{});
  for(const [key,value]of Object.entries({nextPlayers:[],hints:[],publicHelpHints:[],attributes:[],comments:[],combos:[],unlocked:[],problemRatings:{},applause:{},guessUsed:{},history:[],hypotheses:[],freeAnswerRequests:[],lifelineRequests:[],discussion:[],reactions:[],postgameThreads:{},freeAnswers:{},wallets:{},walletCredits:{},actionReceipts:{},finalizedRoundIds:[],awardTotals:{},achievementTotals:{},cycle:null,cycleResult:null,lastFinalized:null}))if(s[key]===undefined)s[key]=cp(value);
  // Unsubmitted drafts belong to the player's browser, never to host state.
  // No frozen/deployed schema1 base had hypothesis drafts. This also removes
  // drafts stored by the provisional 1.0/1.1 preview engine on restore.
  s.hypotheses=s.hypotheses.filter(h=>h.submitted===true);
  // Existing requests were paid at send time. Never reserve or debit them again.
  for(const q of s.lifelineRequests)if(q.paymentVersion===undefined){q.paymentVersion=1;q.payment='charged';q.charged=true;}
  // Earlier receipt billing exposed public replies before requester receipt.
  // Preserve paid/legacy hints, but withdraw unpaid offers before projection.
  const unpaidHints=new Set(s.lifelineRequests.filter(q=>q.paymentVersion===2&&!q.charged&&q.public).map(q=>q.text));
  const paidHints=new Set(s.lifelineRequests.filter(q=>q.charged&&q.public&&q.status==='resolved').map(q=>q.text));
  s.publicHelpHints=s.publicHelpHints.filter(h=>!unpaidHints.has(h)||paidHints.has(h));
  for(const q of s.lifelineRequests)if(q.paymentVersion===2&&q.payment==='released'){q.text='';q.public=false;}
  if(done(s))releaseLifelines(s);
  for(const [key,receipt]of Object.entries(s.actionReceipts)){const a=JSON.parse(receipt);if(a.type==='deleteHypothesis'||(a.type==='hypothesis'&&!s.hypotheses.some(h=>h.id===a.id&&h.text===a.text)))delete s.actionReceipts[key];}
  if(!s.completedScores){const hs=s.history||[];s.completedScores={fromRound:hs[0]?.round||Math.max(1,s.round),totals:{}};for(const h of hs)for(const p of h.players||[])if(!p.spectator)s.completedScores.totals[p.id]=cents((s.completedScores.totals[p.id]||0)+(p.score||0));}
  if(!s.awardCoverage)s.awardCoverage={fromRound:Math.max(1,s.round+(s.rulesSchema===1?1:0)),partial:s.round>0};
  return s;
 }
 function voteInfo(r,values){const ns=Object.values(values||{});return {count:ns.length,stars:ns.reduce((a,b)=>a+b,0),normalCount:ns.filter(x=>x!==5).length,superCount:ns.filter(x=>x===5).length,score:ns.reduce((a,b)=>a+(b===5?r.superPoints:b*r.finePoints),0)};}
 const legacyGrade=values=>Object.values(values||{}).includes(5)?2:Object.keys(values||{}).length?1:0;
 function playerStats(s,p){
  if(!isNew(s))return Legacy.summary(s).players.find(x=>x.id===p.id);
  const es=s.entries.filter(e=>e.asker===p.id),r=s.rules,qs=es.filter(e=>e.kind==='question'),gs=es.filter(e=>e.kind==='guess');
  const fineplayReceived={count:0,stars:0,score:0,normalCount:0,superCount:0,...(automatic(s)?{ultraCount:0,normalStars:0,normalPoints:0,superBonus:0,ultraBonus:0,bonusPoints:0}:{})};
  for(const e of qs){const v=automatic(s)?fpVoteInfo(s,e):voteInfo(r,e.ratings);for(const k of Object.keys(fineplayReceived))fineplayReceived[k]+=v[k];}
  if(p.id===s.presenter){const v=automatic(s)?fpVoteInfo(s,null):voteInfo(r,s.problemRatings);for(const k of Object.keys(fineplayReceived))fineplayReceived[k]+=v[k];}
  const combos=s.combos.filter(c=>c.asker===p.id).length,correct=gs.filter(e=>e.answer==='correct').length,applause=p.id===s.presenter?Object.values(s.applause).reduce((a,b)=>a+b,0):0;
  const applausePoints=applause*r.applausePoints,score=fineplayReceived.score+combos*r.comboPoints+correct*r.correctPoints+applausePoints;
  return {id:p.id,name:p.name,presenter:p.id===s.presenter,spectator:!s.roundPlayers.includes(p.id),questions:qs.length,guesses:gs.length,total:es.length,questionVotes:qs.reduce((a,e)=>a+Object.keys(e.ratings||{}).length,0),guessVotes:0,problemVotes:p.id===s.presenter?Object.keys(s.problemRatings).length:0,fineplays:qs.filter(e=>automatic(s)?honors(s,e).donorCount>0:legacyGrade(e.ratings)===1).length+(p.id===s.presenter&&(automatic(s)?honors(s).donorCount>0:legacyGrade(s.problemRatings)===1)?1:0),superFineplays:automatic(s)?fineplayReceived.superCount:qs.filter(e=>legacyGrade(e.ratings)===2).length+(p.id===s.presenter&&legacyGrade(s.problemRatings)===2?1:0),...(automatic(s)?{ultraFineplays:fineplayReceived.ultraCount}:{}),combos,used:s.guessUsed[p.id]||0,correct,guessPenalty:0,score,balance:s.wallets[p.id]?.balance||0,applause,applausePoints,fineplayReceived,applauseReceived:{count:applause,score:applausePoints}};
 }
 function count(s){if(!isNew(s))return Legacy.count(s);return {...Legacy.count(s),fp:s.entries.filter(e=>e.kind==='question'&&Object.keys(e.ratings||{}).length>0).length};}
 function achievements(s){
  const awards=[];for(const p of s.players){const x=playerStats(s,p);if(!x||x.spectator)continue;const push=(code,value=1)=>awards.push({playerId:p.id,code,value});
   if(x.questions)push('firstQuestion');if(x.fineplays)push('fineplay',x.fineplays);if(x.superFineplays)push('superFineplay',x.superFineplays);if(x.ultraFineplays)push('ultraFineplay',x.ultraFineplays);
   if(x.correct){push('correctGuess',x.correct);if(count(s).questions<=10)push('tenQuestionsOrFewer');}if(x.applause>=100)push('hundredApplause');
  }return awards;
 }
 function summary(s){return {...(isNew(s)?{counts:count(s),players:s.players.map(p=>playerStats(s,p))}:Legacy.summary(s)),round:s.round,roundId:s.roundId,phase:s.phase,finalized:false,achievements:achievements(s)};}
 function ensureWallet(s,id){if(!own(s.wallets,id))s.wallets[id]={balance:s.rules.initialPoints,spent:0};return s.wallets[id];}
 function credit(s,id,key,value){if(!s.roundPlayers.includes(id))return;const full=id+'|'+s.roundId+'|'+key,old=s.walletCredits[full]||0;if(value>old){ensureWallet(s,id).balance=cents(ensureWallet(s,id).balance+value-old);s.walletCredits[full]=value;}}
 function reconcileWallet(s){
  const desired={};const want=(id,key,value)=>{if(s.roundPlayers.includes(id)&&value>0)desired[JSON.stringify([id,s.roundId,key])]=cents(value);};
  if(fpPublic(s)){
   for(const e of [null,...s.entries.filter(e=>e.kind==='question')]){const h=honors(s,e),key=JSON.stringify([h.target.scope,h.target.rewardId]);want(h.target.recipientId,'normal:'+key,h.normalPoints);want(h.target.recipientId,'bonus:'+key,h.bonusPoints);}
   for(const c of s.combos){const key=c.entryIds.map(id=>{const e=s.entries.find(e=>e.id===id);return e?.rewardId||id;}).sort();want(c.asker,'combo:'+JSON.stringify(key),s.rules.comboPoints);}
  }
  for(const e of s.entries.filter(e=>e.answer==='correct'))want(e.asker,'correct',s.rules.correctPoints);
  for(const [id,taps]of Object.entries(s.applause))want(s.presenter,'applause:'+JSON.stringify(id),taps*s.rules.applausePoints);
  const deltas={};for(const key of new Set([...Object.keys(s.walletCredits),...Object.keys(desired)])){const [id]=JSON.parse(key);deltas[id]=cents((deltas[id]||0)+(desired[key]||0)-(s.walletCredits[key]||0));}
  for(const [id,delta]of Object.entries(deltas)){const w=ensureWallet(s,id),net=cents(w.balance-(w.debt||0)+delta);w.balance=Math.max(0,net);w.debt=Math.max(0,-net);}
  s.walletCredits=desired;
 }
 function syncWallet(s){if(!isNew(s))return;for(const id of s.roundPlayers)ensureWallet(s,id);
  if(automatic(s)){reconcileWallet(s);return;}
  // Sealed/private ratings become spendable only after the topic is public.
  if((s.mode==='live'&&s.playMode==='cooperative')||done(s)){
   for(const e of s.entries.filter(e=>e.kind==='question'))for(const [v,g]of Object.entries(e.ratings||{}))credit(s,e.asker,'vote:'+(e.rewardId||e.id)+':'+v,g===5?s.rules.superPoints:g*s.rules.finePoints);
   for(const [v,g]of Object.entries(s.problemRatings))credit(s,s.presenter,'problem:'+v,g===5?s.rules.superPoints:g*s.rules.finePoints);
   for(const c of s.combos){const key=c.entryIds.map(id=>{const e=s.entries.find(e=>e.id===id);return e?.rewardId||id;}).sort().join(':');credit(s,c.asker,'combo:'+key,s.rules.comboPoints);}
  }
  for(const e of s.entries.filter(e=>e.answer==='correct'))credit(s,e.asker,'correct',s.rules.correctPoints);
  for(const [v,taps]of Object.entries(s.applause))credit(s,s.presenter,'applause:'+v,taps*s.rules.applausePoints);
 }
 const held=q=>q.paymentVersion===2&&q.payment==='reserved'&&q.charged===false&&['pending','resolved'].includes(q.status);
 function reserved(s,id){return cents(s.lifelineRequests.filter(q=>q.actor===id&&held(q)).reduce((sum,q)=>sum+q.cost,0));}
 function available(s,id){return Math.max(0,cents((s.wallets[id]?.balance??s.rules.initialPoints)-reserved(s,id)));}
 function releaseLifelines(s){for(const q of s.lifelineRequests)if(held(q)){q.status='expired';q.payment='released';q.text='';q.public=false;}}
 // A funded reservation remains an obligation if a later FP withdrawal reduces
 // the wallet. Charge the confirmed receipt through the existing debt ledger;
 // new paid operations still cannot use those held or revoked points.
 function chargeLifeline(s,q){const w=ensureWallet(s,q.actor),net=cents(w.balance-(w.debt||0)-q.cost);w.balance=Math.max(0,net);w.debt=Math.max(0,-net);w.spent=cents(w.spent+q.cost);q.payment='charged';q.charged=true;q.receivedRev=s.rev+1;}
 function spend(s,id,cost){const w=ensureWallet(s,id);must(available(s,id)>=cost,'持ち点が足りません。無料の解答をお願いできます。');w.balance=cents(w.balance-cost);w.spent=cents(w.spent+cost);}
 function guessCost(s,attempt){if(!isNew(s))return Legacy.guessCost(s,attempt);return attempt<=s.rules.freeGuessQuota?0:s.rules.guessCost;}
 function allowance(s,id){if(!isNew(s))return {...Legacy.allowance(s,id),grantedFree:0};const used=s.guessUsed[id]||0,quotaUsed=s.guessQuotaUsed[id]||0,grantedFree=s.freeAnswers[id]||0,nextCost=grantedFree>0?0:guessCost(s,quotaUsed+1),balance=s.wallets[id]?.balance??s.rules.initialPoints,left=s.rules.limit==='count'?Math.max(0,s.rules.attempts-used):null;
  return {used,nextCost,freeLeft:Math.max(0,s.rules.freeGuessQuota-quotaUsed),grantedFree,left,balance,reserved:reserved(s,id),available:available(s,id),canGuess:eligible(s,id)&&(grantedFree>0||left===null||left>0)&&available(s,id)>=nextCost};
 }
 function cycleAwards(c){const categories=[['fineplayReceived','stars'],['applauseReceived','count'],['questions',null],['correct',null],['combos',null]],out=[];for(const [key,metric]of categories){const value=id=>metric?c.totals[id]?.[key]?.[metric]||0:c.totals[id]?.[key]||0,best=Math.max(0,...c.order.map(value));if(best>0)out.push({code:key,metric:metric||'count',value:best,playerIds:c.order.filter(id=>value(id)===best)});}return out;}
 function finishCycle(s){const c=s.cycle;if(!c||c.status!=='active'||c.roster.some(id=>!c.completed.includes(id)&&!c.skipped.some(x=>x.playerId===id)))return;
  c.status='complete';const ordered=c.order.map((id,i)=>({id,order:i,score:c.totals[id]?.score||0})).sort((a,b)=>b.score-a.score||a.order-b.order);
  s.cycleResult={id:c.id,roster:cp(c.roster),roundIds:cp(c.roundIds),skipped:cp(c.skipped),totals:cp(c.totals),podium:ordered.map(x=>({playerId:x.id,name:person(s,x.id)?.name||x.id,score:x.score,rank:1+ordered.filter(y=>y.score>x.score).length})),awards:cycleAwards(c),finalized:true};
 }
 function finalize(s){
  if(!done(s)||s.finalizedRoundIds.includes(s.roundId))return;
  releaseLifelines(s);syncWallet(s);const snap={...summary(s),rulesSchema:s.rulesSchema,...(automatic(s)?{fpRuleVersion:s.fpRuleVersion,fpRoster:cp(s.fpRoster),presenter:s.presenter,problemHonors:honors(s)}:{}),finalized:true,cutoffRev:s.rev,scope:s.scope,reveal:s.reveal,playMode:s.playMode,entries:cp(s.entries),comments:cp(s.comments),discussion:cp(s.discussion)};
  for(const p of snap.players.filter(p=>!p.spectator)){
   s.completedScores.totals[p.id]=cents((s.completedScores.totals[p.id]||0)+p.score);
   if(isNew(s)){if(!own(s.awardTotals,p.id))s.awardTotals[p.id]=emptyCategories();addCategories(s.awardTotals[p.id],p);}
   if(s.cycle?.status==='active'){const c=s.cycle;if(!c.order.includes(p.id))c.order.push(p.id);if(!own(c.totals,p.id))c.totals[p.id]=emptyCategories();addCategories(c.totals[p.id],p);}
  }
  if(isNew(s))for(const a of snap.achievements){if(!own(s.achievementTotals,a.playerId))s.achievementTotals[a.playerId]={};const t=s.achievementTotals[a.playerId];t[a.code]=(t[a.code]||0)+a.value;}
  s.finalizedRoundIds.push(s.roundId);s.lastFinalized=snap;s.history.push(snap);s.history=s.history.slice(-10);saveThread(s);
  if(s.cycle?.status==='active'){const c=s.cycle;c.roundIds.push(s.roundId);if(!c.completed.includes(s.presenter))c.completed.push(s.presenter);finishCycle(s);}
 }
 function saveThread(s){s.postgameThreads[s.roundId]={comments:cp(s.comments),discussion:cp(s.discussion),reactions:cp(s.reactions)};const kept=new Set(s.history.map(h=>h.roundId));for(const id of Object.keys(s.postgameThreads))if(!kept.has(id)&&id!==s.roundId)delete s.postgameThreads[id];}
 function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
 function apply(input,actor,a){
  must(a&&typeof a==='object'&&typeof a.id==='string'&&a.id.length>=8&&a.id.length<=80,'操作データが不正です。');
  let s=migrate(input);const key=actor+':'+a.id,fingerprint=canonical(a);
  // Check the topic/phase before replay receipts, including after reconnect.
  if(difficultyActions.includes(a.type)){
   must(person(s,actor)?.online&&a.roundId===s.roundId&&a.difficultyEpoch===s.difficulty.epoch&&a.phase===s.phase,'お題・段階が変わりました。画面を確認してください。');
   must(a.type==='requestDifficulty'?s.phase==='preparing':['preparing','playing'].includes(s.phase),'この段階では難易度を変更できません。');
   must(a.type==='requestDifficulty'?eligible(s,actor):actor===s.presenter,'難易度を操作する権限がありません。');
  }
  if(own(s.actionReceipts,key)){must(s.actionReceipts[key]===fingerprint,'同じ操作IDの内容が変わりました。');return s;}
  must(person(s,actor)?.online,'接続を確認してください。');must(a.roundId===s.roundId,'お題が変わりました。画面を確認してください。');
  must(a.type!=='deleteHypothesis'&&!(a.type==='hypothesis'&&a.hypothesisId!==undefined),'未提出の仮説は端末内で編集してください。選んだ仮説だけ提出できます。');
  must(!s.finalizedRoundIds.includes(s.roundId)||['start','finalize','role','joinNext','cycleSkip','unlock','comment','discussion','react'].includes(a.type),'このお題は得点確定済みです。拍手・評価の受付は終了しました。');
  must(Object.keys(s.actionReceipts).length<12000||['start','finalize'].includes(a.type),'操作数の上限です。次のお題へ進んでください。');
  if(automatic(s)&&['ask','undo'].includes(a.type))must(!Object.values(s.actionReceipts).some(receipt=>{const prior=JSON.parse(receipt);return prior.id===a.id&&['ask','undo'].includes(prior.type);}),'Question action IDs must be unique across participants.');
  const presenter=actor===s.presenter,owner=actor===s.owner,n=cp(s);syncWallet(n);
  if(difficultyActions.includes(a.type)){
   if(a.type==='requestDifficulty'){
    for(const field of ['actor','requesterId','playerId'])must(a[field]===undefined||a[field]===actor,'自分の希望だけ変更できます。');
    must(a.value===null||(typeof a.value==='string'&&own(difficultyLabels,a.value)),'難易度を選んでください。');
    n.difficulty.requests=n.difficulty.requests.filter(q=>q.actor!==actor);
    if(a.value!==null)n.difficulty.requests.push({actor,value:a.value});
   }else if(a.type==='setDifficulty'){
    must(a.value===null||(typeof a.value==='string'&&own(difficultyLabels,a.value)),'難易度を選んでください。');
    if(a.value!==n.difficulty.value)n.difficulty.published=false;
    n.difficulty.value=a.value;
   }else{
    must(s.phase==='playing','難易度の公開・撤回は開始後にできます。');
    must(a.type!=='publishDifficulty'||n.difficulty.value!==null,'難易度は未設定です。');
    n.difficulty.published=a.type==='publishDifficulty';
   }
  }else if(a.type==='finalize'){
   must((owner||presenter)&&done(s),'作成者か出題者が答え合わせ後に確定できます。');finalize(n);
  }else if(a.type==='start'){
   must(owner,'部屋を作った人が開始してください。');must(s.phase==='lobby'||done(s),'先に今のお題を終えてください。');finalize(n);
   const queued=new Set(n.nextPlayers);for(const p of n.players)if(p.online&&p.role==='spectator'&&queued.has(p.id))p.role='player';
   const players=n.players.filter(p=>p.online&&p.role==='player');must(players.length>=2,'参加者が2人以上そろったら始められます。');must(players.some(p=>p.id===a.presenter),'接続中の参加者から出題者を選んでください。');
   if(n.cycle?.status==='active'){for(const id of n.cycle.roster)if(!n.cycle.completed.includes(id)&&!n.cycle.skipped.some(x=>x.playerId===id)&&(!person(n,id)?.online||person(n,id)?.role!=='player'))n.cycle.skipped.push({playerId:id,reason:person(n,id)?.online?'spectator':'offline'});finishCycle(n);}
   if(!n.cycle||n.cycle.status==='complete')n.cycle={id:'cycle:'+a.id,roster:players.map(p=>p.id),completed:[],skipped:[],pending:[],status:'active',roundIds:[],totals:{},order:players.map(p=>p.id)};
   const c=n.cycle;must(c.roster.includes(a.presenter)&&!c.completed.includes(a.presenter)&&!c.skipped.some(x=>x.playerId===a.presenter),'この一巡でまだ出題していない人を選んでください。');
   const r=rules(a.rules),secretAnswer=Legacy.clean(a.secretAnswer??'',200);must(!secretAnswer||actor===a.presenter,'答えを登録できるのは出題者だけです。');must(['live','sealed'].includes(a.mode),'FinePlayの発表を選んでください。');const playMode=a.playMode||'cooperative';must(['cooperative','competitive'].includes(playMode),'協力か対戦を選んでください。');
   Object.assign(n,{rulesSchema:2,fpRuleVersion:FP_RULE,fpRoster:players.map(p=>p.id),rules:r,round:s.round+1,roundId:a.id,roundPlayers:players.map(p=>p.id),nextPlayers:n.nextPlayers.filter(id=>person(n,id)?.role==='spectator'),presenter:a.presenter,scope:Legacy.clean(a.scope??'',80)||'なんでも',mode:a.mode,playMode,phase:secretAnswer?'playing':'preparing',pending:null,entries:[],secretAnswer,attributes:[],hints:[],publicHelpHints:[],comments:[],combos:[],unlocked:[],guessUsed:{},guessQuotaUsed:{},problemRatings:{},applause:{},applauseId:'',reveal:'',hypotheses:[],freeAnswerRequests:[],lifelineRequests:[],discussion:[],reactions:[],freeAnswers:{},walletCredits:{}});
   // Keep start receipts across one boundary; older commands fail roundId validation.
   n.difficulty={epoch:s.difficulty.epoch+1,requests:[],value:null,published:false};
   n.actionReceipts={};for(const [k,v]of Object.entries(s.actionReceipts))if(JSON.parse(v).type==='start'&&JSON.parse(v).id===s.roundId)n.actionReceipts[k]=v;
   for(const p of players)ensureWallet(n,p.id);
  }else if(a.type==='cycleSkip'){
   must(owner&&(s.phase==='lobby'||done(s))&&n.cycle?.status==='active','作成者が次のお題の前に出題順を調整できます。');const c=n.cycle;
   must(c.roster.includes(a.playerId)&&!c.completed.includes(a.playerId)&&!(a.playerId===s.presenter&&s.round>0&&!s.finalizedRoundIds.includes(s.roundId)),'まだ始まっていない未出題の参加者を選んでください。');
   if(!c.skipped.some(x=>x.playerId===a.playerId))c.skipped.push({playerId:a.playerId,reason:Legacy.clean(a.reason??'host',80)});finishCycle(n);
  }else if(a.type==='react'){
   must((s.phase==='playing'||done(s))&&unlocked(s,actor),'質問開始後にリアクションできます。');must(['clap','heart','thanks'].includes(a.reaction)&&typeof a.value==='boolean','リアクションを選んでください。');
   const entryId=a.entryId??null;if(entryId!==null){const e=s.entries.find(e=>e.id===entryId);must(e&&see(s,actor,e),'この質問にはリアクションできません。');}
   n.reactions=n.reactions.filter(x=>!(x.actor===actor&&x.entryId===entryId&&x.reaction===a.reaction));if(a.value)n.reactions.push({entryId,reaction:a.reaction,actor});
  }else if(['hypothesis','submitHypotheses','reviewHypothesis','requestFreeAnswer','grantFreeAnswer','useLifeline','resolveLifeline','receiveLifeline','cancelLifeline','rejectLifeline','discussion'].includes(a.type)){
   must(isNew(s),'新しいお助けは次のお題から使えます。');
   if(a.type==='discussion'){
    must((s.phase==='playing'||done(s))&&unlocked(s,actor),'質問開始後にコメントできます。');must(n.discussion.length<300,'コメントは300件までです。');n.discussion.push({id:a.id,author:actor,text:Legacy.clean(a.text,200,true),seq:n.rev+1});
   }else{
    must(s.phase==='playing','お助け・属性の検討は質問中に使えます。');
    if(a.type==='reviewHypothesis'){
     must(presenter,'属性の確認は出題者が行います。');const h=n.hypotheses.find(h=>h.id===a.hypothesisId);must(h&&h.submitted,'提出された属性を選んでください。');must(['confirmed','wrong'].includes(a.verdict),'確認か「違う」を選んでください。');h.verdict=a.verdict;h.reviewedBy=actor;
    }else if(a.type==='grantFreeAnswer'){
     must(presenter,'出題者だけが無料の解答を許可できます。');const q=n.freeAnswerRequests.find(q=>q.id===a.requestId);must(q,'お願いが見つかりません。');if(q.status==='pending'){q.status='granted';n.freeAnswers[q.actor]=(n.freeAnswers[q.actor]||0)+1;}
    }else if(a.type==='resolveLifeline'){
     must(presenter,'お助けへの回答は出題者が行います。');const q=n.lifelineRequests.find(q=>q.id===a.requestId);must(q,'要求が見つかりません。');must(a.public===undefined||typeof a.public==='boolean','公開設定が不正です。');const text=Legacy.clean(a.text,200,true),publicReply=a.public===true;
     if(q.status==='resolved')must(q.text===text&&q.public===publicReply,'返答済みの内容は変更できません。');
     else{must(q.status==='pending','この道具の要求は終了しています。');q.text=text;q.status='resolved';q.public=publicReply;if(q.public&&q.charged&&!n.publicHelpHints.includes(q.text))n.publicHelpHints.push(q.text);}
    }else if(a.type==='receiveLifeline'){
     const q=n.lifelineRequests.find(q=>q.id===a.requestId);must(q&&q.actor===actor&&eligible(s,actor),'自分が要求した返答だけ受け取れます。');must(q.status==='resolved','返答を待ってください。');
     if(q.paymentVersion===2&&q.payment!=='charged'){must(held(q),'この要求の確保は終了しています。');must(a.text===q.text&&a.public===q.public,'受け取った返答の内容を確認できません。');chargeLifeline(n,q);}
     if(q.public&&!n.publicHelpHints.includes(q.text))n.publicHelpHints.push(q.text);
    }else if(a.type==='cancelLifeline'||a.type==='rejectLifeline'){
     const q=n.lifelineRequests.find(q=>q.id===a.requestId);must(q,'要求が見つかりません。');must(a.type==='rejectLifeline'?presenter:q.actor===actor&&eligible(s,actor),'要求者の取消、または出題者の拒否が必要です。');const status=a.type==='rejectLifeline'?'rejected':'cancelled';
     if(q.status!==status){must(q.status==='pending'||held(q),'この要求は終了しています。');q.status=status;if(q.paymentVersion===2){q.payment='released';q.text='';q.public=false;}}
    }else{
     must(eligible(s,actor),'質問者だけがお助け・属性を検討できます。');
     if(a.type==='hypothesis'){
      // Compatibility with assist v3: this command is emitted only after the
      // player's explicit selection confirmation, never while drafting.
      must(n.hypotheses.filter(h=>h.actor===actor).length<24,'仮説の提出は1人24個までです。');n.hypotheses.push({id:a.id,actor,text:Legacy.clean(a.text,100,true),submitted:true,verdict:'unreviewed'});
     }else if(a.type==='submitHypotheses'){
      if(a.hypotheses!==undefined){
       must(Array.isArray(a.hypotheses)&&a.hypotheses.length>0&&a.hypotheses.length<=12,'提出する属性を1〜12個選んでください。');
       const hs=a.hypotheses.map(h=>{must(h&&typeof h.id==='string'&&h.id.length>=8&&h.id.length<=80,'仮説のIDが不正です。');return {id:h.id,text:Legacy.clean(h.text,100,true)};});
       must(new Set(hs.map(h=>h.id)).size===hs.length,'同じ属性を重複して提出できません。');
       for(const h of hs){const existing=n.hypotheses.find(x=>x.id===h.id);must(!existing||(existing.actor===actor&&existing.text===h.text),'提出済みの属性は変更できません。');}
       must(n.hypotheses.filter(h=>h.actor===actor).length+hs.filter(h=>!n.hypotheses.some(x=>x.id===h.id)).length<=24,'仮説の提出は1人24個までです。');
       for(const h of hs)if(!n.hypotheses.some(x=>x.id===h.id))n.hypotheses.push({...h,actor,submitted:true,verdict:'unreviewed'});
      }else{
       must(Array.isArray(a.hypothesisIds)&&a.hypothesisIds.length>0&&a.hypothesisIds.length<=12&&new Set(a.hypothesisIds).size===a.hypothesisIds.length,'提出済みの属性を1〜12個選んでください。');
       must(a.hypothesisIds.every(id=>n.hypotheses.some(h=>h.id===id&&h.actor===actor&&h.submitted)),'選択した本文をまとめて提出してください。');
      }
     }else if(a.type==='requestFreeAnswer'){
      must(!n.freeAnswerRequests.some(q=>q.actor===actor&&q.status==='pending')&&!(n.freeAnswers[actor]>0),'お願い済み、または無料の解答が残っています。');must(n.freeAnswerRequests.length<120,'お願いの上限です。');n.freeAnswerRequests.push({id:a.id,actor,status:'pending'});
     }else if(a.type==='useLifeline'){
      const slot=s.rules.lifelines.find(x=>x.id===a.slot);must(slot?.enabled,'このお助けは利用できません。');must(n.lifelineRequests.length<120,'お助けの上限です。');must(!n.lifelineRequests.some(q=>q.id===a.id),'道具の要求IDが重複しています。');must(available(n,actor)>=slot.cost,'利用可能な持ち点が足りません。');n.lifelineRequests.push({id:a.id,actor,slot:slot.id,label:slot.label,cost:slot.cost,status:'pending',text:'',public:false,paymentVersion:2,payment:'reserved',charged:false});
     }
    }
   }
  }else if(isNew(s)&&(a.type==='vote'||a.type==='voteProblem')){
   must(s.phase==='playing'||done(s),'開始後にFinePlayを贈れます。');must(automatic(s)?fpRoster(s).includes(actor):participant(s,actor),'このお題の参加者だけが評価できます。');
   const e=a.type==='vote'?n.entries.find(e=>e.id===a.entryId):null;must(e?e.kind==='question'&&e.asker!==actor&&see(s,actor,e):a.type==='voteProblem'&&actor!==s.presenter,'自分の投稿や未公開の質問には評価できません。');
   let value;if(automatic(s)){
    must(fpRoster(s,e).includes(actor),'Only target roster participants can give FP.');
    must(a.super===undefined||a.super===false,'Super is awarded automatically; send normal stars.');
    if(a.stars!==undefined){must(Number.isInteger(a.stars)&&a.stars>=0&&a.stars<=3,'FP stars must be 0 through 3.');value=a.stars;}
    else{const g=a.grade??(a.value?1:0);must(g===0||g===1,'Manual Super is unavailable; send normal stars.');value=g;}
   }else{
if(a.stars!==undefined){must(Number.isInteger(a.stars)&&a.stars>=0&&a.stars<=3,'FinePlayは0〜3つです。');must(a.super===undefined||typeof a.super==='boolean','Superの設定が不正です。');value=a.super===true?5:a.stars;}else{const g=a.grade??(a.value?1:0);must([0,1,2,5].includes(g),'FinePlayの種類が不正です。');value=g===2||g===5?5:g;}
   }
   const ratings=e?e.ratings:n.problemRatings;delete ratings[actor];if(value)ratings[actor]=value;
  }else if(isNew(s)&&a.type==='ask'){
   must(s.phase==='playing'&&eligible(s,actor)&&!s.pending,'質問できる順番を確認してください。');must(s.entries.length<250,'250問に達しました。');must(['question','guess'].includes(a.kind),'質問の種類が不正です。');const text=Legacy.clean(a.text,200,a.kind==='guess');
   if(a.kind==='guess'){const allowed=allowance(n,actor);must(allowed.canGuess,'持ち点か解答回数が足りません。');spend(n,actor,allowed.nextCost);if(n.freeAnswers[actor]>0)n.freeAnswers[actor]--;else n.guessQuotaUsed[actor]=(n.guessQuotaUsed[actor]||0)+1;n.guessUsed[actor]=(n.guessUsed[actor]||0)+1;}
   n.pending={id:a.id,asker:actor,kind:a.kind,text,n:s.entries.length+1,...(automatic(s)&&a.kind==='question'?{fpRoster:fpRoster(s).filter(id=>participant(s,id))}:{})};
  }else if(isNew(s)&&a.type==='applaud'){
   must(done(s)&&a.applauseId===s.applauseId&&eligible(s,actor),'答え合わせの後に出題者へ拍手できます。');must(Number.isInteger(a.count)&&a.count>=0&&a.count<=100,'拍手は1人100回までです。');n.applause[actor]=Math.max(n.applause[actor]||0,a.count);
  }else{
   // Existing rules preserve legacy arithmetic; harmless content actions reuse
   // the existing authority checks. New extensions never bypass those checks.
   const next=Legacy.apply(n,actor,a);Object.assign(n,next);
   if(a.type==='undo'&&n.pending){const e=s.entries.at(-1);n.pending.rewardId=e.rewardId||e.id;if(e.fpRoster)n.pending.fpRoster=cp(e.fpRoster);}
   if(a.type==='answer'){const e=n.entries.at(-1);if(e){e.answerLabel=e.answer==='personal'?s.rules.customAnswerLabel||labels.personal:labels[e.answer];if(s.pending?.rewardId)e.rewardId=s.pending.rewardId;}}
  }
  if(a.type!=='start'&&n.phase!==s.phase)n.difficulty.epoch++;
  if(done(n))releaseLifelines(n);syncWallet(n);if(n.finalizedRoundIds.includes(n.roundId)&&['comment','discussion','react'].includes(a.type))saveThread(n);n.actionReceipts[key]=fingerprint;n.rev=s.rev+1;return n;
 }
 function lifetimeScores(s,viewer){if(!unlocked(s,viewer))return null;const totals=cp(s.completedScores.totals),include=isNew(s)&&((s.playMode==='cooperative'&&s.mode==='live')||done(s));if(include&&!s.finalizedRoundIds.includes(s.roundId))for(const p of summary(s).players.filter(p=>!p.spectator))totals[p.id]=cents((totals[p.id]||0)+p.score);
  return {scope:include?'lifetime-live':'finalized',fromRound:s.completedScores.fromRound,players:s.players.map(p=>({id:p.id,total:totals[p.id]||0}))};
 }
 // Archived rows retain aggregates; target identity is supplied by the row and
 // topic, rather than repeated once inside every historical honor object.
 function archivedHonors(s,e){const h=honors(s,e);return {normalStars:h.normalStars,bonusPoints:h.bonusPoints,...(h.eligibleDonorCount!==fpRoster(s).filter(id=>id!==e.asker).length?{eligibleDonorCount:h.eligibleDonorCount}:{})};}
 function threadReference(snapshot,source){if(!snapshot)return snapshot;const n={...snapshot};delete n.comments;delete n.discussion;delete n.reactions;n.threadRef={roundId:n.roundId,source};return n;}
 function entryReference(snapshot){if(!snapshot)return snapshot;const n={...snapshot};delete n.entries;n.entriesRef={roundId:n.roundId,source:'history'};return n;}
 // UI consumers can resolve compact public snapshots without another request.
 // This only uses the already privacy-filtered view, never authoritative state.
 function resolveSnapshot(v,snapshot){
  if(!snapshot)return null;const n=cp(snapshot),entryRef=n.entriesRef,threadRef=n.threadRef;
  if(entryRef){const matches=v.history.filter(h=>h.roundId===entryRef.roundId);must(entryRef.source==='history'&&entryRef.roundId===n.roundId&&matches.length===1&&Array.isArray(matches[0].entries),'Snapshot entry reference is unavailable.');n.entries=cp(matches[0].entries);}
  if(threadRef){must(threadRef.roundId===n.roundId&&['current','history'].includes(threadRef.source),'Snapshot thread reference is unavailable.');const matches=threadRef.source==='current'?(threadRef.roundId===v.roundId?[v]:[]):v.history.filter(h=>h.roundId===threadRef.roundId);must(matches.length===1,'Snapshot thread reference is unavailable.');const source=matches[0];n.comments=cp(source.comments||[]);n.discussion=cp(source.discussion||[]);n.reactions=cp(source.reactions||[]);}
  if(automatic(n)&&Array.isArray(n.entries))n.entries=n.entries.map(e=>{if(!e.honors)return e;const h=e.honors,donorCount=e.votes,eligibleDonorCount=h.eligibleDonorCount??n.fpRoster.filter(id=>id!==e.asker).length,superBonus=5*Math.max(0,donorCount-1),ultraBonus=h.bonusPoints-superBonus;return {...e,honors:{target:fpTarget(n,e),donorCount,eligibleDonorCount,normalStars:h.normalStars,normalPoints:h.normalStars,superBonus,ultraBonus,bonusPoints:h.bonusPoints,score:h.normalStars+h.bonusPoints,super:donorCount>=2,ultra:eligibleDonorCount>=2&&donorCount===eligibleDonorCount}};});
  if(Array.isArray(n.entries))n.entries=n.entries.map(e=>{let answerLabel=e.answerLabel||labels[e.answer];if(e.answerLabelRef!==undefined){must(Number.isInteger(e.answerLabelRef)&&Array.isArray(n.answerLabels)&&typeof n.answerLabels[e.answerLabelRef]==='string','Snapshot answer label reference is unavailable.');answerLabel=n.answerLabels[e.answerLabelRef];}const row={...e,answerLabel};delete row.answerLabelRef;return row;});delete n.answerLabels;delete n.entriesRef;delete n.threadRef;return n;
 }
 function publicSnapshot(h){if(!h)return null;const n=cp(h);if(automatic(h))n.answerLabels=[];const labelRef=label=>{let index=n.answerLabels.indexOf(label);if(index<0){index=n.answerLabels.length;n.answerLabels.push(label);}return index;};n.players=n.players.map(p=>{const q={...p};delete q.balance;return q;});n.entries=n.entries?.map(e=>({id:e.id,...(e.rewardId?{rewardId:e.rewardId}:{}),n:e.n,asker:e.asker,kind:e.kind,text:e.text,answer:e.answer,...(automatic(h)?(e.answer==='personal'?{answerLabelRef:labelRef(e.answerLabel??labels.personal)}:{}):{answerLabel:e.answerLabel}),votes:Object.keys(e.ratings||{}).length,grade:automatic(h)?(e.kind==='question'?(honors(h,e).super?2:honors(h,e).donorCount?1:0):0):h.rulesSchema!==2?Math.max(0,...Object.values(e.ratings||{})):legacyGrade(e.ratings),...(automatic(h)?{honors:e.kind==='question'?archivedHonors(h,e):null}:{})}));return n;}
 function reactionView(reactions,viewer,visible){const groups=new Map();for(const x of reactions){if(x.entryId!==null&&!visible.has(x.entryId))continue;const k=(x.entryId||'problem')+':'+x.reaction;if(!groups.has(k))groups.set(k,{entryId:x.entryId,reaction:x.reaction,count:0,mine:false});const g=groups.get(k);g.count++;if(x.actor===viewer)g.mine=true;}return [...groups.values()];}
 function view(input,viewer){
  const s=migrate(input),v=Legacy.view(s,viewer),locked=!unlocked(s,viewer),hidden=s.mode==='sealed'&&!done(s);v.rulesSchema=s.rulesSchema;v.finalized=s.finalizedRoundIds.includes(s.roundId);v.canFinalize=!v.finalized&&done(s)&&(viewer===s.owner||viewer===s.presenter);
  // The question roster is host-only metadata, not a new public pending field.
  if(v.pending&&!v.pending.private)delete v.pending.fpRoster;
  // Replace legacy derived fields; never spread authoritative state into view.
  if(!isNew(s)&&v.finalized&&v.scoreTotals?.scope==='confirmed')v.scoreTotals={scope:'confirmed',fromRound:s.completedScores.fromRound,players:s.players.filter(p=>p.role!=='spectator').map(p=>({id:p.id,total:s.completedScores.totals[p.id]||0}))};
  if(isNew(s)){
   v.allowance=allowance(s,viewer);v.entries=v.entries.map(e=>{const raw=s.entries.find(x=>x.id===e.id),mine=raw.ratings?.[viewer]||0,info=voteInfo(s.rules,raw.ratings);return {...e,answerLabel:raw.answerLabel||labels[e.answer],myGrade:mine===5?2:mine>0?1:0,myStars:mine,mySuper:mine===5,grade:hidden?null:legacyGrade(raw.ratings),stars:hidden?null:info.stars,score:hidden?null:info.score};});
   const mine=s.problemRatings[viewer]||0,p=voteInfo(s.rules,s.problemRatings);v.problem={...v.problem,myGrade:mine===5?2:mine>0?1:0,myStars:mine,mySuper:mine===5,grade:hidden||locked?null:legacyGrade(s.problemRatings),stars:hidden||locked?null:p.stars,score:hidden||locked?null:p.score};
   v.applause.points=locked?0:v.applause.total*s.rules.applausePoints;
   v.scoreTotals=locked?null:{scope:s.playMode==='cooperative'&&s.mode==='live'?'current':'confirmed',fromRound:s.playMode==='cooperative'&&s.mode==='live'?s.round:s.completedScores.fromRound,players:s.players.filter(p=>p.role!=='spectator').map(p=>({id:p.id,total:s.playMode==='cooperative'&&s.mode==='live'?playerStats(s,p).score:(s.completedScores.totals[p.id]||0)+(done(s)&&!s.finalizedRoundIds.includes(s.roundId)?playerStats(s,p).score:0)}))};
   if(!hidden&&!locked){const mine=playerStats(s,person(s,viewer));v.myStats=mine;}
   if(done(s)&&!locked)v.result=s.finalizedRoundIds.includes(s.roundId)&&s.lastFinalized?.roundId===s.roundId?publicSnapshot(s.lastFinalized):summary(s);
  }
  if(automatic(s)){
   const publicFP=fpPublic(s)&&!locked;v.fpRuleVersion=s.fpRuleVersion;
   v.entries=v.entries.map(e=>{const raw=s.entries.find(x=>x.id===e.id);if(raw.kind!=='question')return {...e,mySuper:false,honors:null};const h=honors(s,raw);return {...e,myStars:raw.ratings?.[viewer]||0,mySuper:false,grade:publicFP?(h.super?2:h.donorCount?1:0):null,votes:publicFP?h.donorCount:null,stars:publicFP?h.normalStars:null,score:publicFP?h.score:null,honors:publicFP?h:null};});
   const h=honors(s);v.problem={...v.problem,myStars:s.problemRatings[viewer]||0,mySuper:false,grade:publicFP?(h.super?2:h.donorCount?1:0):null,votes:publicFP?h.donorCount:null,stars:publicFP?h.normalStars:null,score:publicFP?h.score:null,honors:publicFP?h:null};
   if(!publicFP){delete v.myStats;v.combos=[];}
  }
  v.fpContractVersion=FP_CONTRACT;v.fpRuleVersion=s.fpRuleVersion||null;const fp=locked?{targets:[],events:[]}:fpEvents(s);v.fpEventTargets=fp.targets;v.fpEvents=fp.events;
  if(locked){v.allowance={used:0,nextCost:0,freeLeft:0,grantedFree:0,left:null,balance:null,canGuess:false};delete v.myStats;}
  // All player stats shared in result/history omit private wallet balances.
  if(v.result)v.result.players=v.result.players.map(p=>{const x={...p};delete x.balance;return x;});
  v.history=locked?[]:s.history.map(h=>{const n=publicSnapshot(h),t=s.postgameThreads[h.roundId];if(t){n.comments=cp(t.comments);n.discussion=cp(t.discussion);n.reactions=reactionView(t.reactions,viewer,new Set((h.entries||[]).map(e=>e.id)));}return n;});
  v.discussion=locked?[]:cp(s.discussion);
  v.reactions=locked?[]:reactionView(s.reactions,viewer,new Set(v.entries.map(e=>e.id)));
  v.finalization=v.finalized?{roundId:s.roundId,cutoffRev:s.lastFinalized?.roundId===s.roundId?s.lastFinalized.cutoffRev:null}:null;
  v.difficultyEpoch=s.difficulty.epoch;
  if(s.phase==='preparing')v.difficultyRequests=s.difficulty.requests.filter(q=>participant(s,q.actor)&&q.actor!==s.presenter&&(viewer===s.presenter||q.actor===viewer)).map(cp);
  if(viewer===s.presenter&&!done(s))v.difficultyPrivate={value:s.difficulty.value,published:s.difficulty.published};
  v.hints=[...v.hints,...cp(s.publicHelpHints),...(s.difficulty.published&&s.difficulty.value!==null?['難易度: '+difficultyLabels[s.difficulty.value]]:[])];v.hintCount=v.hints.length;
  v.hypotheses=locked?[]:s.hypotheses.filter(h=>h.actor===viewer).map(cp);
  if(viewer===s.presenter)v.hypothesisInbox=s.hypotheses.filter(h=>h.submitted).map(cp);
  v.freeAnswerRequests=locked?[]:s.freeAnswerRequests.filter(q=>q.actor===viewer||viewer===s.presenter).map(cp);
  v.lifelineRequests=locked?[]:s.lifelineRequests.filter(q=>q.actor===viewer||viewer===s.presenter).map(cp);
  if(!locked&&isNew(s))v.wallet={balance:s.wallets[viewer]?.balance??s.rules.initialPoints,spent:s.wallets[viewer]?.spent||0,reserved:reserved(s,viewer),available:available(s,viewer),...(automatic(s)?{debt:s.wallets[viewer]?.debt||0}:{})};
  v.lastFinalized=locked?null:publicSnapshot(s.lastFinalized);v.cycleResult=locked?null:cp(s.cycleResult);
  v.cycle=s.cycle?{id:s.cycle.id,roster:cp(s.cycle.roster),completed:cp(s.cycle.completed),skipped:cp(s.cycle.skipped),pending:s.cycle.roster.filter(id=>!s.cycle.completed.includes(id)&&!s.cycle.skipped.some(x=>x.playerId===id)),status:s.cycle.status}:null;
  v.awardTotals=locked?null:cp(s.awardTotals);v.achievementTotals=locked?null:cp(s.achievementTotals);v.awardCoverage=cp(s.awardCoverage);v.lifetimeScoreTotals=lifetimeScores(s,viewer);
  if(automatic(s)){
   // Keep all authored threads in one canonical projection. A finalized current
   // topic's thread is already in v.comments/discussion/reactions. Other topics
   // remain complete in history. Result/lastFinalized are score summaries with
   // entries and an explicit thread reference, never extra copies of text.
   v.history=v.history.map(h=>h.roundId===s.roundId?threadReference(h,'current'):h);
   if(v.result?.finalized)v.result=entryReference(threadReference(v.result,v.result.roundId===s.roundId?'current':'history'));
   if(v.lastFinalized)v.lastFinalized=entryReference(threadReference(v.lastFinalized,v.lastFinalized.roundId===s.roundId?'current':'history'));
  }
  return v;
 }
 function create(owner,name){const s=migrate(Legacy.create(owner,name));s.rulesSchema=2;s.rules=rules();s.awardCoverage={fromRound:1,partial:false};return s;}
 const join=(s,...args)=>migrate(Legacy.join(migrate(s),...args)),online=(s,...args)=>migrate(Legacy.online(migrate(s),...args));
 return {resolveFPEvents,resolveSnapshot,labels,cp,clean:Legacy.clean,done,count,summary,create,join,online,apply,view,questionText:Legacy.questionText,defaults,allowance,guessCost,guessPenalty:(s,used)=>isNew(s)?0:Legacy.guessPenalty(s,used),rules,migrate,contractVersion:'fineplay-whole-version/1.3.2',fpContractVersion:FP_CONTRACT};

});
