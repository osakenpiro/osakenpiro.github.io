/* FinePlay R3: presentation only; call only for an authoritative public verdict. */
(() => {
  'use strict';
  const scriptURL = document.currentScript?.src || new URL('fineplay/lamp-reveal.js', document.baseURI).href;
  const asset = name => new URL('assets/lamp/' + name, scriptURL).href;
  const manifestURL = asset('r5-manifest.json');
  const PACK_VERSION = 'fineplay-lamp-raster/1';
  const ATLAS_VERSION = 'fineplay-lamp-atlas/1';
  const safeRasterPath = value => typeof value === 'string' && /^assets\/lamp\/r5\/[a-z0-9][a-z0-9_-]*\.(png|webp)$/i.test(value);
  let clipSequence = 0;
  function validateAssetPack(input) {
    if (!input || ![PACK_VERSION, ATLAS_VERSION].includes(input.version) || input.noText !== true || input.transparent !== true ||
        !Number.isInteger(input.width) || !Number.isInteger(input.height) ||
        input.width < 1 || input.height < 1 || input.width > 4096 || input.height > 4096 ||
        input.width * 2 !== input.height * 3) throw new TypeError('Invalid lamp raster pack declaration');
    if (input.version === ATLAS_VERSION) {
      if (!safeRasterPath(input.atlas) || !Number.isInteger(input.atlasWidth) || !Number.isInteger(input.atlasHeight) ||
          input.atlasWidth < 1 || input.atlasHeight < 1 || input.atlasWidth > 4096 || input.atlasHeight > 4096) throw new TypeError('Invalid lamp atlas');
      const parts = {};
      for (const name of ['body', 'lid', 'smoke']) {
        const part = input.parts?.[name], clip = part?.clip;
        if (!Array.isArray(clip) || clip.length !== 4 || !clip.every(Number.isFinite) ||
            clip[0] < 0 || clip[1] < 0 || clip[2] <= 0 || clip[3] <= 0 ||
            clip[0] + clip[2] > input.atlasWidth || clip[1] + clip[3] > input.atlasHeight ||
            !Number.isFinite(part.x) || !Number.isFinite(part.y) || Math.abs(part.x) > 4096 || Math.abs(part.y) > 4096 ||
            !Number.isFinite(part.scale) || part.scale <= 0 || part.scale > 4) throw new TypeError('Invalid lamp atlas placement');
        parts[name] = Object.freeze({ clip: Object.freeze([...clip]), x: part.x, y: part.y, scale: part.scale });
      }
      return Object.freeze({ version: ATLAS_VERSION, width: input.width, height: input.height, noText: true, transparent: true,
        atlas: input.atlas, atlasWidth: input.atlasWidth, atlasHeight: input.atlasHeight, parts: Object.freeze(parts) });
    }
    const paths = {};
    for (const part of ['body', 'lid', 'smoke']) {
      const value = input[part];
      if (!safeRasterPath(value)) {
        throw new TypeError('Invalid lamp raster part path');
      }
      paths[part] = value;
    }
    if (new Set(Object.values(paths)).size !== 3) throw new TypeError('Lamp raster parts must be distinct');
    return Object.freeze({ version: PACK_VERSION, width: input.width, height: input.height,
      noText: true, transparent: true, ...paths });
  }
  let defaultPackPromise;
  function readDefaultPack() {
    if (typeof fetch !== 'function') return Promise.resolve(null);
    return defaultPackPromise ||= fetch(manifestURL, { credentials: 'same-origin' }).then(response => {
      if (!response.ok) return null;
      return response.json();
    }).then(input => input?.enabled === true ? validateAssetPack(input) : null).catch(() => null);
  }
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
    let rasterSmoke = null;
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
    const assetController = new AbortController();
    const fallbackImages = Array.from(vessel.children);
    root.dataset.assetStatus = 'r4-fallback';
    function restoreFallback() {
      if (dead) return;
      vessel.replaceChildren(...fallbackImages);
      rasterSmoke?.remove(); rasterSmoke = null;
      delete root.dataset.assetPack; root.dataset.assetStatus = 'r4-fallback';
    }
    const hideRasterSmoke = hidden => rasterSmoke?.toggleAttribute('hidden', hidden);
    function atlasPart(pack, part, url) {
      const ns = 'http://www.w3.org/2000/svg', placement = pack.parts[part];
      const svg = doc.createElementNS(ns, 'svg'); svg.setAttribute('class', 'fp-lamp-' + part);
      svg.setAttribute('viewBox', `0 0 ${pack.width} ${pack.height}`); svg.setAttribute('aria-hidden', 'true');
      const defs = doc.createElementNS(ns, 'defs'), clip = doc.createElementNS(ns, 'clipPath');
      const id = 'fp-lamp-clip-' + ++clipSequence; clip.setAttribute('id', id); clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
      const rect = doc.createElementNS(ns, 'rect');
      for (const [index, name] of ['x', 'y', 'width', 'height'].entries()) rect.setAttribute(name, placement.clip[index]);
      clip.appendChild(rect); defs.appendChild(clip); svg.appendChild(defs);
      const group = doc.createElementNS(ns, 'g'); group.setAttribute('transform', `translate(${placement.x} ${placement.y}) scale(${placement.scale})`);
      const image = doc.createElementNS(ns, 'image'); image.setAttribute('href', url);
      image.setAttribute('width', pack.atlasWidth); image.setAttribute('height', pack.atlasHeight); image.setAttribute('clip-path', `url(#${id})`);
      image.addEventListener('error', restoreFallback, { once: true }); group.appendChild(image); svg.appendChild(group);
      return svg;
    }
    async function loadRasterPart(pack, part) {
      const img = make('img', 'fp-lamp-' + part); img.alt = '';
      img.width = pack.width; img.height = pack.height;
      const url = new URL(pack[part], scriptURL).href;
      await new Promise((resolve, reject) => {
        const abort = () => { img.src = ''; reject(new Error('Lamp asset loading cancelled')); };
        img.onload = () => { assetController.signal.removeEventListener('abort', abort); resolve(); };
        img.onerror = () => { assetController.signal.removeEventListener('abort', abort); reject(new Error('Lamp raster image unavailable')); };
        assetController.signal.addEventListener('abort', abort, { once: true });
        if (assetController.signal.aborted) return abort();
        img.src = url;
      });
      img.onload = img.onerror = null;
      if (img.naturalWidth !== pack.width || img.naturalHeight !== pack.height) throw new TypeError('Lamp raster canvas mismatch');
      const canvas = doc.createElement('canvas'); canvas.width = pack.width; canvas.height = pack.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Lamp transparency inspection unavailable');
      context.drawImage(img, 0, 0);
      const pixels = context.getImageData(0, 0, pack.width, pack.height).data;
      let hasTransparent = false, hasArtwork = false;
      for (let i = 3; i < pixels.length && !(hasTransparent && hasArtwork); i += 4) {
        hasTransparent ||= pixels[i] === 0; hasArtwork ||= pixels[i] > 0;
      }
      if (!hasTransparent || !hasArtwork) throw new TypeError('Lamp raster needs artwork on a transparent canvas');
      return img;
    }
    const requestedPack = options.assetPack === undefined ? readDefaultPack() :
      Promise.resolve().then(() => options.assetPack === null ? null : validateAssetPack(options.assetPack));
    requestedPack.then(async pack => {
      if (!pack || dead) return;
      root.dataset.assetStatus = 'loading';
      let body, lid, smoke;
      if (pack.version === ATLAS_VERSION) {
        const img = await loadRasterPart({ width: pack.atlasWidth, height: pack.atlasHeight, body: pack.atlas }, 'body');
        [body, lid, smoke] = ['body', 'lid', 'smoke'].map(part => atlasPart(pack, part, img.src));
      } else [body, lid, smoke] = await Promise.all(['body', 'lid', 'smoke'].map(part => loadRasterPart(pack, part)));
      if (dead) return;
      for (const img of [body, lid, smoke]) img.addEventListener('error', restoreFallback, { once: true });
      smoke.toggleAttribute('hidden', root.dataset.outcome !== 'correct'); rasterSmoke = smoke;
      vessel.replaceChildren(body, lid); puff.appendChild(smoke);
      root.dataset.assetPack = pack.version; root.dataset.assetStatus = pack.version === ATLAS_VERSION ? 'r5-atlas' : 'r5-raster';
    }).catch(() => restoreFallback());
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
          hideRasterSmoke(false);
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
      hideRasterSmoke(true);
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
      assetController.abort();
      skip.removeEventListener('click', skipNow); media?.removeEventListener?.('change', motionChange);
      root.remove(); seen.clear(); retired.clear(); mounted.delete(container);
    }
    const api = { play, cancel, destroy }; mounted.set(container, api); return api;
  }
  window.FPLampReveal = Object.freeze({ mount, validateAssetPack });
})();
