/* R2 difficulty controls. Consumes only the authenticated viewer projection.
 * Load after the existing render wrappers. Uses the existing send/host path. */
(()=>{'use strict';
 const labels={easy:'やさしめ',normal:'ふつう',hard:'むずかしめ',expert:'超むずかしめ'};
 const q=s=>document.querySelector(s);
 const key=v=>v?[room,me,v.roundId,v.difficultyEpoch,v.phase,v.presenter].join('/') : '';
 function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
 function select(id,value,empty){const el=node('select');el.id=id;for(const [v,label]of [['',empty],...Object.entries(labels)]){const option=node('option',label);option.value=v;el.append(option);}el.value=value||'';el.disabled=!ready||busy;return el;}
 function paint(){
  q('#difficulty-requests')?.remove();q('#difficulty-actual-field')?.remove();
  if(!state||state.difficultyEpoch===undefined)return;
  const current=state,captured=key(current),presenter=me===current.presenter;
  const dispatch=(type,extra={})=>{
   if(!ready||busy||key(state)!==captured)return;
   send(type,{...extra,difficultyEpoch:current.difficultyEpoch,phase:current.phase});
  };
  if(current.phase==='preparing'&&(presenter||!current.spectator)){
   const panel=node('section');panel.id='difficulty-requests';panel.className='difficulty-requests';
   panel.append(node('h3',presenter?'届いた難易度の希望':'次のお題の難易度の希望'));
   if(presenter){
    const requests=current.difficultyRequests||[];
    if(!requests.length)panel.append(node('p','希望はまだありません。待たずに開始できます。'));
    for(const request of requests){const name=current.players.find(p=>p.id===request.actor)?.name||'参加者';panel.append(node('p',name+'：'+labels[request.value]));}
    panel.append(node('small','希望は参考です。実際の難易度は出題者が決めます。'));
   }else{
    const label=node('label','希望（任意）');label.htmlFor='difficulty-hope';
    const input=select('difficulty-hope',current.difficultyRequests?.find(r=>r.actor===me)?.value,'おまかせ');
    input.onchange=()=>dispatch('requestDifficulty',{value:input.value||null});panel.append(label,input,node('small','あなたと出題者にだけ表示。おまかせで取り下げ。選ばなくても始められます。'));
   }
   q('.preparation')?.append(panel);
  }
  // Extend the original preparation form / attribute panel, never a second panel.
  if(!presenter||!['preparing','playing'].includes(current.phase)||!current.difficultyPrivate)return;
  const target=current.phase==='preparing'?q('#prepare-form'):q('.attrs-official .attribute-publication')?.parentElement||q('.private-card details');
  if(!target)return;
  const field=node('div');field.id='difficulty-actual-field';field.className='difficulty-actual-field';
  const label=node('label','難易度（出題者の設定）');label.htmlFor='difficulty-actual';
  const input=select('difficulty-actual',current.difficultyPrivate.value,'未設定');
  input.onchange=()=>dispatch('setDifficulty',{value:input.value||null});
  field.append(label,input,node('small',current.difficultyPrivate.published?'公開中':'未公開・出題者だけ'));
  if(current.phase==='playing'){
   const published=current.difficultyPrivate.published,button=node('button',published?'撤回':'公開');button.type='button';button.disabled=!ready||busy||!current.difficultyPrivate.value;
   button.onclick=()=>dispatch(published?'retractDifficulty':'publishDifficulty');field.append(button);
   field.append(node('small','値を変更すると未公開に戻ります。必要なときに公開してください。'));
  }
  const begin=q('#begin');if(begin&&begin.parentElement===target)target.insertBefore(field,begin);else target.append(field);
 }
 const previousRender=render;render=(...args)=>{const result=previousRender(...args);paint();return result;};
 paint();
})();
