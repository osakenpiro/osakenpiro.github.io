import pathlib,json,threading,http.server,functools,time
from playwright.sync_api import sync_playwright
W=pathlib.Path(__file__).parent; E=W/'evidence'; out={}
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(W)));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);p=ctx.new_page()
 p.goto(base+'/mj/okinawa-mahjong/helper/');p.locator('.choices [href="#score"]').click();assert p.locator('#paper-score').is_visible();p.locator('[data-score-mode=detail]').click()
 p.locator('#han [data-value="2"]').click();p.locator('#fu-choices [data-value="25"]').click();assert p.locator('#result').evaluate('(e)=>e.classList.contains("error")')
 p.locator('#has-yaku').check();p.locator('#jump-result').click();assert '1,600' in p.locator('#result').inner_text();out['mj_known_score']={'path':['点数','詳細','2翻','25符','役あり確認','支払点を見る'],'button_activations':6,'result':'1600','no_yaku_rejected':True}
 p.locator('.bottom [href="#yaku"]').click();p.locator('#search').fill('ピンフ');assert p.locator('.yaku').count()==1;assert '門前のみ' in p.locator('.yaku').inner_text();p.locator('.term-box summary').click();p.locator('[data-term]').first.click();assert p.locator('#term-note').is_visible();out['mj_yaku_search_and_glossary']=True;ctx.close()
 hostctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,permissions=['clipboard-read','clipboard-write']); guestctx=browser.new_context(viewport={'width':375,'height':812},is_mobile=True,has_touch=True)
 h=hostctx.new_page();g=guestctx.new_page();stage='host connection'
 try:
  h.goto(base+'/fp/fineplay/');h.locator('#nickname').fill('UX HOST');h.locator('#entry-form button').click();h.wait_for_function('ready === true',timeout=18000)
  stage='guest connection';g.goto(h.url);g.locator('#nickname').fill('UX GUEST');g.locator('#entry-form button').click();g.wait_for_function('ready === true',timeout=18000);h.wait_for_function('state.players.filter(p=>p.online).length===2',timeout=8000)
  stage='first question';h.locator('#copylink').click();h.locator('#start').click();g.wait_for_selector('#ask',timeout=8000);g.locator('#question').fill('この道具は使う？');g.locator('#ask').click();h.wait_for_selector('#answer-yes',timeout=8000);h.locator('#answer-yes').click();g.wait_for_function('state.entries.length===1',timeout=8000)
  out['fp_peer_two_contexts']={'status':'PASS','transport':'real PeerJS','host_buttons':['部屋をつくる','招待URLをコピー','開始'],'guest_buttons':['参加','この質問をする'],'text_fields':['host nickname','guest nickname','optional question memo'],'first_answer_synced':True,'not_physical_devices':True}
 except Exception as e:out['fp_peer_two_contexts']={'status':'UNVERIFIED','stage':stage,'error':str(e).split('\n')[0],'host_status':h.locator('.status').inner_text() if h.locator('.status').count() else ''}
 finally:hostctx.close();guestctx.close()
 browser.close()
server.shutdown();(E/'journey.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(out,ensure_ascii=False),flush=True)
