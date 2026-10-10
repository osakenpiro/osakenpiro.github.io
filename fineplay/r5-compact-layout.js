/* R5 density follow-up. Wide scores and decorative prompt omission are candidates. */
(() => {
  'use strict';

  const previousRender = render;
  const scorePlacement = new URLSearchParams(location.search).get('r5scores') === 'wide' ? 'wide' : 'compact';
  const sidebarPreference = 'fineplay:r5:sidebar-collapsed';
  const desktop = matchMedia('(min-width: 1181px)');
  let collapsed = false;
  try { collapsed = localStorage.getItem(sidebarPreference) === '1'; } catch {}

  function sidebarState() {
    const button = document.getElementById('r5-sidebar-toggle');
    const content = document.getElementById('r5-sidebar-content');
    const hidden = desktop.matches && collapsed;
    document.body.classList.toggle('r5-sidebar-collapsed', hidden);
    if (content) content.hidden = hidden;
    if (!button) return;
    button.hidden = !desktop.matches;
    button.setAttribute('aria-expanded', String(!hidden));
    button.setAttribute('aria-label', hidden ? 'サイドバーを表示' : 'サイドバーを隠す');
    button.title = button.getAttribute('aria-label');
    button.textContent = hidden ? '☰' : '‹ メニュー';
  }

  function sidebar() {
    const rail = document.querySelector('.rail');
    if (!rail) return;
    if (!document.getElementById('r5-sidebar-toggle')) {
      const content = document.createElement('div');
      content.id = 'r5-sidebar-content';
      content.className = 'r5-sidebar-content';
      // Keep the original links, buttons, handlers and membership of the rail.
      for (const child of [...rail.childNodes]) content.append(child);
      const button = document.createElement('button');
      button.id = 'r5-sidebar-toggle';
      button.type = 'button';
      button.setAttribute('aria-controls', content.id);
      button.onclick = () => {
        collapsed = !collapsed;
        try { localStorage.setItem(sidebarPreference, collapsed ? '1' : '0'); } catch {}
        sidebarState();
        button.focus({preventScroll: true});
      };
      rail.append(button, content);
    }
    sidebarState();
  }

  function paint() {
    sidebar();
    const active = !!state && state.phase !== 'lobby';
    document.body.classList.toggle('r5-compact-active', active);
    document.body.dataset.r5ScoresPlacement = scorePlacement;
    const hud = document.getElementById('r3-hud');
    const grid = document.querySelector('.play-grid');
    const wide = active && scorePlacement === 'wide' && !!hud && !!grid;
    document.body.classList.toggle('r5-scores-wide-active', wide);
    hud?.classList.toggle('r5-scores-wide', wide);
    if (!active) return;

    // This copy is decorative. Keep waiting/role/status messages intact.
    // Its omission is a density candidate, not a new fixed game specification.
    for (const prompt of document.querySelectorAll('.layout-action > .wait-label')) {
      if (/^(何から、聞こう。|なにを、聞こう。)$/.test(prompt.textContent.trim())) prompt.remove();
    }

    if (wide) {
      grid.prepend(hud);
      const tools = document.getElementById('layout-tools');
      if (tools?.dataset.r5Placement === 'score') {
        tools.classList.add('r5-wide-score-tools');
        hud.after(tools);
      }
    }
  }

  render = (...args) => {
    const focusedSidebar = document.activeElement?.id === 'r5-sidebar-toggle';
    const value = previousRender(...args);
    paint();
    if (focusedSidebar) document.getElementById('r5-sidebar-toggle')?.focus({preventScroll: true});
    return value;
  };

  desktop.addEventListener('change', sidebarState);
  paint();
})();
