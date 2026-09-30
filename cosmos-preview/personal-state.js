(function () {
  "use strict";

  const STORAGE_KEY = "bokunowakusei:personal-surface:v1";
  const MAX_RECENT = 12;

  function cleanState(value) {
    const src = value && typeof value === "object" ? value : {};
    const ids = (x) => Array.isArray(x) ? [...new Set(x.filter(v => typeof v === "string"))] : [];
    return {
      recent: ids(src.recent).slice(0, MAX_RECENT),
      favorites: ids(src.favorites),
      pins: ids(src.pins)
    };
  }

  function load() {
    try {
      return cleanState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (_) {
      return cleanState({});
    }
  }

  function save(state) {
    const clean = cleanState(state);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      return true;
    } catch (_) {
      return false;
    }
  }

  function toggle(list, id) {
    return list.includes(id) ? list.filter(x => x !== id) : [id, ...list];
  }

  const api = {
    key: STORAGE_KEY,
    get: load,
    recordOpen(id) {
      const state = load();
      state.recent = [id, ...state.recent.filter(x => x !== id)].slice(0, MAX_RECENT);
      save(state);
      return state;
    },
    toggleFavorite(id) {
      const state = load();
      state.favorites = toggle(state.favorites, id);
      save(state);
      return state;
    },
    togglePin(id) {
      const state = load();
      state.pins = toggle(state.pins, id);
      save(state);
      return state;
    },
    clear() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      return cleanState({});
    }
  };

  window.BokuPersonalSurface = api;
})();
