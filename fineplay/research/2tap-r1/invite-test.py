import pathlib,json,threading,http.server,functools,sys
from playwright.sync_api import sync_playwright
W=pathlib.Path(__file__).parent; E=W/'evidence'; phase=sys.argv[1]; rows=[]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(W)))
threading.Thread(target=server.serve_forever,daemon=True).start(); base=f'http://127.0.0.1:{server.server_port}'
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for width,height in [(375,812),(390,844),(414,896)]:
  ctx=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,permissions=['clipboard-read','clipboard-write']); p=ctx.new_page()
  p.goto(base+'/fp/fineplay/',wait_until='load')
  p.evaluate("""() => {owner=true;ready=true;me='ux-host';name='UX HOST';room=uid();game=R.create(me,name);game=R.join(game,'ux-guest','UX GUEST');game=R.apply(game,me,{id:uid(),type:'start',roundId:game.roundId,presenter:me,scope:'UX TEST',mode:'live'});state=R.view(game,me);render();}""")
  p.locator('#invite').click(); dialog=p.locator('#modal').evaluate('(el)=>el.open'); taps=1
  if dialog:p.locator('#copy-invite').click();taps+=1
  copied=p.evaluate('navigator.clipboard.readText()'); expected=p.evaluate('inviteURL()'); assert copied==expected
  if dialog:p.locator('#modal-close').click()
  p.screenshot(path=str(E/f'fp-invite-{phase}-{width}.png'),full_page=True)
  row={'width':width,'invite_taps':taps,'intermediate_dialog':dialog,'clipboard_matches':True,'overflow':p.evaluate('document.documentElement.scrollWidth>innerWidth')}
  p.evaluate("Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('test permission denial')}})")
  p.locator('#invite').click()
  if phase=='before':p.locator('#copy-invite').click()
  assert p.locator('#copytext').is_visible(); assert p.locator('#copytext').input_value()==expected
  row['denied_clipboard_fallback']=True;rows.append(row);ctx.close()
 browser.close()
server.shutdown();(E/f'invite-{phase}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8'); print(json.dumps(rows),flush=True)
