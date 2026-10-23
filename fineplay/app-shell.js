/* Installable shell; game, scoring and saved-room authority stay in existing modules. */
(() => {
  'use strict';
  let registration, installPrompt, updateSelected = false, panel, preparationError = '';
  const node = (tag, text) => Object.assign(document.createElement(tag), {textContent: text});
  const activeRoom = () => typeof state !== 'undefined' && state && !demo;
  function paint() {
    const entry = document.querySelector('.entry-form');
    if (!entry) { panel?.remove(); return; }
    if (!panel) {
      panel = node('section', ''); panel.className = 'fp-app-section';
      const title = node('h3', 'いつものアイコンから、次の通話へ。');
      const message = node('p', ''); message.dataset.appStatus = '';
      message.setAttribute('role', 'status');
      const install = node('button', 'アプリを追加'); install.type = 'button'; install.dataset.appInstall = '';
      install.onclick = async () => {
        if (!installPrompt) return;
        const prompt = installPrompt; installPrompt = null; paint();
        try { await prompt.prompt(); await prompt.userChoice; }
        catch { if (typeof toast === 'function') toast('ブラウザのメニューからアプリを追加できます。'); }
        paint();
      };
      const update = node('button', '新版へ更新'); update.type = 'button'; update.dataset.appUpdate = '';
      update.onclick = () => {
        if (activeRoom() || !registration?.waiting) return;
        updateSelected = true;
        registration.waiting.postMessage({type:'FINEPLAY_UPDATE'});
      };
      const guide = node('details', ''); guide.append(node('summary', 'PC・スマホに追加するには'));
      guide.append(node('p', 'PCのChromeではメニューの「キャスト、保存、共有」からアプリとしてインストール。iPhoneではSafariの共有から「ホーム画面に追加」。Androidではブラウザのインストールまたはホーム画面追加を選びます。'));
      guide.append(node('p', '追加したアプリでは保存場所が分かれる場合があります。今の卓は「保存・復帰」から書き出して引き継いでください。仲間とのプレイにはインターネットと通話が必要です。'));
      panel.append(title, message, install, update, guide);
    }
    if (panel.parentElement !== entry) entry.append(panel);
    const waiting = registration?.waiting?.state === 'installed';
    const status = preparationError || (!navigator.onLine
      ? registration?.active?.state === 'activated'
        ? 'オフラインです。ひとり体験を利用できます。仲間との接続にはインターネットが必要です。'
        : 'オフラインです。接続してからオフライン利用を準備してください。'
      : waiting ? '新しい版があります。ほかのFINEPLAYの画面を閉じてから更新できます。'
      : registration?.active?.state === 'activated' ? 'ひとり体験をオフラインでも開けます。'
      : 'ブラウザでも、そのまま遊べます。');
    const output = panel.querySelector('[data-app-status]');
    if (output.textContent !== status) output.textContent = status;
    panel.querySelector('[data-app-install]').hidden = !installPrompt;
    const button = panel.querySelector('[data-app-update]');
    button.hidden = !waiting; button.disabled = !!activeRoom();
  }
  window.addEventListener('beforeinstallprompt', e => {e.preventDefault(); installPrompt = e; paint();});
  window.addEventListener('appinstalled', () => {installPrompt = null; paint();});
  window.addEventListener('online', paint); window.addEventListener('offline', paint);
  new MutationObserver(paint).observe(document.getElementById('app'), {childList:true, subtree:true});
  paint();
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'FINEPLAY_UPDATE_BUSY') {
      updateSelected = false;
      if (typeof toast === 'function') toast('ほかのFINEPLAYの画面を閉じてから更新してください。');
    }
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    paint();
    if (updateSelected) {updateSelected = false; location.reload();}
  });
  navigator.serviceWorker.register('./app-sw.js', {scope:'./', updateViaCache:'none'}).then(r => {
    registration = r;
    const watch = w => w?.addEventListener('statechange', paint);
    watch(r.installing); watch(r.waiting);
    r.addEventListener('updatefound', () => {watch(r.installing); paint();});
    navigator.serviceWorker.ready.then(paint); paint();
  }).catch(() => {
    preparationError = 'オフライン準備はできませんでした。オンラインではそのまま遊べます。';
    paint();
  });
})();
