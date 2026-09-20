/* FINEPLAY 0.2.0 — deterministic, host-authoritative game rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FPRules=api;})(globalThis,()=>{
 'use strict';
 const labels={yes:'はい',no:'いいえ',probably:'たぶんそう',probablyNot:'たぶん違う',unknown:'わからない',correct:'正解！',incorrect:'不正解'};
 const cp=x=>JSON.parse(JSON.stringify(x));
 const must=(yes,message)=>{if(!yes)throw new Error(message);};
 const clean=(v,max,required=false)=>{must(typeof v==='string','文字で入力してください。');const s=v.trim();must(s.length<=max,`${max}文字以内で入力してください。`);must(!required||s.length>0,'入力してください。');return s;};
 const done=s=>['solved','passed'].includes(s.phase);
 const count=s=>({total:s.entries.length,questions:s.entries.filter(e=>e.kind==='question').length,guesses:s.entries.filter(e=>e.kind==='guess').length,fp:s.entries.filter(e=>e.voters.length).length,votes:s.entries.reduce((a,e)=>a+e.voters.length,0)});
 function create(owner,name){return {version:2,owner,presenter:owner,players:[{id:owner,name:clean(name,24,true),online:true}],round:0,roundId:'lobby',phase:'lobby',scope:'なんでも',mode:'live',pending:null,entries:[],reveal:'',history:[],rev:0};}
 function join(s,id,name){name=clean(name,24,true);must(s.players.length<12,'この卓は12人までです。');must(!s.players.some(p=>p.id===id||p.name===name),'その名前は参加済みです。別の名前を使ってください。');const n=cp(s);n.players.push({id,name,online:true});n.rev++;return n;}
 function online(s,id,value){const n=cp(s),p=n.players.find(p=>p.id===id);if(p)p.online=!!value;n.rev++;return n;}
 function apply(s,actor,a){
  must(a&&typeof a==='object'&&typeof a.id==='string'&&a.id.length>=8&&a.id.length<=80,'操作データが不正です。');
  must(s.players.some(p=>p.id===actor&&p.online),'接続を確認してください。');
  must(a.roundId===s.roundId,'お題が変わりました。画面を確認してください。');
  const n=cp(s),presenter=actor===s.presenter,owner=actor===s.owner;
  if(a.type==='start'){
   must(owner,'部屋を作った人が開始してください。');must(s.phase==='lobby'||done(s),'先に今のお題を終了してください。');
   must(s.players.filter(p=>p.online).length>=2,'2人以上が入室したら始められます。');
   must(s.players.some(p=>p.id===a.presenter&&p.online),'接続中の出題者を選んでください。');
   must(['live','sealed'].includes(a.mode),'FinePlayの表示設定が不正です。');
   if(done(s)){n.history.push({round:s.round,scope:s.scope,reveal:s.reveal,phase:s.phase,...count(s)});n.history=n.history.slice(-20);}
   Object.assign(n,{round:s.round+1,roundId:a.id,presenter:a.presenter,scope:clean(a.scope,80)||'なんでも',mode:a.mode,phase:'playing',pending:null,entries:[],reveal:''});
  }else if(a.type==='ask'){
   must(s.phase==='playing','いまは質問できません。');must(!presenter,'出題者は質問できません。');must(!s.pending,'いまの質問の回答を待ってください。');must(s.entries.length<250,'250問に達しました。出題者がお題を公開してください。');
   must(['question','guess'].includes(a.kind),'質問の種類が不正です。');
   n.pending={id:a.id,asker:actor,kind:a.kind,text:clean(a.text,200,a.kind==='guess')};
  }else if(a.type==='answer'){
   must(presenter,'回答できるのは出題者だけです。');must(s.phase==='playing'&&s.pending&&s.pending.id===a.pendingId,'この質問は回答済み、または取り消されました。');
   const valid=s.pending.kind==='guess'?['correct','incorrect']:['yes','no','probably','probablyNot','unknown'];must(valid.includes(a.answer),'回答を選んでください。');
   n.entries.push({...s.pending,answer:a.answer,voters:[]});n.pending=null;
   if(a.answer==='correct'){n.phase='solved';n.reveal=s.pending.text;}
  }else if(a.type==='cancel'){
   must(s.phase==='playing'&&s.pending&&s.pending.id===a.pendingId,'この質問は終了しています。');must(presenter||owner||s.pending.asker===actor,'自分の質問だけ取り消せます。');n.pending=null;
  }else if(a.type==='vote'){
   const e=n.entries.find(e=>e.id===a.entryId);must(e&&e.kind==='question','この質問には投票できません。');must(e.asker!==actor,'自分の質問には投票できません。');must(typeof a.value==='boolean','投票データが不正です。');
   e.voters=e.voters.filter(id=>id!==actor);if(a.value)e.voters.push(actor);
  }else if(a.type==='note'){
   const e=n.entries.find(e=>e.id===a.entryId);must(e,'質問が見つかりません。');must(presenter||e.asker===actor,'質問者か出題者が編集してください。');must(e.kind==='question','解答宣言は変更できません。');e.text=clean(a.text,200);
  }else if(a.type==='undo'){
   must(presenter,'回答の訂正は出題者が行ってください。');must(!s.pending&&s.entries.length>0&&s.phase!=='passed','いまは訂正できません。');const e=n.entries.pop();n.pending={id:a.id,asker:e.asker,kind:e.kind,text:e.text};n.phase='playing';n.reveal='';
  }else if(a.type==='reveal'){
   must(presenter&&s.phase==='playing','出題者だけがお題を公開できます。');n.reveal=clean(a.text,200,true);n.pending=null;n.phase='passed';
  }else throw new Error('対応していない操作です。');
  n.rev++;return n;
 }
 function view(s,viewer){
  const hidden=s.mode==='sealed'&&s.phase==='playing';
  return {version:2,owner:s.owner,presenter:s.presenter,players:cp(s.players),round:s.round,roundId:s.roundId,phase:s.phase,scope:s.scope,mode:s.mode,pending:cp(s.pending),reveal:s.reveal,history:cp(s.history),rev:s.rev,you:viewer,hidden,
   entries:s.entries.map(e=>({id:e.id,asker:e.asker,kind:e.kind,text:e.text,answer:e.answer,myVote:e.voters.includes(viewer),votes:hidden?null:e.voters.length}))};
 }
 return {labels,cp,clean,done,count,create,join,online,apply,view};
});
