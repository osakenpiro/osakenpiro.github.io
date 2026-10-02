from pathlib import Path
import json,sys
from playwright.sync_api import sync_playwright
W=Path(__file__).parent;out={}
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True);c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,permissions=['clipboard-read','clipboard-write']);p=c.new_page()
 try:
  r=p.goto('https://osakenpiro.github.io/fineplay/?ux-check=2tap-r1',wait_until='load');assert r.status==200
  assert p.locator('script[src="play.js?v=2tap-r1"]').count()==1
  p.evaluate("() => {owner=true;ready=true;me='ux-host';name='UX HOST';room=uid();game=R.create(me,name);game=R.join(game,'ux-guest','UX GUEST');game=R.apply(game,me,{id:uid(),type:'start',roundId:game.roundId,presenter:me,scope:'UX TEST',mode:'live'});state=R.view(game,me);render();}")
  assert p.locator('#invite').inner_text()=='招待URLをコピー';p.locator('#invite').click();assert not p.locator('#modal').evaluate('(e)=>e.open');assert p.evaluate('navigator.clipboard.readText()')==p.evaluate('inviteURL()')
  out['fineplay']={'http':200,'status':'LIVE VERIFIED','direct_copy':True,'test_mode':'UI fixture on deployed code'}
 except Exception as e:out['fineplay']={'status':'NOT VERIFIED','error':repr(e).split('\n')[0]}
 try:
  r=p.goto('https://osakenpiro.github.io/shuryo-techo/okinawa-mahjong/helper/?ux-check=2tap-r1',wait_until='load');assert r.status==200
  assert p.locator('script[src="app.js?v=2tap-r1"]').count()==1
  p.locator('.choices [href="#score"]').click();p.locator('#paper-score').wait_for(state='visible',timeout=8000);p.locator('.bottom [href="#home"]').click();p.locator('[href="#fu"]').first.click();p.locator('#f-shape').select_option('chiitoi');p.locator('#apply-fu').click();p.locator('#detail-score').wait_for(state='visible',timeout=8000);assert p.locator('#fu-choices [aria-pressed=true]').inner_text()=='25符'
  p.locator('.bottom [href="#yaku"]').click();assert not p.locator('details.term-box').evaluate('(e)=>e.open');out['mahjong']={'http':200,'status':'LIVE VERIFIED','paper_default':True,'fu_to_detail':True,'glossary_deferred':True}
 except Exception as e:out['mahjong']={'status':'NOT VERIFIED','error':repr(e).split('\n')[0]}
 c.close();b.close()
(W/'evidence/live-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(out,ensure_ascii=False),flush=True)
sys.exit(0 if all(v['status']=='LIVE VERIFIED' for v in out.values()) else 2)
