/* R5 candidate: normal FinePlay points use hands; commands remain unchanged. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FPR5ScoreHands=api;})(globalThis,()=>{
  'use strict';
  function layout(points,limit=10){
    if(!Number.isSafeInteger(points)||points<0||!Number.isSafeInteger(limit)||limit<1)return null;
    return {points,shown:Math.min(points,limit),remaining:Math.max(0,points-limit)};
  }
  return Object.freeze({layout});
});
if(typeof window!=='undefined')(()=>{
  'use strict';
  const prior=render;
  const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  function hands(points,cls){
    const count=FPR5ScoreHands.layout(points);if(!count||!count.points)return null;
    const group=make('span',cls),icons=make('span','r5-hand-icons');icons.setAttribute('aria-hidden','true');
    for(let i=0;i<count.shown;i++){const icon=make('img','r5-point-hand');icon.src='assets/fineplay-hand.svg';icon.alt='';icons.append(icon);}
    group.append(icons);
    if(count.remaining)group.append(make('small','r5-hand-remainder','+'+count.remaining));
    group.append(make('small','r5-hand-points',count.points+'点'));
    const label='通常FinePlay '+count.points+'点・手'+count.points+'個'+(count.remaining?'（代表'+count.shown+'個と残り'+count.remaining+'個）':'');
    group.setAttribute('aria-label',label);group.title=label;return group;
  }
  function paintVotes(){
    for(const option of document.querySelectorAll('[data-presentation-star]')){
      const value=option.dataset.presentationStar;if(!/^[123]$/.test(value))continue;
      const group=hands(Number(value),'r5-vote-hands');
      group.setAttribute('aria-hidden','true');option.replaceChildren(group);
      option.setAttribute('aria-label',value+'点 FinePlay・手'+value+'個');
    }
    for(const trigger of document.querySelectorAll('.attrs-fp-trigger[data-my-stars]')){
      const mine=Number(trigger.dataset.myStars),meter=trigger.querySelector('.layout-fp-meter');
      if(meter)meter.textContent=mine?'あなたの評価 '+mine+'点':'評価を選ぶ';
      if(mine>=1&&mine<=3){
        const hand=trigger.querySelector(':scope>.layout-fp-hand');
        if(hand){const group=hands(mine,'r5-selected-hands');group.setAttribute('aria-hidden','true');group.querySelector('.r5-hand-points')?.remove();hand.replaceWith(group);}
      }
      const label=trigger.getAttribute('aria-label');
      if(label){const next=label.replace(/(\d+)つ星/g,'$1点').replace('星数を選ぶ','点数を選ぶ');trigger.setAttribute('aria-label',next);trigger.title=next;}
    }
  }
  function paint(){
    document.querySelectorAll('[data-r5-normal-hands]').forEach(e=>e.remove());
    // Legacy rooms can have a configurable star multiplier. Their existing
    // controls must not be relabelled as one point per hand.
    if(!state||state.locked||state.fpRuleVersion!=='distinct-donors/1')return;
    paintVotes();
    if(state.hidden)return;
    // Only projected public honors can supply received point counts. Own
    // private ballots are handled separately in the unchanged vote controls.
    for(const row of document.querySelectorAll('#history .history-item[data-entry]')){
      const entry=state.entries.find(e=>e.id===row.dataset.entry);
      if(entry?.kind!=='question')continue;
      const group=hands(entry.honors?.normalPoints,'r5-normal-hands');
      if(!group)continue;group.dataset.r5NormalHands='';
      row.querySelector(':scope>summary')?.append(group);
      // Replace the old one-hand numeric readback after adding its exact
      // point equivalent; action buttons and Super / Ultra badges survive.
      row.querySelectorAll('.presentation-fp-mark').forEach(e=>e.remove());
    }
    const topic=hands(state.problem?.honors?.normalPoints,'r5-normal-hands r5-topic-hands');
    // Keep the received readback outside the voting palette. The palette is
    // a compact action control; making its flex row hold all received hands
    // would widen the topic beyond a narrow viewport.
    if(topic){topic.dataset.r5NormalHands='';const trigger=document.querySelector('#layout-topic .attrs-fp-trigger');trigger?.closest('.attrs-fp-palette')?.after(topic);}
  }
  render=()=>{prior();if(window.FPR3?.anticipating())return;paint();};
  render();
})();
