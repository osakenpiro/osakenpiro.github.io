/* Wide score HUD: move public presentation nodes, retain all bound controls. */
(() => {
  'use strict';
  const previousRender = render;
  let observed = null, queued = false, detailSerial = 0;
  const create = (tag, className, text) => {
    const node = document.createElement(tag); node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const direct = (card, selector) => card.querySelector(selector);

  function arrangeDetails(card) {
    let detail = direct(card, '.r5-hud-detail');
    if (!detail) {
      detail = create('div', 'r5-hud-detail');
      const summary = create('button', 'r5-hud-detail-toggle', '詳細');
      summary.type = 'button';
      const identity = ++detailSerial;
      detail.id = 'r5-hud-detail-' + identity;
      summary.id = 'r5-hud-detail-toggle-' + identity;
      summary.setAttribute('aria-controls', detail.id);
      summary.setAttribute('aria-expanded', 'false');
      detail.setAttribute('role', 'group');
      detail.setAttribute('aria-labelledby', summary.id);
      detail.hidden = true;
      const content = create('div', 'r5-hud-detail-content');
      detail.append(content); card.append(summary, detail);
      // One lightweight disclosure opens the existing award/readback sections.
      // A native button supplies Enter / Space activation. Original summaries
      // remain operable inside the full-width disclosure.
      summary.addEventListener('click', () => {
        detail.hidden = !detail.hidden;
        summary.setAttribute('aria-expanded', String(!detail.hidden));
        if (!detail.hidden) for (const section of content.querySelectorAll('.fp-hud-awards,.earned-readback')) {
          if (!section.hidden) section.open = true;
        }
      });
    }
    const name = direct(card, '.fp-hud-name')?.textContent || 'この人';
    const toggle = direct(card, '.r5-hud-detail-toggle');
    const label = name + 'の役割・得点内訳・詳細';
    if (toggle.getAttribute('aria-label') !== label) toggle.setAttribute('aria-label', label);
    const content = detail.querySelector('.r5-hud-detail-content');
    const nodes = ['.fp-hud-role','.earned-topic','.fp-hud-awards','.earned-readback','.fp-hud-actions']
      .map(selector => direct(card, selector)).filter(Boolean);
    nodes.forEach((node, index) => {
      if (content.children[index] !== node) content.insertBefore(node, content.children[index] || null);
    });
  }

  function spreadPile(card) {
    const pile = direct(card, '.fp-hud-pile'); if (!pile) return;
    const icons = [...pile.querySelectorAll('.fp-hud-earned')];
    icons.forEach((icon, index) => {
      // A bounded representative pile spreads across the available right side.
      // Preserve the original type, asset, stacking order and subtle rotation.
      icon.style.setProperty('--r5-pile-offset', icons.length === 1 ? '.5' : String(index / (icons.length - 1)));
      icon.style.setProperty('--r5-pile-rise', (index % 3) * 4 + 'px');
    });
    // A hidden section may retain its old summary DOM across a privacy change.
    // Only a currently visible public award section can supply a remainder.
    const awardSection = direct(card, '.fp-hud-awards');
    const match = !awardSection?.hidden && awardSection?.querySelector('.fp-hud-awards-summary')?.textContent.match(/^ほか (\d+)個/);
    let more = pile.querySelector('.r5-hud-pile-more');
    if (!match) { more?.remove(); return; }
    if (!more) { more = create('small', 'r5-hud-pile-more'); pile.append(more); }
    const text = '+' + match[1]; if (more.textContent !== text) more.textContent = text;
    more.title = '表示していない獲得アイコン ' + match[1] + '個。詳細の内訳で全数を確認';
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; if (!window.FPR3?.anticipating()) paint(); });
  }
  const observer = new MutationObserver(schedule);
  function paint() {
    const hud = document.getElementById('r3-hud');
    const wide = hud && (hud.classList.contains('r5-scores-wide') || document.body.classList.contains('r5-scores-wide-active'));
    if (!wide) { observed?.classList.remove('r5-wide-hud'); observer.disconnect(); observed = null; return; }
    hud.classList.add('r5-wide-hud');
    if (observed !== hud) { observer.disconnect(); observed = hud; observer.observe(hud, {childList:true,subtree:true}); }
    for (const card of hud.querySelectorAll('.fp-hud-player')) { arrangeDetails(card); spreadPile(card); }
  }
  render = (...args) => {
    const focused = document.activeElement;
    const restoreFocus = observed?.contains(focused);
    const value = previousRender(...args);
    if (!window.FPR3?.anticipating()) paint();
    // The preceding placement module moves the HUD after R3 restores focus.
    // Restore the same connected public control once its final placement exists.
    if (restoreFocus && focused?.isConnected && !focused.closest('[hidden]') && document.activeElement !== focused) {
      focused.focus({preventScroll:true});
    }
    return value;
  };
  window.FPR5WideHUD = Object.freeze({paint});
  window.addEventListener('pagehide', () => observer.disconnect());
  paint();
})();
