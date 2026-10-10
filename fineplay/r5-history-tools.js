/* Compact history chrome; move the existing R4 controls with their handlers. */
(() => {
  'use strict';

  const previousRender = render;
  const preference = 'fineplay:r5:history-options-open';
  let opened = false;
  try { opened = localStorage.getItem(preference) === '1'; } catch {}

  function status(panel) {
    const summary = panel.querySelector('.r5-history-status');
    if (!summary) return;
    const field = panel.querySelector('#history-filter');
    const phrase = field?.selectedOptions[0]?.textContent || 'すべて';
    const text = panel.querySelector('#history-search')?.value.trim() || '';
    const visible = panel.querySelectorAll('.history-list > .history-item').length;
    const total = state?.entries?.length || 0;
    const parts = [order === 'new' ? '新しい順' : '古い順', phrase];
    if (text) {
      const chars = [...text];
      parts.push('「' + chars.slice(0, 18).join('') + (chars.length > 18 ? '…' : '') + '」');
    }
    if (text || (field && field.value !== 'all')) parts.push(visible + '/' + total + '件');
    summary.textContent = parts.join(' · ');
    summary.title = [parts[0], phrase, text ? '検索：' + text : '', visible + '/' + total + '件'].filter(Boolean).join(' · ');
  }

  function paint() {
    const panel = document.getElementById('history');
    if (!panel) return;
    if (panel.querySelector(':scope > .r5-history-header')) {
      status(panel);
      return;
    }
    const head = panel?.querySelector(':scope > .section-head');
    const heading = head?.querySelector('h2');
    if (!panel || !heading) return;
    panel.classList.add('r5-history-tools-active');

    const chrome = document.createElement('div');
    chrome.className = 'r5-history-header';
    const top = document.createElement('div');
    top.className = 'r5-history-top';
    heading.textContent = '履歴 ' + (state?.entries?.length || 0) + '件';
    top.append(heading);
    const navigation = panel.querySelector(':scope > .presentation-history-nav');
    if (navigation) top.append(navigation);
    chrome.append(top);

    const options = document.createElement('details');
    options.id = 'r5-history-options';
    options.className = 'r5-history-options';
    const summary = document.createElement('summary');
    summary.id = 'r5-history-options-toggle';
    summary.setAttribute('aria-controls', 'r5-history-options-body');
    const label = document.createElement('span');
    label.textContent = '表示・操作';
    const current = document.createElement('small');
    current.className = 'r5-history-status';
    summary.append(label, current);
    const body = document.createElement('div');
    body.id = 'r5-history-options-body';
    body.className = 'r5-history-options-body';
    // Keep each wrapper too, including future role-specific controls in it.
    const filters = panel.querySelector(':scope > .history-filters');
    const display = panel.querySelector(':scope > .display-history-tools');
    const copy = panel.querySelector(':scope > .assist-copybar');
    body.append(head);
    if (filters) body.append(filters);
    if (display) body.append(display);
    if (copy) body.append(copy);
    options.append(summary, body);
    options.open = opened;
    chrome.append(options);
    panel.prepend(chrome);
    status(panel);
    const refreshStatus = event => {
      if (event.target.id === 'history-search' || event.target.id === 'history-filter') {
        status(document.getElementById('history') || panel);
      }
    };
    panel.addEventListener('input', refreshStatus);
    panel.addEventListener('change', refreshStatus);

    const remember = () => {
      if (!options.isConnected) return;
      opened = options.open;
      try { localStorage.setItem(preference, opened ? '1' : '0'); } catch {}
    };
    options.addEventListener('toggle', remember);
    options.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !options.open || event.defaultPrevented || event.target.tagName === 'SELECT') return;
      event.preventDefault();
      options.open = false;
      remember();
      summary.focus({preventScroll: true});
    });
  }

  render = (...args) => {
    const panel = document.getElementById('history');
    const options = document.getElementById('r5-history-options');
    if (options) opened = options.open;
    const focus = document.activeElement;
    const saved = panel?.contains(focus) && focus?.id ? {
      id: focus.id,
      selection: typeof focus.selectionStart === 'number' ? [focus.selectionStart, focus.selectionEnd, focus.selectionDirection] : null
    } : null;
    const value = previousRender(...args);
    paint();
    if (saved) {
      const next = document.getElementById(saved.id);
      next?.focus({preventScroll: true});
      if (saved.selection && next?.setSelectionRange) try { next.setSelectionRange(...saved.selection); } catch {}
    }
    return value;
  };

  paint();
})();
