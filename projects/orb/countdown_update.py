#!/usr/bin/env python3
"""
Orb countdown.md 残日数 自動更新 (Cow / PostBoy cron 相乗り)

countdown.md の各イベント行 "M/D ・ あとN日" を、今日(JST)基準で再計算して書き戻す。
日付は countdown.md 自身が SoT (別configを持たない)。月が過去なら翌年扱いで年跨ぎ対応。
footer の "更新 MM-DD" 行も今日に更新。変更が無ければ何も書かない(冪等)。

使い方:
  python countdown_update.py [path]   # 既定 = スクリプトと同じ widget/countdown.md
  --dry-run                            # 書き込まず差分だけ表示
exit code: 0=正常(変更有/無問わず)
"""
import os
import re
import sys
from datetime import datetime, timedelta, timezone, date

JST = timezone(timedelta(hours=9))

# "6/19 ・ あと21日" / 全角スペース・中黒ゆらぎを許容
LINE_RE = re.compile(r'(?P<pre>.*?)(?P<m>\d{1,2})/(?P<d>\d{1,2})(?P<mid>\s*[・･]\s*あと)(?P<n>\-?\d+)(?P<post>\s*日.*)')
FOOTER_RE = re.compile(r'(更新\s*)(\d{1,2})-(\d{1,2})')


def days_left(m, d, today):
    y = today.year
    target = date(y, m, d)
    if target < today:
        target = date(y + 1, m, d)
    return (target - today).days


def update_text(text, today):
    out = []
    changed = False
    for line in text.split('\n'):
        mm = LINE_RE.match(line)
        if mm:
            n = days_left(int(mm.group('m')), int(mm.group('d')), today)
            new_line = f"{mm.group('pre')}{mm.group('m')}/{mm.group('d')}{mm.group('mid')}{n}{mm.group('post')}"
            if new_line != line:
                changed = True
            out.append(new_line)
            continue
        fm = FOOTER_RE.search(line)
        if fm:
            new_line = FOOTER_RE.sub(f"\\g<1>{today.month:02d}-{today.day:02d}", line)
            # "手動・週1で直す" 等の注記は残しつつ日付だけ更新
            if new_line != line:
                changed = True
            out.append(new_line)
            continue
        out.append(line)
    return '\n'.join(out), changed


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    dry = '--dry-run' in argv
    paths = [a for a in argv if not a.startswith('--')]
    if paths:
        path = paths[0]
    else:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'widget', 'countdown.md')
    if not os.path.exists(path):
        print(f'countdown.md not found: {path}', file=sys.stderr)
        return 1

    today = datetime.now(JST).date()
    text = open(path, encoding='utf-8').read()
    new_text, changed = update_text(text, today)

    if not changed:
        print(f'countdown.md: no change ({today})')
        return 0
    if dry:
        print('--- dry-run diff ---')
        for a, b in zip(text.split('\n'), new_text.split('\n')):
            if a != b:
                print(f'- {a}\n+ {b}')
        return 0
    open(path, 'w', encoding='utf-8').write(new_text)
    print(f'countdown.md: updated ({today})')
    return 0


if __name__ == '__main__':
    sys.exit(main())
