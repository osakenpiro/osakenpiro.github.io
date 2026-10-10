/* R5: move existing public status and topic vote controls into the action tile. */
(() => {
  'use strict';
  const previousRender = render;
  const make = (tag, className, text) => {
    const node = document.createElement(tag); node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function paint() {
    const tile = document.querySelector('.layout-action');
    const anticipating = window.FPR3?.anticipating();
    const active = !!state && state.phase === 'playing' && !!tile && !anticipating;
    // R3 retains the last public tile during anticipation. Keep that tile's
    // existing presentation without reading or inserting the new verdict.
    document.body.classList.toggle('r5-main-status-active', active || !!(anticipating && tile?.querySelector(':scope > .r5-main-header')));
    if (!active) return;
    const focused = document.activeElement;
    let head = tile.querySelector(':scope > .r5-main-header');
    if (!head) { head = make('div', 'r5-main-header'); tile.prepend(head); }
    const status = document.getElementById('layout-status');
    if (status) {
      // Keep the live status, connection text and asynchronously inserted sync
      // notice as one original subtree. No copied text or new state projection.
      status.classList.add('r5-main-game-status');
      if (!status.hasAttribute('role')) status.setAttribute('role', 'status');
      if (status.parentElement !== head) head.prepend(status);
    }
    const asker = me !== state.presenter && !state.spectator && state.role !== 'spectator' && !state.locked;
    const palette = document.querySelector('.attrs-fp-palette[data-attrs-target="problem"]');
    if (asker && palette) {
      let vote = head.querySelector(':scope > .r5-main-topic-vote');
      if (!vote) {
        vote = make('div', 'r5-main-topic-vote');
        vote.append(make('span', 'r5-main-vote-label', 'お題に'));
        head.append(vote);
      }
      // Retain the original open property, disabled state, options and handlers.
      // The engine still decides who may rate and whether the rating is public.
      if (palette.parentElement !== vote) vote.append(palette);
      if (palette.open) window.dispatchEvent(new Event('resize'));
    }
    // Remove only empty containers belonging to this module or an empty old
    // topic-vote panel. Preserve topic, hints, presenter controls and result UI.
    for (const empty of document.querySelectorAll('.r5-main-topic-vote:empty,.r5-main-header:empty,.problem-fp:empty')) empty.remove();
    if (focused && focused !== document.body && focused.isConnected && document.activeElement !== focused && head.contains(focused)) {
      focused.focus({preventScroll: true});
    }
  }
  render = (...args) => { const value = previousRender(...args); paint(); return value; };
  paint();
})();
