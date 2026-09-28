import pathlib,json,threading,http.server,functools,sys
from playwright.sync_api import sync_playwright
W=pathlib.Path(__file__).parent; E=W/'evidence'; E.mkdir(exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(W)))
threading.Thread(target=server.serve_forever,daemon=True).start(); BASE=f'http://127.0.0.1:{server.server_port}'
phase=sys.argv[1] if len(sys.argv)>1 else 'before'; records=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for width,height in [(375,812),(390,844),(414,896)]:
  ctx=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
  p=ctx.new_page(); errors=[]; p.on('pageerror',lambda e: errors.append(str(e)))
  p.goto(BASE+'/fp/fineplay/',wait_until='load'); p.wait_for_timeout(300)
  p.screenshot(path=str(E/f'fp-entry-{phase}-{width}.png'),full_page=True)
  rec={'width':width,'fp_entry_button':p.locator('#entry-form button').bounding_box(),'fp_entry_overflow':p.evaluate('document.documentElement.scrollWidth>innerWidth')}
  p.goto(BASE+'/mj/okinawa-mahjong/helper/',wait_until='load'); p.locator('.choices [href="#yaku"]').click()
  rec['mj_yaku_first']=p.locator('.yaku').first.bounding_box(); p.screenshot(path=str(E/f'mj-yaku-{phase}-{width}.png'),full_page=True)
  p.locator('.bottom [href="#home"]').click(); p.locator('[href="#fu"]').first.click(); p.locator('#f-shape').select_option('chiitoi'); p.locator('#apply-fu').click()
  p.wait_for_timeout(150); rec['mj_fu_to_detail']=p.locator('#detail-score').is_visible(); rec['mj_selected_fu']=p.locator('#fu-choices [aria-pressed=true]').inner_text(); rec['mj_overflow']=p.evaluate('document.documentElement.scrollWidth>innerWidth'); rec['page_errors']=errors
  p.screenshot(path=str(E/f'mj-fu-return-{phase}-{width}.png'),full_page=True); records.append(rec); ctx.close()
 browser.close()
server.shutdown(); (E/f'measure-{phase}.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8'); print(json.dumps(records,ensure_ascii=False),flush=True)
