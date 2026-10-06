/* Additive presentation only; the existing viewer projection owns all content. */
(() => {
  'use strict';
  if (typeof render !== 'function' || typeof scene !== 'function') return;
  const previousRender = render, previousScene = scene;
  let currentCard = null;
  scene = (...args) => {
    const html = previousScene(...args);
    const template = document.createElement('template');
    template.innerHTML = html;
    currentCard = template.content.querySelector('.fp-card');
    return html;
  };
  function paint() {
    const active = !!document.querySelector('#layout-topic');
    document.documentElement.classList.toggle('fp-crystal', active);
    const surface = document.querySelector('.layout-action');
    if (!surface || !active) return;
    const topic = document.querySelector('#layout-topic');
    if (surface.parentElement === topic.parentElement) topic.before(surface);
    // The existing layout removes the latest answered card. Retain its read-only
    // question/reply markup; all correction/FP controls remain in native history.
    if (!surface.querySelector('.fp-card') && currentCard && !state.locked && !state.pending) {
      const card = currentCard.cloneNode(true);
      card.querySelectorAll('button, .vote, .sealed-note').forEach(n => n.remove());
      surface.prepend(card);
    }
    const card = surface.querySelector('.fp-card');
    if (card) {
      if (surface.id === 'presentation-current') surface.removeAttribute('id');
      card.id = 'presentation-current';
      if (state.pending && !card.querySelector('.crystal-wait')) {
        const wait = document.createElement('p');
        wait.className = 'crystal-wait'; wait.textContent = '回答待ち';
        card.append(wait);
      }
    }
  }
  render = (...args) => {currentCard = null; const result = previousRender(...args); paint(); return result;};
  render();
})();
