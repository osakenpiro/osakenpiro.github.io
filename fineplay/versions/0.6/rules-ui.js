/* Classic-script integration: load after the existing interface wrappers. */
(() => {
 'use strict';
 const previousRender=render,previousBind=bind;
 const numberKeys=['initialPoints','freeGuessQuota','guessCost','correctPoints','comboPoints','applausePoints','attempts'];
 const field=(key,label,r)=>`<label for="rule-${key}">${label}<input id="rule-${key}" type="number" min="0" max="100" step="1" inputmode="numeric" value="${esc(r[key])}" required></label>`;
 const selectablePlayers=()=>state.players.filter(p=>p.online&&(p.role==='player'||(state.nextPlayers||[]).includes(p.id)));
 function nextPresenters(){const all=selectablePlayers(),pending=state.cycle?.status==='active'?state.cycle.pending.filter(id=>!(R.done(state)&&id===state.presenter)):[];const current=pending.length?all.filter(p=>pending.includes(p.id)):all;return current.length?current:all;}
 function readRules(){
  const r={preset:$('#rule-preset').value,limit:$('#rule-limit').value,costModel:'staged',customAnswerLabel:$('#rule-customAnswerLabel').value};
  for(const key of numberKeys)r[key]=Number($('#rule-'+key).value);
  r.lifelines=R.defaults.lifelines.map(slot=>({id:slot.id,label:$('#rule-help-label-'+slot.id).value,cost:Number($('#rule-help-cost-'+slot.id).value),enabled:$('#rule-help-enabled-'+slot.id).checked}));
  return R.rules(r);
 }
 function settingsRules(){return state.rulesSchema===2?{...R.defaults,...state.rules}:R.cp(R.defaults);}
 settings=()=>{
  const next=nextPresenters(),all=selectablePlayers(),r=settingsRules(),selected=(!state.round&&next.find(p=>p.id===state.presenter)?.id)||next.find(p=>p.id!==state.presenter)?.id||next[0]?.id;
  return `<section class="setup-topic whole-rules"><h3>次のお題</h3>${state.rulesSchema===1?'<p class="callout">今のお題は旧ルールを維持。次のお題から新ルールになります。</p>':''}<label for="presenter">出題する人</label><select id="presenter">${next.map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.name)}${(state.nextPlayers||[]).includes(p.id)?'（参加予約）':''}</option>`).join('')}</select>${state.cycle?.status==='active'?'<p class="small">一巡中は未出題の人から選びます。途中参加の人は次のお題で質問に参加し、次の一巡から出題順に入ります。</p>':''}<label for="scope">お題の範囲</label><input id="scope" maxlength="80" value="${esc(state.scope)}"><div id="initial-answer-row" ${selected===me?'':'hidden'}><label for="initial-answer">お題の答え <small>任意・出題者だけに表示</small></label><div class="answer-preview"><input id="initial-answer" type="password" maxlength="200" autocomplete="off" ${selected===me?'':'disabled'}><button type="button" id="rules-answer-visibility" aria-pressed="false">表示</button></div></div></section><section class="setup-rules whole-rules"><label for="play-mode">質問と回答の見え方</label><select id="play-mode"><option value="cooperative" ${state.playMode==='cooperative'?'selected':''}>協力・質問と回答を共有</option><option value="competitive" ${state.playMode==='competitive'?'selected':''}>対戦・自分の質問と回答だけ</option></select><label for="rule-preset">遊び方</label><select id="rule-preset"><option value="casual" ${r.preset==='casual'?'selected':''}>カジュアル</option><option value="dead" ${r.preset==='dead'?'selected':''}>デッド・解答の上限を調整</option></select><p class="rules-summary">質問は無料。解答は無料枠を使ったあと持ち点を消費します。得点は減りません。FinePlayは1〜3点。2人目からは1人増えるごとにSuper＋5点、全員から受けるとUltra＋20点。拍手は1人100回までです。</p><details id="rule-options" class="rule-options"><summary>点数・持ち点・お助けを調整</summary><div class="rules-number-grid">${field('initialPoints','最初の持ち点（初参加時）',r)}${field('freeGuessQuota','1人・1お題の無料解答枠',r)}${field('guessCost','無料枠のあとの解答費用',r)}${field('correctPoints','正解の得点（初期15）',r)}${field('comboPoints','Comboの追加得点',r)}${field('applausePoints','拍手1回の得点',r)}</div><label for="rule-limit">デッドの解答上限</label><select id="rule-limit"><option value="none" ${r.limit==='none'?'selected':''}>回数上限なし・払える間</option><option value="count" ${r.limit==='count'?'selected':''}>回数で止める</option><option value="points" ${r.limit==='points'?'selected':''}>持ち点で止める</option></select><div id="whole-count-field">${field('attempts','1人・1お題の解答上限',r)}</div><p class="small">持ち点は0未満になりません。無料の解答をお願いし、出題者が「しょうがないなあ」で1回許可できます。取消しても使用した解答枠・費用は戻りません。</p><label for="rule-customAnswerLabel">出題者の自由な回答</label><input id="rule-customAnswerLabel" maxlength="30" value="${esc(r.customAnswerLabel)}"><p class="small">表示名を変えても過去の回答の意味と当時の表示名は残ります。</p><fieldset class="rules-lifelines"><legend>お助け・4つの枠</legend>${r.lifelines.map(slot=>`<div class="rules-help-slot"><label class="rules-enabled"><input id="rule-help-enabled-${slot.id}" type="checkbox" ${slot.enabled?'checked':''}>${esc(slot.id==='custom'?'自由枠':R.defaults.lifelines.find(x=>x.id===slot.id).label)}を使う</label><label for="rule-help-label-${slot.id}">表示名<input id="rule-help-label-${slot.id}" maxlength="30" value="${esc(slot.label)}"></label><label for="rule-help-cost-${slot.id}">持ち点の費用<input id="rule-help-cost-${slot.id}" type="number" min="0" max="100" step="1" value="${slot.cost}"></label></div>`).join('')}</fieldset><p class="small">検索・AIヒントは内容を確認して自分で利用します。外部サービスへ自動送信しません。属性のお願いは出題者が回答します。</p></details><label for="mode">FinePlayの発表</label><select id="mode"><option value="live" ${state.mode==='live'?'selected':''}>その場で</option><option value="sealed" ${state.mode==='sealed'?'selected':''}>答え合わせの後</option></select><p class="small">対戦・あとで発表では、非公開の評価は持ち点に使えません。公開後に反映します。</p><p id="whole-rules-description" class="rules-summary" aria-live="polite"></p></section>${button('start','お題を用意する →','primary wide',all.length<2||!next.length)}`;
 };
 function sync(){
  if(!$('#rule-preset'))return;
  const casual=$('#rule-preset').value==='casual';$('#rule-limit').disabled=casual;$('#whole-count-field').hidden=casual||$('#rule-limit').value!=='count';
  $('#whole-rules-description').textContent=`無料解答 ${$('#rule-freeGuessQuota').value}回／お題 → 各${$('#rule-guessCost').value}持ち点。正解＋${$('#rule-correctPoints').value}点。拍手100回なら＋${100*Number($('#rule-applausePoints').value)}点。`;
  for(const slot of R.defaults.lifelines){const enabled=$('#rule-help-enabled-'+slot.id).checked;$('#rule-help-label-'+slot.id).disabled=!enabled;$('#rule-help-cost-'+slot.id).disabled=!enabled;}
 }
 bindSettings=()=>{
  const sel=$('#presenter');if(!sel)return;
  sel.onchange=()=>{const own=sel.value===me;$('#initial-answer-row').hidden=!own;$('#initial-answer').disabled=!own;$('#initial-answer').type='password';$('#rules-answer-visibility').textContent='表示';$('#rules-answer-visibility').setAttribute('aria-pressed','false');};
  on('rules-answer-visibility',()=>{const e=$('#initial-answer'),show=e.type==='password';e.type=show?'text':'password';$('#rules-answer-visibility').textContent=show?'隠す':'表示';$('#rules-answer-visibility').setAttribute('aria-pressed',String(show));});
  document.querySelectorAll('.whole-rules input,.whole-rules select').forEach(e=>{if(e.id!=='presenter'){e.addEventListener('input',sync);e.addEventListener('change',sync);}});sync();
 };
 startRound=()=>{
  try{const rules=readRules();send('start',{presenter:$('#presenter').value,scope:$('#scope').value,mode:$('#mode').value,playMode:$('#play-mode').value,secretAnswer:$('#presenter').value===me?$('#initial-answer').value:'',rules});}catch(e){toast(e.message);}
 };
 bind=()=>{previousBind();bindSettings();};
 render=()=>{
  const values=[...document.querySelectorAll('.whole-rules input,.whole-rules select')].map(e=>({id:e.id,value:e.value,checked:e.checked,type:e.type})),expanded=$('#rule-options')?.open,focused=document.activeElement?.id,start=document.activeElement?.selectionStart,end=document.activeElement?.selectionEnd;
  previousRender();
  for(const x of values){const e=$('#'+x.id);if(e){e.value=x.value;if(e.type==='checkbox')e.checked=x.checked;}}
  if(expanded&&$('#rule-options'))$('#rule-options').open=true;sync();
  if(focused&&$('#'+focused)){const e=$('#'+focused);e.focus({preventScroll:true});try{e.setSelectionRange(start,end);}catch{}}
 };
 render();
})();
