/* FinePlay R3: presentation only; call only for an authoritative public verdict. */
(() => {
  'use strict';
  const scriptURL = document.currentScript?.src || new URL('fineplay/lamp-reveal.js', document.baseURI).href;
  const asset = name => new URL('assets/lamp/' + name, scriptURL).href;
  const mounted = new WeakMap();
  function mount(container, options = {}) {
    if (!container?.appendChild) throw new TypeError('A DOM container is required');
    mounted.get(container)?.destroy();
    const doc = container.ownerDocument;
    const make = (tag, cls, text) => {
      const node = doc.createElement(tag); node.className = cls;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const root = make('section', 'fp-lamp');
    root.setAttribute('aria-label', '答えの魔法ランプ');
    const art = make('div', 'fp-lamp-art'); art.setAttribute('aria-hidden', 'true');
    const aura = make('div', 'fp-lamp-aura');
    const puff = make('div', 'fp-lamp-puff');
    for (let i = 0; i < 5; i++) puff.appendChild(make('i', 'fp-lamp-cloud'));
    const vessel = make('div', 'fp-lamp-vessel');
    for (const part of ['body', 'lid']) {
      const img = make('img', 'fp-lamp-' + part); img.src = asset(part + '.svg'); img.alt = '';
      img.width = 360; img.height = 240; vessel.appendChild(img);
    }
    art.append(aura, puff, vessel);
    const status = make('p', 'fp-lamp-status', '答えは、ランプの中に。');
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    const answer = make('p', 'fp-lamp-answer'); answer.hidden = true;
    const skip = make('button', 'fp-lamp-skip', '演出をスキップ'); skip.type = 'button'; skip.hidden = true;
    root.append(art, status, answer, skip); container.appendChild(root);
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let active = null, dead = false, round = null;
    const seen = new Map(), retired = new Set();
    const state = value => { root.dataset.state = value; };
    state('idle');
    function notify(name, event) {
      try {
        const result = options[name]?.(event);
        if (result?.then) Promise.resolve(result).catch(error => console.error('FPLampReveal callback:', error));
      } catch (error) { console.error('FPLampReveal callback:', error); }
    }
    function finish(run) {
      if (active !== run) return;
      clearTimeout(run.timer); active = null; skip.hidden = true; state('complete');
      run.resolve(); notify('onComplete', run.event);
    }
    function reveal(run, immediate = false) {
      if (active !== run) return;
      clearTimeout(run.timer);
      if (!run.revealed) {
        run.revealed = true;
        root.dataset.outcome = run.event.outcome;
        if (run.event.outcome === 'correct') {
          state('correct-open');
          answer.textContent = run.event.answerText || '正解'; answer.hidden = false;
          status.textContent = '正解！ ' + (run.event.answerText || 'ランプが開きました。');
          notify('onReveal', run.event);
        } else {
          state('incorrect-settle'); status.textContent = '不正解。ランプはまだ開きません。';
          notify('onReveal', run.event);
        }
      }
      if (active !== run) return; // A callback may cancel, destroy, or start a new event.
      if (immediate) finish(run);
      else run.timer = setTimeout(() => finish(run), run.event.outcome === 'correct' ? 720 : 260);
    }
    function cancel() {
      if (active) { clearTimeout(active.timer); const run = active; active = null; run.resolve(); }
      if (dead) return;
      state('idle'); delete root.dataset.outcome; answer.textContent = ''; answer.hidden = true;
      skip.hidden = true; status.textContent = '答えは、ランプの中に。';
    }
    function play(input) {
      if (dead) return Promise.resolve();
      if (!input || typeof input.eventId !== 'string' || !input.eventId ||
          typeof input.roundId !== 'string' || !input.roundId ||
          !['correct', 'incorrect'].includes(input.outcome) ||
          (input.answerText !== undefined && typeof input.answerText !== 'string')) {
        return Promise.reject(new TypeError('Expected an authoritative lamp event'));
      }
      const key = JSON.stringify([input.roundId, input.eventId]);
      if (seen.has(key)) return seen.get(key);
      if (retired.has(input.roundId)) return Promise.resolve();
      cancel();
      if (round !== null && round !== input.roundId) retired.add(round);
      round = input.roundId;
      // Do not retain an answer at all for an incorrect outcome.
      const event = Object.freeze({ eventId: input.eventId, roundId: input.roundId, outcome: input.outcome,
        ...(input.outcome === 'correct' && input.answerText !== undefined ? { answerText: input.answerText } : {}) });
      let resolve; const promise = new Promise(done => { resolve = done; });
      const run = { event, resolve, timer: null, revealed: false };
      seen.set(key, promise); active = run;
      // FNV-1a hashes only the public event ID, never the verdict or answer.
      let hash = 2166136261;
      for (let i = 0; i < event.eventId.length; i++) hash = Math.imul(hash ^ event.eventId.charCodeAt(i), 16777619);
      const pattern = (hash >>> 0) % 3, duration = [960, 1180, 1400][pattern];
      root.dataset.rhythm = String(pattern); root.style.setProperty('--fp-lamp-duration', duration + 'ms');
      state('anticipation'); status.textContent = 'ランプが、ことこと……'; skip.hidden = false;
      if (media?.matches) queueMicrotask(() => reveal(run, true));
      else run.timer = setTimeout(() => reveal(run), duration);
      return promise;
    }
    const skipNow = () => { if (active) reveal(active, true); };
    const motionChange = () => { if (media.matches) skipNow(); };
    skip.addEventListener('click', skipNow); media?.addEventListener?.('change', motionChange);
    function destroy() {
      if (dead) return; cancel(); dead = true;
      skip.removeEventListener('click', skipNow); media?.removeEventListener?.('change', motionChange);
      root.remove(); seen.clear(); retired.clear(); mounted.delete(container);
    }
    const api = { play, cancel, destroy }; mounted.set(container, api); return api;
  }
  window.FPLampReveal = Object.freeze({ mount });
})();
