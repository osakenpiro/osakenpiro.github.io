#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Orb countdown.md 残日数 自動更新スクリプト。
- 締切までの「あとN日」を JST 基準で再計算し countdown.md を再生成する。
- ウィジェット表示前提なので #/>/**/--- は使わない（絵文字・全角字下げ・信号色のみ）。
- 締切を足す/消すときは下の TARGETS を編集するだけ（ゼロメンテ運用）。
GitHub Actions（毎朝）で実行 → 差分あれば commit。手動週1更新を撲滅。
"""
from datetime import datetime, timezone, timedelta, date
from pathlib import Path

JST = timezone(timedelta(hours=9))

# (信号色, ラベル, 締切)  ※過去になったら自動で「（N日経過）」表示。消すのは手動
TARGETS = [
    ("🔴", "カクヨムコン",        date(2026, 6, 19)),
    ("🟠", "Paper B R&R",         date(2026, 6, 24)),
    ("🟡", "主義絶対主義 刊行",    date(2026, 7, 31)),
]

def remaining_label(today: date, due: date) -> str:
    d = (due - today).days
    if d > 0:
        return f"あと{d}日"
    if d == 0:
        return "🎯 本日"
    return f"（{-d}日経過）"

def build(today: date) -> str:
    blocks = []
    for sig, label, due in TARGETS:
        blocks.append(f"{sig} {label}\n　　{due.month}/{due.day} ・ {remaining_label(today, due)}")
    body = "\n\n".join(blocks)
    footer = f"──\n更新 {today:%m-%d} / 自動更新（毎朝 GitHub Actions）"
    return f"{body}\n\n\n{footer}\n"

def main():
    today = datetime.now(JST).date()
    path = Path(__file__).resolve().parent / "countdown.md"
    new = build(today)
    old = path.read_text(encoding="utf-8") if path.exists() else ""
    if new != old:
        path.write_text(new, encoding="utf-8")
        print(f"[countdown] updated for {today} ({len(TARGETS)} targets)")
    else:
        print(f"[countdown] no change ({today})")
    print(new)

if __name__ == "__main__":
    main()
