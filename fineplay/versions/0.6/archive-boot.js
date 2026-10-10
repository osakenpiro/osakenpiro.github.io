/* Archive-only safety wrapper. Historical gameplay files are not modified. */
(() => {
  'use strict';
  const family = '0.6';
  const savedVersion = '0.6';
  const base = new URL('.', document.currentScript.src);
  const prefix = `fineplay:archive:${family}:`;
  const isolatedStorage = native => Object.freeze({
    getItem: key => native.getItem(prefix + String(key)),
    setItem: (key, value) => native.setItem(prefix + String(key), String(value)),
    removeItem: key => native.removeItem(prefix + String(key)),
    key: index => Object.keys(native).filter(key => key.startsWith(prefix))[index]?.slice(prefix.length) ?? null,
    clear: () => Object.keys(native).filter(key => key.startsWith(prefix)).forEach(key => native.removeItem(key)),
    get length() { return Object.keys(native).filter(key => key.startsWith(prefix)).length; }
  });
  // Fail closed if the environment cannot establish storage separation.
  for (const name of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(window, name, { value: isolatedStorage(window[name]), configurable: false, writable: false });
  }
  const blocked = function () { throw new Error('Historical archive: multiplayer and external connections are disabled.'); };
  for (const name of ['Peer', 'WebSocket', 'RTCPeerConnection', 'webkitRTCPeerConnection']) {
    Object.defineProperty(window, name, { value: blocked, configurable: false, writable: false });
  }
  const url = new URL(location.href);
  const incomingRoom = url.hash.includes('r=') || ['room', 'r', 'invite'].some(key => url.searchParams.has(key));
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (!['demo', 'role', 'screen', 'mode', 'intro'].includes(key)) url.searchParams.delete(key);
  }
  url.searchParams.set('demo', '1');
  if (!['asker', 'genie'].includes(url.searchParams.get('role'))) url.searchParams.delete('role');
  history.replaceState(null, '', url.pathname + url.search);
  const allowed = href => {
    const target = new URL(href, location.href);
    const nestedSourceOnly = target.pathname.startsWith(base.pathname + 'versions/') || target.pathname.startsWith(base.pathname + 'research/');
    return !nestedSourceOnly && target.origin === base.origin && (target.pathname.startsWith(base.pathname) ||
      (['/fineplay/', '/fineplay/updates/'].includes(target.pathname) && !target.search && !target.hash));
  };
  window.open = (href, target) => {
    if (!allowed(href)) return null;
    // No separate browsing context or invite propagation from this isolated client.
    location.assign(new URL(href, location.href));
    return null;
  };
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (anchor && !allowed(anchor.href)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  function decorate() {
    if (!document.getElementById('archive-notice')) {
      const banner = document.createElement('aside');
      banner.id = 'archive-notice';
      banner.setAttribute('aria-label', '保存版の案内');
      const latest = new URL('../../', base).pathname;
      banner.innerHTML = `<div><strong>FINEPLAY ${family}系（保存時 ${savedVersion}）</strong><span>保存版 · この端末だけのひとり体験。通信対戦・部屋への参加は無効です。</span></div><nav aria-label="保存版メニュー"><a href="${base.pathname}?demo=1&role=asker">質問役を遊ぶ</a><a href="${base.pathname}?demo=1&role=genie">回答役を遊ぶ</a><a href="${base.pathname}?demo=1">自由に試す</a><a href="${latest}updates/">更新履歴へ</a><a href="${latest}">最新版へ</a></nav>${incomingRoom ? '<p role="status">招待情報を取り除きました。既存の部屋には接続していません。</p>' : ''}`;
      document.body.prepend(banner);
    }
    for (const anchor of document.querySelectorAll('a[href]')) {
      if (anchor.origin === base.origin && anchor.pathname === base.pathname + 'updates/') {
        anchor.href = new URL('../../updates/', base).pathname;
      }
      if (!allowed(anchor.href)) {
        anchor.removeAttribute('href'); anchor.setAttribute('aria-disabled', 'true');
        anchor.title = '保存版では外部への移動を無効にしています';
      } else if (/部屋をつくる|本番の部屋/.test(anchor.textContent)) {
        anchor.textContent = '保存版のひとり体験へ';
      }
    }
    for (const button of document.querySelectorAll('[data-assist-search]')) {
      button.disabled = true;
      if (button.textContent !== '保存版では外部検索は利用できません') button.textContent = '保存版では外部検索は利用できません';
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.title = 'FINEPLAY ' + savedVersion + '（保存版）— いい質問に、拍手。';
    decorate();
    new MutationObserver(decorate).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  });
  Object.defineProperty(window, 'FinePlayArchive', { value: Object.freeze({family, savedVersion, prefix, incomingRoom, mode:'local-only'}), writable:false });
})();
