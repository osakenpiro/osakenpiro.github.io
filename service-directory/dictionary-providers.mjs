/**
 * Service-directory dictionary adapter — only public reference lookup.
 *
 * A dictionary hit is NOT a locally listed service, an endorsement,
 * an availability check, or evidence that the item represents software.
 * This module never accesses the private 3S/UUU profile.
 */
export const DICTIONARY_PROVIDERS = Object.freeze({
  wikidata: Object.freeze({
    id: "wikidata",
    label: "Wikidata",
    termsUrl: "https://www.wikidata.org/wiki/Wikidata:Copyright",
    endpoint: "https://www.wikidata.org/w/api.php",
    contentLicense: "CC0",
    requiresAccount: false,
    remoteQuery: true
  })
});

const Q_ID = /^Q[1-9][0-9]*$/;
const JP_CHARS = /[\u3040-\u30ff\u3400-\u9fff]/u;
const MAX_QUERY_LENGTH = 80;
const DEFAULT_LIMIT = 8;

export function checkQuery(raw) {
  if (typeof raw !== "string") return { valid: false, reason: "検索語句を入力してください。" };
  const term = raw.trim().replace(/\s+/g, " ");
  if (term.length < 2) return { valid: false, reason: "2文字以上で入力してください。" };
  if (term.length > MAX_QUERY_LENGTH) return { valid: false, reason: "80文字以内で入力してください。" };
  return { valid: true, term };
}

export function buildWikidataURL(term, limit = DEFAULT_LIMIT) {
  const checked = checkQuery(term);
  if (!checked.valid) throw new TypeError(checked.reason);
  const n = Math.max(1, Math.min(DEFAULT_LIMIT, Math.trunc(Number(limit)) || DEFAULT_LIMIT));
  const params = new URLSearchParams({
    action: "wbsearchentities",
    format: "json",
    formatversion: "2",
    origin: "*",
    search: checked.term,
    language: JP_CHARS.test(checked.term) ? "ja" : "en",
    uselang: "ja",
    type: "item",
    limit: String(n),
    maxlag: "5"
  });
  return DICTIONARY_PROVIDERS.wikidata.endpoint + "?" + params;
}

export function fallbackWikidataURL(term) {
  const checked = checkQuery(term);
  if (!checked.valid) return "https://www.wikidata.org/";
  return "https://www.wikidata.org/w/index.php?search=" + encodeURIComponent(checked.term);
}

function shortText(value, max) {
  if (typeof value !== "string") return "";
  const clean = value.trim().replace(/\s+/g, " ");
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}

/** Normalize only stable IDs and plain text; NEVER trust source-supplied hrefs. */
export function normalizeWikidata(payload) {
  if (!payload || !Array.isArray(payload.search)) return [];
  const unique = new Set();
  const output = [];
  for (const raw of payload.search) {
    if (!raw || typeof raw.id !== "string" || !Q_ID.test(raw.id) || unique.has(raw.id)) continue;
    const name = shortText(raw.display?.label?.value || raw.label, 100);
    if (!name) continue;
    unique.add(raw.id);
    output.push({
      key: "wikidata:" + raw.id,
      provider: "wikidata",
      sourceLabel: "Wikidata",
      sourceId: raw.id,
      name,
      description: shortText(raw.display?.description?.value || raw.description, 190) ||
        "説明が登録されていません。",
      referenceURL: "https://www.wikidata.org/wiki/" + raw.id,
      contentLicense: "CC0",
      provenance: "external-dictionary",
      verified: false
    });
  }
  return output;
}

/**
 * Controlled, user-initiated read. No private status, tracking ID,
 * personalized profiling or keys are sent to the provider.
 */
export async function queryWikidata(term, options = {}) {
  const transport = options.fetcher || fetch;
  const url = buildWikidataURL(term, options.limit);
  const response = await transport(url, {
    method: "GET",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal: options.signal
  });
  if (!response.ok) {
    const error = new Error(response.status === 429
      ? "参照先が混雑しています。時間をおいて検索してください。"
      : "外部辞書との通信に失敗しました。");
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  if (data?.error) throw new Error("外部辞書が検索を処理できませんでした。");
  return normalizeWikidata(data);
}
