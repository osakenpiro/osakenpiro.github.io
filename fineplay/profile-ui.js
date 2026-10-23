/* Optional local profile editor. Room authority, storage validation and score
   rules belong to their existing owners; this module owns presentation only. */
(() => {
  'use strict';
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const api = () => window.FPLocalProfile;
  const app = document.getElementById('app');
  let scheduled = false, entryContext = null, entryDraft = null;
  let originId = '', openContext = null, selectedIcon = 'default', localStatus = 'まだ保存していません。';
  let saved = null, remote = null, confirmationTimer = null;
  const known = id => Array.isArray(api()?.ICONS) && api().ICONS.some(icon => icon.id === id);

  function context() {
    if (typeof state === 'undefined' || !state || !Array.isArray(state.players) || typeof me !== 'string') return null;
    const self = state.players.find(player => player.id === me);
    if (!self) return null;
    const roomId = typeof room === 'string' ? room : '';
    const practice = typeof demo !== 'undefined' && demo;
    return {playerId:self.id, name:self.name, icon:known(self.icon) ? self.icon : 'default', presenter:self.id === state.presenter,
      roomId, key:JSON.stringify([roomId,self.id,!!practice]), practice:!!practice,
      canSend:typeof ready !== 'undefined' && ready && typeof busy !== 'undefined' && !busy && !state.locked &&
        (typeof synchronizationBlocked !== 'function' || !synchronizationBlocked())};
  }
  function load() {
    try { return api()?.load() || null; } catch { return null; }
  }
  function health() {
    try { return api()?.inspect() || {status:'unavailable'}; } catch { return {status:'unavailable'}; }
  }
  function initials(value) {
    const text = value.trim();
    if (!text) return '？';
    return typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter('ja', {granularity:'grapheme'}).segment(text)].slice(0,2).map(x => x.segment).join('')
      : Array.from(text).slice(0,2).join('');
  }
  function iconFace(icon, name, sizeClass = '', genie = false) {
    const face = create('span', 'fp-profile-face ' + sizeClass);
    face.setAttribute('aria-hidden','true');
    const source = known(icon) ? api().iconURL(icon) || (icon === 'default' && genie ? 'assets/genie-face.png' : '') : '';
    if (source) {
      const img = create('img'); img.src = source; img.alt = ''; img.width = 48; img.height = 48;
      img.addEventListener('error', () => face.replaceChildren(create('span','',initials(name))));
      face.append(img);
    } else face.append(create('span','',initials(name)));
    return face;
  }

  const dialog = create('dialog');
  dialog.id = 'fp-profile-dialog'; dialog.setAttribute('aria-labelledby','fp-profile-title');
  const header = create('header','fp-profile-header');
  const heading = create('h2','','プロフィール'); heading.id = 'fp-profile-title';
  const close = create('button','','閉じる'); close.type = 'button'; close.id = 'fp-profile-close';
  close.setAttribute('aria-label','プロフィールを閉じる');
  header.append(heading,close);
  const scope = create('p','fp-profile-scope');
  const currentRoom = create('p','fp-profile-current-room');
  const preview = create('div','fp-profile-preview');
  const form = create('form'); form.id = 'fp-profile-form';
  const label = create('label','','呼ばれたい名前'); label.htmlFor = 'fp-profile-name';
  const input = create('input'); input.id = 'fp-profile-name'; input.maxLength = 24;
  input.autocomplete = 'nickname'; input.required = true;
  const icons = create('fieldset','fp-profile-icons');
  const legend = create('legend','','アイコン');
  icons.append(legend);
  const iconNote = create('p','fp-profile-icon-note','「おまかせ」は、今のまじん・頭文字の表示を保ちます。');
  const local = create('p','fp-profile-local-state'); local.setAttribute('role','status'); local.setAttribute('aria-live','polite');
  const roomState = create('p','fp-profile-room-state'); roomState.setAttribute('role','status'); roomState.setAttribute('aria-live','polite');
  const actions = create('div','fp-profile-form-actions');
  const save = create('button','primary','この端末に保存'); save.type = 'submit'; save.id = 'fp-profile-save';
  const back = create('button','','戻る'); back.type = 'button';
  actions.append(save,back); form.append(label,input,icons,iconNote,local,roomState,actions);
  dialog.append(header,scope,currentRoom,preview,form);
  document.body.append(dialog);

  function remoteMessage() {
    if (!remote) return '';
    const label = remote.practice ? '体験の表示：' : '卓の表示：';
    if (remote.phase === 'pending') return label + '確認待ちです。';
    if (remote.phase === 'confirmed') return label + '反映しました。' + (remote.practice ? '実際の卓へは送信していません。' : '');
    if (remote.phase === 'rejected') return label + '反映できませんでした。' + (remote.error ? ' ' + remote.error : '');
    if (remote.phase === 'not-sent') return label + '未反映です。' + (remote.practice ? '操作できる状態になってから、もう一度保存できます。' : '接続が戻ってから、もう一度保存できます。');
    return label + '確認が届いていません。表示を確認してから、再度保存してください。';
  }
  function paintEditor() {
    preview.replaceChildren(iconFace(selectedIcon,input.value,'',openContext?.presenter),create('strong','',input.value.trim() || '名前を入れてください'));
    const defaultChoice = icons.querySelector('input[value="default"]')?.closest('label');
    const defaultKey = JSON.stringify([input.value,!!openContext?.presenter]);
    if (defaultChoice && defaultChoice.dataset.faceKey !== defaultKey) {
      defaultChoice.querySelector('.fp-profile-face')?.replaceWith(iconFace('default',input.value,'fp-profile-choice-face',openContext?.presenter));
      defaultChoice.dataset.faceKey = defaultKey;
    }
    const dirty = saved && (input.value !== saved.name || selectedIcon !== saved.icon);
    const localMessage = dirty && ['保存しました。','保存済みです。変更は保存するまで適用されません。'].includes(localStatus)
      ? '変更はまだ保存していません。前のプロフィールは保存済みです。' : localStatus;
    local.textContent = 'この端末：' + localMessage;
    const changedAfterSend = remote && (input.value.trim() !== remote.name || selectedIcon !== remote.icon);
    roomState.textContent = (changedAfterSend ? '前に保存した内容の' : '') + remoteMessage(); roomState.hidden = !remote;
    save.disabled = !input.value.trim() || health().blocked === true || remote?.phase === 'pending';
    save.textContent = openContext ? '端末に保存・卓に反映' : 'この端末に保存';
  }
  function roomResult(result) {
    if (!remote || !result || result.playerId !== remote.playerId) return false;
    if (result.roomId !== undefined && result.roomId !== remote.roomId) return false;
    if (result.name !== undefined && result.name !== remote.name) return false;
    if (result.icon !== undefined && result.icon !== remote.icon) return false;
    if (!['confirmed','rejected','unconfirmed'].includes(result.status)) return false;
    clearTimeout(confirmationTimer); confirmationTimer = null;
    remote.phase = result.status; remote.error = typeof result.error === 'string' ? result.error : '';
    paintEditor(); schedule(); return true;
  }
  function checkRoom() {
    if (!['pending','unconfirmed'].includes(remote?.phase)) return;
    const now = context();
    if (now?.key === remote.key && now.canSend && now.name === remote.name && now.icon === remote.icon) {
      roomResult({status:'confirmed',playerId:remote.playerId,name:remote.name,icon:remote.icon,roomId:remote.roomId});
    }
  }
  function applyToRoom(profile) {
    const now = context();
    if (!openContext) { remote = null; return; }
    remote = {...openContext,name:profile.name,icon:profile.icon,phase:'not-sent',error:''};
    if (!now || now.key !== openContext.key || !now.canSend || typeof send !== 'function') return;
    if (now.name === profile.name && now.icon === profile.icon) { remote.phase = 'confirmed'; return; }
    remote.phase = 'pending'; paintEditor();
    try { send('profile',{name:profile.name,icon:profile.icon}); }
    catch { remote.phase = 'rejected'; remote.error = '通信操作を開始できませんでした。'; }
    checkRoom();
    if (remote.phase === 'pending') confirmationTimer = setTimeout(() => {
      checkRoom();
      if (remote?.phase === 'pending') roomResult({status:'unconfirmed',playerId:remote.playerId,name:remote.name,icon:remote.icon,roomId:remote.roomId});
    },9500);
  }
  function buildIcons() {
    for (const child of [...icons.children]) if (child !== legend) child.remove();
    for (const icon of api().ICONS) {
      const choice = create('label','fp-profile-icon-choice');
      const radio = create('input'); radio.type = 'radio'; radio.name = 'fp-profile-icon';
      radio.value = icon.id; radio.checked = icon.id === selectedIcon;
      radio.addEventListener('change', () => { if (radio.checked) { selectedIcon = icon.id; paintEditor(); } });
      choice.append(radio,iconFace(icon.id,input.value,'fp-profile-choice-face',openContext?.presenter),create('span','',icon.label));
      icons.append(choice);
    }
  }
  function open(button) {
    if (!Array.isArray(api()?.ICONS) || typeof api()?.save !== 'function') return false;
    originId = button?.id || ''; openContext = context();
    const profile = load(); saved = profile;
    if (!openContext || remote?.key !== openContext.key) {
      remote = null; clearTimeout(confirmationTimer); confirmationTimer = null;
    }
    input.value = profile?.name || (openContext && !openContext.practice ? openContext.name : document.getElementById('nickname')?.value || '');
    selectedIcon = known(profile?.icon) ? profile.icon : openContext?.icon || 'default';
    localStatus = profile ? '保存済みです。変更は保存するまで適用されません。' : health().blocked
      ? '既存プロフィールを読み込めません。元データは残しています。保存せずに遊べます。' : 'まだ保存していません。保存せずに遊べます。';
    scope.textContent = openContext
      ? openContext.practice ? '名前・アイコンをこの端末のブラウザに覚え、体験の表示も変更します。登録は不要です。'
        : '名前・アイコンをこの端末のブラウザに覚え、いまの卓の表示も変更します。得点・履歴は同じプレイヤーに残ります。'
      : '名前・アイコンをこの端末のブラウザに覚えます。登録は不要です。元の卓への復帰情報とは別です。';
    currentRoom.textContent = openContext ? (openContext.practice ? '体験の現在の表示：' : '卓の現在の表示：') + openContext.name : '';
    currentRoom.hidden = !openContext;
    buildIcons(); paintEditor();
    if (!dialog.open) dialog.showModal(); input.focus(); return true;
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); if (save.disabled) return;
    let result;
    try { result = api().save({name:input.value,icon:selectedIcon}); }
    catch { result = {ok:false,error:'プロフィールを保存できません。入力は残しています。'}; }
    if (!result?.ok || !result.profile) {
      localStatus = typeof result?.error === 'string' ? result.error : '保存できません。入力は残しています。';
      paintEditor(); return;
    }
    saved = result.profile; localStatus = '保存しました。';
    input.value = saved.name; selectedIcon = saved.icon;
    const nickname = document.getElementById('nickname');
    if (nickname) { entryDraft = saved.name; nickname.value = saved.name; }
    applyToRoom(saved); paintEditor(); schedule();
  });
  input.addEventListener('input',paintEditor);
  close.addEventListener('click',() => dialog.close()); back.addEventListener('click',() => dialog.close());
  dialog.addEventListener('close',() => {
    const original = originId && document.getElementById(originId);
    let target = original || document.getElementById('fp-profile-open-self') || document.getElementById('fp-profile-open-entry');
    if (target?.closest('[hidden]')) target = target.closest('.fp-hud-player')?.querySelector('.r5-hud-detail-toggle');
    if (target?.isConnected && !target.closest('[hidden]')) target.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown',event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(node=>node.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first?.focus(); }
  });

  const boundInputs = new WeakSet();
  function mount() {
    if (!Array.isArray(api()?.ICONS) || !app) return;
    checkRoom();
    const nickname = document.getElementById('nickname');
    if (nickname) {
      const key = typeof room === 'string' ? room : location.hash;
      if (entryContext !== key) { entryContext = key; entryDraft = null; }
      const profile = load();
      if (entryDraft !== null) nickname.value = entryDraft;
      else if (!nickname.value && profile) nickname.value = profile.name;
      if (!boundInputs.has(nickname)) {
        boundInputs.add(nickname); nickname.addEventListener('input',()=>{entryDraft=nickname.value;schedule();});
      }
      let row = nickname.closest('.fp-profile-entry-row');
      if (!row) { row = create('div','fp-profile-entry-row'); nickname.before(row); row.append(nickname); }
      let button = row.querySelector('#fp-profile-open-entry');
      if (!button) {
        button=create('button','fp-profile-entry-button'); button.type='button'; button.id='fp-profile-open-entry';
        button.append(create('span','','プロフィール'));
        button.addEventListener('click',()=>open(button)); row.append(button);
      }
      const faceKey=JSON.stringify([profile?.icon || 'default',profile?.name || nickname.value]);
      if (button.dataset.profileFace !== faceKey) {
        button.querySelector('.fp-profile-face')?.remove();
        button.prepend(iconFace(profile?.icon || 'default',profile?.name || nickname.value,'fp-profile-entry-face'));
        button.dataset.profileFace=faceKey;
      }
    }
    const now=context();
    if (now) {
      const slot=[...app.querySelectorAll('[data-fp-hud-actions]')].find(node=>node.dataset.fpHudActions===now.playerId);
      if (slot && !slot.querySelector('#fp-profile-open-self')) {
        const button=create('button','fp-profile-self-button','プロフィールを編集'); button.id='fp-profile-open-self'; button.type='button';
        button.addEventListener('click',()=>open(button)); slot.append(button);
      }
      if (slot) {
        let notice=slot.querySelector('.fp-profile-slot-state');
        if (remote && remote.key===now.key) {
          if (!notice) { notice=create('small','fp-profile-slot-state'); notice.setAttribute('role','status'); slot.append(notice); }
          const message=remoteMessage(); if (notice.textContent!==message) notice.textContent=message;
        } else notice?.remove();
      }
    }
    if (dialog.open) paintEditor();
  }
  function schedule() {
    if (scheduled) return; scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;mount();});
  }
  if (app) new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  window.FPProfileUI = Object.freeze({open,mount,paint:mount,roomResult,inspect:()=>({local:health().status,room:remote?.phase || 'none',editing:dialog.open})});
  mount();
})();
