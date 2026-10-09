/* Public, reasoned score presentation. Never reads the host game or wallet. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FPEarned=api;})(globalThis,()=>{
  'use strict';
  const labels={correct:'正解！',normal:'FinePlay',super:'Super FinePlay',ultra:'Ultra FinePlay',combo:'Combo',applause:'拍手',verified:'得点の変化'};
  function project(v){
    if(!v||v.locked||v.hidden)return [];
    const done=['solved','passed'].includes(v.phase);
    if(!done&&(v.playMode!=='cooperative'||v.mode!=='live'))return [];
    if(v.fpRuleVersion!=='distinct-donors/1')return [];
    const rows=[];
    const add=(recipient,reason,target,amount)=>{if(Number.isFinite(amount)&&amount!==0)rows.push({id:JSON.stringify([v.roundId,recipient,reason,target]),recipient,reason,amount});};
    for(const e of v.entries||[]){
      const h=e.honors;
      if(e.kind==='question'&&h)for(const [reason,field]of [['normal','normalPoints'],['super','superBonus'],['ultra','ultraBonus']])add(e.asker,reason,h.target.rewardId,h[field]);
      if(e.kind==='guess'&&e.answer==='correct')add(e.asker,'correct',v.roundId,v.rules.correctPoints);
    }
    const h=v.problem?.honors;
    if(h)for(const [reason,field]of [['normal','normalPoints'],['super','superBonus'],['ultra','ultraBonus']])add(v.presenter,reason,h.target.rewardId,h[field]);
    for(const c of v.combos||[])add(c.asker,'combo',c.entryIds.map(id=>v.entries.find(e=>e.id===id)?.honors?.target?.rewardId||id).sort().join(':'),v.rules.comboPoints);
    add(v.presenter,'applause',v.applauseId,v.applause?.points);
    // A breakdown is used only when it reconciles to an allowed exact topic score.
    const totals=done?v.result?.players.map(p=>({id:p.id,total:p.score})):v.scoreTotals?.scope==='current'?v.scoreTotals.players:null;
    return rows.filter(row=>{const total=totals?.find(p=>p.id===row.recipient)?.total;return Number.isFinite(total)&&Math.abs(rows.filter(r=>r.recipient===row.recipient).reduce((n,r)=>n+r.amount,0)-total)<0.00001;});
  }
  return Object.freeze({project,labels});
});

if(typeof window!=='undefined')(()=>{
  'use strict';
  const prior=render,seen=new Map(),recent=new Map();
  let identity='',last=null,connected=false,timer;
  const categories=['日用品','食べ物・飲み物','動物・植物','乗り物','場所・建物','職業','スポーツ','アニメ・漫画','ゲームのキャラクター'];
  const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const signed=n=>(n>0?'+':'')+Number(n.toFixed(2))+'点';
  function scopeUI(){
    const input=document.querySelector('#scope');if(!input||document.querySelector('#scope-suggestions'))return;
    const group=make('div','scope-suggestions');group.id='scope-suggestions';group.setAttribute('role','group');group.setAttribute('aria-label','お題の範囲の候補');
    const sync=()=>group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scope===input.value)));
    for(const text of [...categories,'自由に入力']){const b=make('button','quiet',text);b.type='button';b.dataset.scope=text==='自由に入力'?'':text;b.onclick=()=>{input.value=b.dataset.scope;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});};group.append(b);}
    const help=make('small','scope-help','候補から選んでも、自由に書いてもOK。例：コンビニの食べ物、ポケモン');
    input.after(group,help);input.addEventListener('input',sync);input.addEventListener('compositionend',sync);sync();
  }
  function paint(){
    if(!state)return;
    const v=state,rows=FPEarned.project(v),key=JSON.stringify([room,v.roundId,me,v.role,v.spectator,v.locked,v.hidden]);
    const totals=FPScorePile.totals(v)?.players||[],map=new Map(rows.map(r=>[r.id,r]));
    const baseline=key!==identity||!ready||!connected||document.hidden||!last||v.rev<last.rev;
    const correction=!baseline&&([...last.rows].some(([id,r])=>(map.get(id)?.amount||0)<r.amount)||totals.some(p=>p.total<(last.totals.find(x=>x.id===p.id)?.total??p.total)));
    if(baseline||correction)recent.clear();
    if(!baseline&&!correction&&v.rev>last.rev){
      for(const r of rows){const delta=r.amount-(last.rows.get(r.id)?.amount||0),high=seen.get(r.id)||0;
        if(delta>0&&r.amount>high){const id=JSON.stringify([r.recipient,r.reason]),old=recent.get(id);recent.set(id,{...r,amount:(old&&old.until>Date.now()?old.amount:0)+delta,until:Date.now()+4500});}
      }
      // Unavailable breakdown: only an explicitly neutral, verified net delta.
      for(const p of totals){if(rows.some(r=>r.recipient===p.id))continue;const before=last.totals.find(x=>x.id===p.id);if(before&&p.total!==before.total)recent.set(JSON.stringify([p.id,'verified']),{recipient:p.id,reason:'verified',amount:p.total-before.total,until:Date.now()+4500});}
    }
    for(const r of rows)seen.set(r.id,Math.max(seen.get(r.id)||0,r.amount));
    if(seen.size>12000){seen.clear();recent.clear();}
    identity=key;connected=ready&&!document.hidden;last={rev:v.rev,rows:map,totals};
    for(const card of document.querySelectorAll('.fp-hud-player')){
      const id=card.dataset.playerId;let slot=card.querySelector('.earned-recent');
      if(!slot){slot=make('div','earned-recent');slot.setAttribute('role','status');slot.setAttribute('aria-live','polite');card.querySelector('.fp-hud-score').after(slot);}
      const personal=rows.filter(r=>r.recipient===id);
      const correctPoints=personal.filter(r=>r.reason==='correct').reduce((n,r)=>n+r.amount,0);
      const transient=[...recent.values()].filter(r=>r.recipient===id&&r.until>Date.now()).map(r=>FPEarned.labels[r.reason]+' '+signed(r.amount)).join(' · ');
      // Readback survives the short notification, but is always rebuilt from
      // the allowed current projection. Undo/private views remove it at once.
      const text=transient||(correctPoints>0?'正解で '+signed(correctPoints)+' 獲得':'');
      if(slot.textContent!==text)slot.textContent=text;
      slot.classList.toggle('earned-correct-persistent',!transient&&correctPoints>0);
      card.classList.toggle('earned-highlight',!!transient);
      card.querySelector('.earned-topic')?.remove();
      const current=v.scoreTotals?.scope==='current'?v.scoreTotals.players.find(p=>p.id===id)?.total:v.result?.players.find(p=>p.id===id)?.score;
      const topic=make('small','earned-topic',Number.isFinite(current)?'このお題 '+current+'点':'このお題の点は終了後に公開');slot.after(topic);
      let detail=card.querySelector('.earned-readback');
      if(!detail){detail=make('details','earned-readback');detail.append(make('summary','','このお題の得点内訳'));card.append(detail);}
      const signature=JSON.stringify(personal);
      if(detail.dataset.signature!==signature){
        detail.dataset.signature=signature;detail.querySelectorAll('div').forEach(e=>e.remove());
        for(const reason of Object.keys(FPEarned.labels)){const found=personal.filter(r=>r.reason===reason);if(found.length)detail.append(make('div','',FPEarned.labels[reason]+' '+signed(found.reduce((n,r)=>n+r.amount,0))));}
      }
    }
    document.querySelector('#earned-correct')?.remove();
    const correct=rows.filter(r=>r.reason==='correct');if(correct.length&&document.querySelector('.result')){const badge=make('div','earned-correct');badge.id='earned-correct';for(const r of correct)badge.append(make('p','',(v.players.find(p=>p.id===r.recipient)?.name||'プレイヤー')+' · 正解！ '+signed(r.amount)));document.querySelector('.result').append(badge);}
    clearTimeout(timer);if([...recent.values()].some(r=>r.until>Date.now()))timer=setTimeout(paint,4500);
  }
  render=()=>{prior();if(window.FPR3?.anticipating())return;scopeUI();paint();};
  document.addEventListener('visibilitychange',()=>{connected=false;recent.clear();});
  document.addEventListener('click',()=>queueMicrotask(scopeUI));
  render();
})();
