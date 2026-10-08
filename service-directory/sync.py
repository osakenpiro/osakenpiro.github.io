#!/usr/bin/env python3
"""Refresh the osakenpiro first-party service ledger; no external discovery."""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from zoneinfo import ZoneInfo
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "service-directory"
SEED = FOLDER / "seed.json"
CATALOG = FOLDER / "catalog.json"
HOST = "osakenpiro.github.io"
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{1,48}$")
CATEGORIES = {"記録・習慣", "意思決定", "文章・創作", "学び・遊び", "AI・開発", "ゲーム", "その他"}
TODAY = datetime.now(ZoneInfo("Asia/Tokyo")).date().isoformat()


class PageMeta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.robots = ""
        self.has_title = False
        self._inside_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and (attrs.get("name") or "").lower() == "robots":
            self.robots = (attrs.get("content") or "").lower()
        if tag == "title":
            self._inside_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._inside_title = False

    def handle_data(self, data):
        if self._inside_title and data.strip():
            self.has_title = True


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def eligible(record):
    if not isinstance(record, dict):
        return False, "不正な登録内容"
    sid = record.get("id")
    if not isinstance(sid, str) or not SLUG.fullmatch(sid):
        return False, "idが不正"
    if record.get("url") != "https://" + HOST + "/" + sid + "/":
        return False, "第一者サイト以外のURL"
    if record.get("category") not in CATEGORIES:
        return False, "未定義の分野"
    if not isinstance(record.get("name"), str) or not (1 <= len(record["name"]) <= 80):
        return False, "名前が未指定"
    if not isinstance(record.get("description"), str) or not (8 <= len(record["description"]) <= 240):
        return False, "用途説明が不足"
    if not isinstance(record.get("tags", []), list) or len(record.get("tags", [])) > 12:
        return False, "タグ形式が不正"
    if record.get("commercial_relation", "none") not in ("none", "affiliate", "sponsored"):
        return False, "収益関係の表示が不正"
    path = record.get("source_path")
    if path != sid + "/index.html":
        return False, "ソースパスが異なる"
    page_path = ROOT / path
    if not page_path.is_file():
        return False, "公開ページが存在しない"
    meta = PageMeta()
    try:
        meta.feed(page_path.read_text(encoding="utf-8-sig", errors="replace"))
    except (OSError, ValueError):
        return False, "公開ページの解析に失敗"
    if "noindex" in meta.robots:
        return False, "noindexによる掲載対象外"
    if not meta.has_title:
        return False, "HTMLタイトルがない"
    return True, "掲載基準を満たす"


def probe(url):
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != HOST:
        return False, "第一者サイト以外"
    for method in ("HEAD", "GET"):
        try:
            request = Request(url, method=method, headers={"User-Agent": "osakenpiro-directory/0.1"})
            with urlopen(request, timeout=12) as response:
                dest = urlparse(response.geturl())
                ok = response.status == 200 and dest.scheme == "https" and dest.netloc == HOST
                return ok, ("HTTP 200確認" if ok else "想定外の転送またはHTTP状態")
        except HTTPError as err:
            if method == "HEAD" and err.code in (403, 405):
                continue
            return False, "HTTP " + str(err.code)
        except (URLError, TimeoutError, OSError):
            if method == "HEAD":
                continue
            return False, "通信失敗"
    return False, "通信失敗"


def run():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-network", action="store_true")
    opts = ap.parse_args()

    baseline = read_json(SEED).get("services", [])
    previous = {r["id"]: r for r in read_json(CATALOG).get("services", [])}
    desired = {}
    for item in baseline:
        desired[item["id"]] = dict(item, source="seed")

    # New services opt in by publishing <slug>/service-entry.json.
    # A manifest alone is NOT a proof of third-party domain ownership.
    for path in sorted(ROOT.glob("*/service-entry.json")):
        try:
            item = read_json(path)
        except (OSError, ValueError):
            continue
        slug = path.parent.name
        if isinstance(item, dict) and item.get("id") == slug and slug not in desired:
            item["source_path"] = slug + "/index.html"
            item["source"] = "self-manifest"
            desired[slug] = item

    output = {}
    invalid = []
    for sid, item in sorted(desired.items()):
        valid, detail = eligible(item)
        old = previous.get(sid, {})
        entry = dict(old, **item)
        entry["first_seen_at"] = old.get("first_seen_at", TODAY)
        entry["last_checked_at"] = old.get("last_checked_at")
        entry["last_success_at"] = old.get("last_success_at")
        entry["failures"] = old.get("failures", 0)
        if item.get("retired") is True and (valid or sid in previous):
            entry.update(state="retired", reason="運営者による終了申告")
        elif not valid:
            invalid.append(sid + ": " + detail)
            entry.update(state="hidden", reason=detail)
        elif opts.no_network:
            entry.update(state=old.get("state", "watch"), reason=old.get("reason", "未確認"))
        else:
            works, why = probe(item["url"])
            entry["last_checked_at"] = TODAY
            if works:
                entry.update(state="active", failures=0, last_success_at=TODAY, reason="HTTP 200確認")
            else:
                failures = min(int(entry.get("failures", 0)) + 1, 999)
                entry.update(
                    state="watch" if failures < 3 else "hidden",
                    failures=failures,
                    reason=why + " / 連続失敗 " + str(failures) + " 回",
                )
        output[sid] = entry

    # Deregistration is a visibility change, never historical erasure.
    for sid, old in previous.items():
        if sid not in output:
            if old.get("state") == "retired":
                output[sid] = old  # Explicit retirement remains a historical fact.
            else:
                output[sid] = dict(old, state="hidden", reason="登録元指定なし（終了断定ではありません）")

    result = {
        "schema_version": "0.1",
        "publisher": "osakenpiro",
        "generated_at": TODAY,
        "policy": "https://osakenpiro.github.io/service-directory/#policy",
        "services": [output[sid] for sid in sorted(output)],
    }
    if opts.dry_run:
        print("catalog: " + str(len(output)) + " records, " + str(len(invalid)) + " ineligible")
        for detail in invalid:
            print("  - " + detail)
        # Strict on baseline, permissive on auto-manifests: manual seeds must stay valid.
        if any(d.split(":")[0] in {r["id"] for r in baseline} for d in invalid):
            raise SystemExit(1)
        return
    serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if CATALOG.read_text(encoding="utf-8") != serialized:
        CATALOG.write_text(serialized, encoding="utf-8")
        print("catalog.json refreshed")
    else:
        print("catalog.json unchanged")


if __name__ == "__main__":
    run()
