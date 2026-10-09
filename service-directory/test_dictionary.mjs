import test from "node:test";
import assert from "node:assert/strict";

import {
  DICTIONARY_PROVIDERS,
  buildWikidataURL,
  checkQuery,
  fallbackWikidataURL,
  normalizeWikidata,
  queryWikidata
} from "./dictionary-providers.mjs";

test("provider contract records official endpoint, license and no account", () => {
  assert.equal(DICTIONARY_PROVIDERS.wikidata.contentLicense, "CC0");
  assert.equal(DICTIONARY_PROVIDERS.wikidata.requiresAccount, false);
  assert.equal(DICTIONARY_PROVIDERS.wikidata.remoteQuery, true);
});

test("only explicit name query is transmitted, with browser-origin CORS", () => {
  const url = new URL(buildWikidataURL("  Notion  "));
  assert.equal(url.origin, "https://www.wikidata.org");
  assert.equal(url.searchParams.get("search"), "Notion");
  assert.equal(url.searchParams.get("origin"), "*");
  assert.equal(url.searchParams.get("language"), "en");
  assert.equal(url.searchParams.get("uselang"), "ja");
  assert.equal(url.searchParams.get("maxlag"), "5");
  assert.equal(url.searchParams.get("limit"), "8");
  assert.deepEqual([...url.searchParams.keys()].sort(), [
    "action","format","formatversion","language","limit","maxlag","origin","search","type","uselang"
  ]);
  assert.equal(url.toString().includes("status"), false);
  assert.equal(url.toString().includes("user_id"), false);
});

test("Japanese name search uses Japanese index and safe URL encoding", () => {
  const u = new URL(buildWikidataURL("手帳 アプリ", 4));
  assert.equal(u.searchParams.get("language"), "ja");
  assert.equal(u.searchParams.get("search"), "手帳 アプリ");
  assert.equal(u.searchParams.get("limit"), "4");
  assert.ok(fallbackWikidataURL("Notion & Blender").includes("Notion%20%26%20Blender"));
});

test("reject blank and oversized searches before they leave browser", () => {
  assert.equal(checkQuery(" ").valid, false);
  assert.equal(checkQuery("A").valid, false);
  assert.equal(checkQuery("A".repeat(81)).valid, false);
  assert.equal(checkQuery(" Notion ").term, "Notion");
  assert.throws(() => buildWikidataURL("x"), TypeError);
});

test("normalization preserves source IDs while rejecting unsafe spoofed URLs", () => {
  const payload = { search: [
    { id: "Q60747998", label: "Notion", description: "wiki & notes", url: "javascript:alert(1)" },
    { id: "Q60747998", label: "duplicate" },
    { id: "R123", label: "not a Wikidata item" },
    { id: "Q123", display: { label: { value: "<script>alert(1)</script>" }, description: { value: "Demo" } } },
    { id: "Q321", label: "    " },
    { id: "Q567", label: "Blender", description: "3D" }
  ] };
  const result = normalizeWikidata(payload);
  assert.equal(result.length, 3);
  assert.equal(result[0].key, "wikidata:Q60747998");
  assert.equal(result[0].referenceURL, "https://www.wikidata.org/wiki/Q60747998");
  assert.equal(result[0].verified, false);
  assert.equal(result[0].provenance, "external-dictionary");
  assert.equal(result[1].name, "<script>alert(1)</script>");
  assert.equal(result[1].referenceURL, "https://www.wikidata.org/wiki/Q123");
});

test("query performs no request until explicitly invoked; fetch omits credentials", async () => {
  let count = 0;
  const fetcher = async (url, options) => {
    count++;
    assert.equal(options.method, "GET");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(new URL(url).searchParams.get("search"), "Notion");
    return {
      ok: true,
      json: async () => ({ search: [{ id:"Q60747998",label:"Notion",description:"Software" }] })
    };
  };
  assert.equal(count, 0);
  const output = await queryWikidata("Notion", { fetcher });
  assert.equal(count, 1);
  assert.equal(output[0].name, "Notion");
});

test("provider errors and rate limits are not interpreted as absent services", async () => {
  await assert.rejects(
    queryWikidata("Notion", { fetcher: async () => ({ ok: false, status: 429 }) }),
    /混雑/
  );
  await assert.rejects(
    queryWikidata("Notion", { fetcher: async () => ({ ok: true, json: async () => ({ error: { code: "maxlag" } }) }) }),
    /処理できません/
  );
  assert.deepEqual(normalizeWikidata({}), []);
});
