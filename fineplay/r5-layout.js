/* R5 local layout candidates. Keep the R4 controls and their bound handlers. */
(() => {
  'use strict';

  const previousRender = render;
  const placement = new URLSearchParams(location.search).get('r5tools') === 'tile' ? 'tile' : 'score';

  function paint() {
    const active = !!state && state.phase !== 'lobby';
    document.body.classList.toggle('r5-layout-candidate', active);
    document.body.dataset.r5ToolsPlacement = placement;
    if (!active) return;

    const tools = document.getElementById('layout-tools');
    const mainWindow = document.querySelector('.layout-action') || document.getElementById('layout-topic');
    const scores = document.getElementById('r3-hud') || document.querySelector('.layout-members');
    const side = document.querySelector('.reference-column');
    if (!tools) return;

    tools.classList.toggle('r5-tools-main', placement === 'tile');
    tools.dataset.r5Placement = placement;
    // append/after moves the original nodes; it does not copy action controls.
    if (placement === 'tile' && mainWindow) mainWindow.append(tools);
    else if (scores) scores.after(tools);
    else if (side) side.append(tools);
  }

  render = (...args) => {
    const value = previousRender(...args);
    paint();
    return value;
  };

  paint();
})();
