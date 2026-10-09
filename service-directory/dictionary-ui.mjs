import {
  checkQuery,
  fallbackWikidataURL,
  queryWikidata,
  DICTIONARY_PROVIDERS
} from "./dictionary-providers.mjs";

const form = document.getElementById("dictionary-form");
const input = document.getElementById("dictionary-query");
const results = document.getElementById("dictionary-results");
const status = document.getElementById("dictionary-status");
const button = document.getElementById("dictionary-submit");
const sourceLine = document.getElementById("dictionary-source");
let activeRequest = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function add(parent, child) {
  parent.appendChild(child);
  return child;
}

function showSource(term) {
  sourceLine.replaceChildren();
  const link = add(sourceLine, element("a", "", "Wikidataの検索ページで確認 ↗"));
  link.href = fallbackWikidataURL(term);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
}

function drawHits(items, term) {
  results.replaceChildren();
  if (!items.length) {
    status.textContent = "一致する項目が見つかりませんでした。名称を変えて検索してみてください。";
    showSource(term);
    return;
  }
  status.textContent = items.length + " 件の外部辞書項目を取得しました（osakenpiro名鑑への掲載ではありません）。";
  for (const item of items) {
    const article = add(results, element("article", "dictionary-hit"));
    const head = add(article, element("div", "dictionary-hit-head"));
    add(head, element("h3", "", item.name));
    add(head, element("span", "badge", "Wikidata / " + item.sourceId));
    add(article, element("p", "", item.description));
    const meta = add(article, element("div", "dictionary-hit-meta"));
    add(meta, element("span", "", "外部辞書から取得"));
    add(meta, element("span", "", DICTIONARY_PROVIDERS.wikidata.contentLicense + " データ"));
    add(meta, element("span", "", "名鑑未審査・動作未確認"));
    const anchor = add(article, element("a", "dictionary-open", "Wikidataの記録を見る ↗"));
    anchor.href = item.referenceURL;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  showSource(term);
}

function setBusy(busy) {
  input.disabled = busy;
  button.disabled = busy;
  button.textContent = busy ? "辞書を引いています…" : "外部辞書を引く →";
}

if (form && input && status && results && button && sourceLine) {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const value = checkQuery(input.value);
    if (!value.valid) {
      status.textContent = value.reason;
      input.focus();
      return;
    }
    if (activeRequest) activeRequest.abort();
    const controller = new AbortController();
    activeRequest = controller;
    results.replaceChildren();
    sourceLine.replaceChildren();
    status.textContent = "Wikidataへ「" + value.term + "」を問い合わせています…";
    setBusy(true);
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const items = await queryWikidata(value.term, { signal: controller.signal, limit: 8 });
      if (activeRequest === controller) drawHits(items, value.term);
    } catch (error) {
      if (activeRequest === controller) {
        results.replaceChildren();
        status.textContent = error?.name === "AbortError"
          ? "応答がありませんでした。外部辞書側で確認してください。"
          : (error?.message || "辞書に接続できませんでした。");
        showSource(value.term);
      }
    } finally {
      clearTimeout(timeout);
      if (activeRequest === controller) {
        activeRequest = null;
        setBusy(false);
      }
    }
  });

  document.querySelectorAll("[data-dictionary-example]").forEach(buttonExample => {
    buttonExample.addEventListener("click", () => {
      input.value = buttonExample.getAttribute("data-dictionary-example") || "";
      input.focus(); // Example buttons do not initiate remote requests.
    });
  });
}
