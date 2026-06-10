#!/usr/bin/env python3
"""FABULA gen — Notion種DB(正本) → index.html の DATA ブロック再生成 (ζ型)
usage: python gen_fabula.py   (workspace/fabula/ で実行。NOTION_TOKEN は ../miharashi/.env か環境変数)"""
import json, os, re, urllib.request, pathlib
DBID = "37b2b7e5-43e0-814e-9392-cbdfd67ba242"  # container id
HERE = pathlib.Path(__file__).parent
TOK = os.environ.get("NOTION_TOKEN")
if not TOK:
    env = HERE.parent / "miharashi" / ".env"
    for line in env.read_text(encoding="utf-8-sig").splitlines():
        if line.startswith("NOTION_TOKEN="): TOK = line.split("=",1)[1].strip()
def api(method, path, payload=None):
    req = urllib.request.Request("https://api.notion.com/v1"+path, method=method,
        data=json.dumps(payload).encode() if payload else None,
        headers={"Authorization":"Bearer "+TOK,"Notion-Version":"2022-06-28","Content-Type":"application/json"})
    return json.loads(urllib.request.urlopen(req).read())
rows, cursor = [], None
while True:
    pl = {"page_size":100}
    if cursor: pl["start_cursor"] = cursor
    d = api("POST", f"/databases/{DBID}/query", pl)
    rows += d["results"]
    if not d.get("has_more"): break
    cursor = d["next_cursor"]
def txt(p): return "".join(t["plain_text"] for t in p.get("rich_text", p.get("title", [])))
sp, id2name = [], {}
for r in rows:
    p = r["properties"]
    name = txt(p["名前"]); id2name[r["id"]] = name
    sp.append({"pid": r["id"], "n": name,
        "g": (p["門"]["select"] or {}).get("name",""),
        "x": p["X座標"]["number"] or 0, "b": p["誕生年"]["number"],
        "d": p["絶滅年"]["number"], "f": p["規定力"]["number"] or 0,
        "s": (p["現況"]["select"] or {}).get("name",""),
        "pm": txt(p["親メモ"]), "t": txt(p["起源説話"]),
        "rel": [x["id"] for x in p["親"]["relation"]]})
for s in sp:
    s["id"] = s["pid"][-8:]
    edges = []
    for rid in s["rel"]:
        pname = id2name.get(rid, "")
        m = re.search(re.escape(pname) + r"[:：]\s*([0-9.]+)", s["pm"])
        edges.append([rid[-8:], float(m.group(1)) if m else 0.5])
    s["p"] = edges; del s["rel"], s["pid"]
GATES = ["知識","信仰規範","法","統治","組織","経済","規格","遊戯"]
sp.sort(key=lambda s: (GATES.index(s["g"]) if s["g"] in GATES else 99, s["x"]))
html_path = HERE / "index.html"
h = html_path.read_text(encoding="utf-8")
new = "/*GEN:DATA*/" + json.dumps(sp, ensure_ascii=False) + "/*GEN:END*/"
h2 = re.sub(r"/\*GEN:DATA\*/.*?/\*GEN:END\*/", lambda _: new, h, count=1, flags=re.S)
html_path.write_text(h2, encoding="utf-8")
print(f"regenerated: {len(sp)} species, {len(h2.encode())} bytes -> {html_path}")
