/* Navigation disclosure and a visible hint for the existing score carousel.
   No room state, game action, score projection or motion is owned here. */
(() => {
  'use strict';
  const mobile = matchMedia('(max-width: 640px)');
  let menuOpen = false, scheduled = false;
  const mounted = new WeakSet();

  function menuState(rail, toggle) {
    rail.classList.toggle('v1-mobile-nav-open', mobile.matches && menuOpen);
    toggle.setAttribute('aria-expanded', String(mobile.matches && menuOpen));
  }

  function mount() {
    const rail = document.querySelector('.rail'), nav = rail?.querySelector('nav');
    if (rail && nav) {
      if (!nav.id) nav.id = 'v1-mobile-nav';
      let toggle = rail.querySelector('.v1-mobile-nav-toggle');
      if (!toggle) {
        toggle = document.createElement('button');
        toggle.type = 'button'; toggle.className = 'v1-mobile-nav-toggle';
        toggle.textContent = 'メニュー'; toggle.setAttribute('aria-controls', nav.id);
        toggle.addEventListener('click', () => { menuOpen = !menuOpen; menuState(rail, toggle); });
        // Retain the original rail, links, form actions and their handlers.
        nav.before(toggle);
      }
      rail.classList.add('v1-mobile-nav-ready');
      menuState(rail, toggle);
      if (!mounted.has(nav)) {
        mounted.add(nav);
        nav.addEventListener('click', event => {
          // Keep button-triggered dialogs' original return-focus control visible.
          if (event.target.closest('a') && mobile.matches) { menuOpen = false; menuState(rail, toggle); }
        });
      }
    }

    const hud = document.getElementById('r3-hud'), heading = hud?.querySelector('.fp-hud-heading');
    const list = hud?.querySelector('.fp-hud-list');
    if (heading && list) {
      let hint = heading.querySelector('.v1-mobile-hud-hint');
      if (!hint) {
        hint = document.createElement('small'); hint.className = 'v1-mobile-hud-hint';
        hint.textContent = '左右にスワイプ →'; hint.setAttribute('aria-hidden', 'true');
        const result = heading.querySelector('.r6-result-trigger');
        if (result) result.before(hint); else heading.append(hint);
      }
      hint.hidden = list.scrollWidth <= list.clientWidth + 1;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; mount(); });
  }
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !mobile.matches || !menuOpen || document.querySelector('dialog[open]')) return;
    const rail = document.querySelector('.rail'), toggle = rail?.querySelector('.v1-mobile-nav-toggle');
    if (!toggle) return;
    event.preventDefault(); menuOpen = false; menuState(rail, toggle); toggle.focus({preventScroll: true});
  });
  document.addEventListener('click', event => {
    if (!mobile.matches || !menuOpen || document.querySelector('dialog[open]')) return;
    const rail = document.querySelector('.rail'), toggle = rail?.querySelector('.v1-mobile-nav-toggle');
    if (!toggle || rail.contains(event.target)) return;
    menuOpen = false; menuState(rail, toggle);
  });
  mobile.addEventListener('change', () => {
    menuOpen = false;
    const rail = document.querySelector('.rail'), toggle = rail?.querySelector('.v1-mobile-nav-toggle');
    // When the desktop navigation becomes a disclosure, retain accessible focus.
    if (mobile.matches && rail?.querySelector('nav')?.contains(document.activeElement)) toggle?.focus({preventScroll: true});
    schedule();
  });
  window.addEventListener('resize', schedule);
  new MutationObserver(schedule).observe(document.getElementById('app'), {childList: true, subtree: true});
  mount(); schedule();
})();
