/* Local recovery only: no room authority, scoring, transport or secret export. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FPRecovery=api;})(globalThis,()=>{
 'use strict';
 function createPeerLoader({scope,doc,timeout=12000,setTimer=setTimeout,clearTimer=clearTimeout}){
  let active=null,attempts=0;
  function ensure(){
   if(typeof scope.Peer==='function')return Promise.resolve();
   if(active)return active.promise;
   const job={script:doc.createElement('script'),done:false,timer:null};attempts++;
   job.promise=new Promise((resolve,reject)=>{job.resolve=resolve;job.reject=reject;});active=job;
   const finish=error=>{
    if(job.done)return;job.done=true;clearTimer(job.timer);job.script.onload=job.script.onerror=null;
    if(active===job)active=null;
    if(error){job.script.remove();job.reject(error);}else job.resolve();
   };
   job.script.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';job.script.crossOrigin='anonymous';
   job.script.onload=()=>finish(typeof scope.Peer==='function'?null:new Error('通信ライブラリを読み込めません。'));
   job.script.onerror=()=>finish(new Error('通信ライブラリを読み込めません。'));
   job.timer=setTimer(()=>finish(new Error('通信ライブラリの読込がタイムアウトしました。')),timeout);
   try{doc.head.appendChild(job.script);}catch{finish(new Error('通信ライブラリを読み込めません。'));}
   return job.promise;
  }
  return Object.freeze({ensure,inspect:()=>({status:active?'loading':typeof scope.Peer==='function'?'ready':'idle',attempts})});
 }
 function createStorage({storage,prefix}){
  const blocked=new Set();let status='unknown';
  function block(key){blocked.add(key);status='blocked';}
  function read(key){
   let raw;try{raw=storage().getItem(prefix+key);}catch{if(status!=='blocked')status='unavailable';return {status:'unavailable',value:null};}
   if(raw===null)return {status:'missing',value:null};
   if(blocked.has(key))return {status:'invalid',value:null};
   try{return {status:'ok',value:JSON.parse(raw)};}catch{block(key);return {status:'invalid',value:null};}
  }
  function write(key,value){
   if(blocked.has(key)){status='blocked';return false;}
   try{const raw=JSON.stringify(value),target=storage();target.setItem(prefix+key,raw);if(target.getItem(prefix+key)!==raw)throw Error('verification');status=blocked.size?'blocked':'saved';return true;}
   catch{if(status!=='blocked')status='unavailable';return false;}
  }
  return Object.freeze({read,write,block,inspect:()=>({status,blocked:blocked.size})});
 }
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const string=x=>typeof x==='string'&&x.length>0&&x.length<=256;
 const must=ok=>{if(!ok)throw Error('復帰用の保存データを読み込めません。');};
 function restoreOwner(saved,{rules,version=3,validToken}){
  must(object(saved)&&object(saved.game));const g=saved.game;
  must(g.version===version&&Array.isArray(g.players)&&g.players.length>=1&&g.players.length<=12&&string(saved.me)&&g.owner===saved.me);
  const ids=new Set();for(const p of g.players){must(object(p)&&string(p.id)&&!ids.has(p.id)&&typeof p.online==='boolean'&&['player','spectator'].includes(p.role));rules.clean(p.name,24,true);ids.add(p.id);}
  must(ids.has(saved.me)&&ids.has(g.presenter)&&Number.isSafeInteger(g.round)&&g.round>=0&&Number.isSafeInteger(g.rev)&&g.rev>=0&&string(g.roundId)&&['lobby','preparing','playing','solved','passed'].includes(g.phase));
  must(Array.isArray(g.entries)&&g.entries.length<=250&&Array.isArray(g.history)&&g.history.length<=10);
  const name=rules.clean(saved.name,24,true),credentials=saved.credentials===undefined?{}:saved.credentials;
  must(object(credentials));for(const [token,id]of Object.entries(credentials))must(validToken(token)&&ids.has(id));
  const game=rules.migrate(g);
  // Probe the existing projection for every formal role before reconnecting.
  // It may throw on malformed nested records; never show or export its secrets.
  for(const p of game.players)rules.view(game,p.id);
  return {game,name,me:saved.me,credentials:{...credentials}};
 }
 function restoreGuest(saved,{rules,validToken}){
  must(object(saved)&&validToken(saved.token));const role=saved.role===undefined?'player':saved.role;must(['player','spectator'].includes(role));
  return {name:rules.clean(saved.name,24,true),token:saved.token,role};
 }
 return Object.freeze({createPeerLoader,createStorage,restoreOwner,restoreGuest});
});
