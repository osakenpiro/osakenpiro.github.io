// Variant C — 全画面トランジション主導. Persona-style menu transitions.
const { useEffect, useRef, useState } = React;

function VariantC({ knobs }) {
  const D = window.OSK_DATA;
  const [active, setActive] = useState(0);
  const [trans, setTrans] = useState(false);
  const SCENES = ['01 HERO', '02 論文', '03 創作', '04 ツール', '05 導線'];

  const go = (i) => {
    if (i === active) return;
    setTrans(true);
    setTimeout(() => { setActive(i); setTrans(false); }, 340);
  };

  return (
    <div className="vc" style={{'--vc-drama': 1 + knobs.drama*0.5}}>
      <CStarfield speed={knobs.orbital}/>

      {/* Persona-style slash transition overlay */}
      <div className={`vc-slash ${trans?'vc-slash--on':''}`}>
        <div className="vc-slash-fg"/>
        <div className="vc-slash-stripes">
          {Array.from({length:8}).map((_,i)=><div key={i} className="vc-slash-stripe" style={{animationDelay:`${i*20}ms`}}/>)}
        </div>
        <div className="vc-slash-label">{SCENES[active]}</div>
      </div>

      {/* Persistent command rail */}
      <nav className="vc-rail">
        <div className="vc-rail-brand">
          <div className="vc-rail-kanji">空</div>
          <div className="vc-rail-word">osakenpiro</div>
        </div>
        <ul className="vc-menu">
          {SCENES.map((s, i) => (
            <li key={i} className={`vc-menu-item ${i===active?'vc-menu-item--on':''}`}
                onClick={()=>go(i)}>
              <span className="vc-menu-bar"/>
              <span className="vc-menu-idx">{String(i+1).padStart(2,'0')}</span>
              <span className="vc-menu-label">{s.split(' ')[1]}</span>
              <span className="vc-menu-caret">▶</span>
            </li>
          ))}
        </ul>
        <div className="vc-rail-foot">
          #全人類UX改善計画
        </div>
      </nav>

      <main className="vc-stage">
        <div key={active} className="vc-scene vc-scene--enter">
          {active===0 && <CHero D={D} speed={knobs.orbital}/>}
          {active===1 && <CPapers D={D}/>}
          {active===2 && <CCreative D={D}/>}
          {active===3 && <CTools D={D}/>}
          {active===4 && <CSNS D={D}/>}
        </div>
      </main>

      <button className="vc-next" onClick={()=>go((active+1) % SCENES.length)}>
        <span>次へ</span><span className="vc-next-kbd">↵</span>
      </button>
    </div>
  );
}

function CHero({ D, speed }) {
  return (
    <div className="vc-hero">
      <div className="vc-hero-stamp">SCENE · 01</div>
      <div className="vc-hero-left">
        <div className="vc-hero-ja">長田<br/>謙志郎</div>
        <div className="vc-hero-en">Kenshiro Osada — {D.hero.roles[0]} · {D.hero.roles[1]} · {D.hero.location}</div>
        <div className="vc-hero-tag">全人類UX改善計画</div>
        <div className="vc-hero-en-tag">{D.hero.tagline_en}</div>
        <div className="vc-hero-manifesto">『 {D.hero.manifesto_ja} 』</div>
      </div>
      <div className="vc-hero-right">
        <COrbit speed={speed}/>
      </div>
    </div>
  );
}

function CPapers({ D }) {
  return (
    <div className="vc-papers">
      <div className="vc-scene-head">
        <span className="vc-scene-idx">02</span>
        <span className="vc-scene-ja">論文 × 9</span>
        <span className="vc-scene-en">— Boolean → Float. preprints on Zenodo.</span>
      </div>
      <div className="vc-paper-list">
        {D.papers.map((p, i) => (
          <article key={i} className={`vc-paper ${p.core?'vc-paper--core':''}`} style={{animationDelay: `${i*50}ms`}}>
            <span className="vc-paper-n">{p.n}</span>
            <span className="vc-paper-ja">{p.ja}</span>
            <span className="vc-paper-en">{p.en}</span>
            <span className="vc-paper-venue">{p.pending?'— 準備中':`${p.venue} · ${p.year}`}</span>
            <span className="vc-paper-doi">{p.pending?'pending':p.doi.split('/').pop()}</span>
            {p.core && <span className="vc-paper-core">◉</span>}
            {p.pending && <span className="vc-paper-core" style={{color:'#9b876a'}}>◌</span>}
          </article>
        ))}
      </div>
    </div>
  );
}

function CCreative({ D }) {
  return (
    <div className="vc-creative">
      <div className="vc-scene-head">
        <span className="vc-scene-idx">03</span>
        <span className="vc-scene-ja">創作 × 4</span>
        <span className="vc-scene-en">— manga · novels · picture-books</span>
      </div>
      <div className="vc-creative-grid">
        {D.creative.map((w, i) => (
          <article key={i} className="vc-work" style={{animationDelay:`${i*80}ms`}}>
            <div className="vc-work-kind">{w.kind.toUpperCase()}</div>
            <div className="vc-work-ja">{w.ja}</div>
            <div className="vc-work-en">{w.en}</div>
            <div className="vc-work-meta">{w.meta}</div>
            <div className="vc-work-detail">{w.detail}</div>
            <div className="vc-work-go">OPEN ▶</div>
          </article>
        ))}
      </div>
    </div>
  );
}

function CTools({ D }) {
  return (
    <div className="vc-tools">
      <div className="vc-scene-head">
        <span className="vc-scene-idx">04</span>
        <span className="vc-scene-ja">ツール × 4</span>
        <span className="vc-scene-en">— single html · localStorage · cloudflare worker</span>
      </div>
      <div className="vc-tool-list">
        {D.tools.map((t, i) => (
          <a key={i} href={t.url} target="_blank" rel="noopener"
             className={`vc-tool ${t.pending?'vc-tool--pending':''}`}
             style={{animationDelay:`${i*70}ms`}}>
            <div className="vc-tool-icon">{t.icon}</div>
            <div className="vc-tool-ja">{t.title_ja}</div>
            <div className="vc-tool-en">{t.title_en}</div>
            <div className="vc-tool-sub">{t.sub}</div>
            <div className="vc-tool-stack">{t.stack}</div>
            <div className="vc-tool-go">開く ▶</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function CSNS({ D }) {
  return (
    <div className="vc-sns">
      <div className="vc-scene-head">
        <span className="vc-scene-idx">05</span>
        <span className="vc-scene-ja">導線 × 6</span>
        <span className="vc-scene-en">— find me</span>
      </div>
      <div className="vc-sns-grid">
        {D.socials.map((s, i) => (
          <a key={i} href={s.url} className="vc-sns-item" style={{animationDelay:`${i*60}ms`}}>
            <div className="vc-sns-g">{s.glyph}</div>
            <div className="vc-sns-k">{s.k}</div>
            <div className="vc-sns-h">{s.handle}</div>
            <div className="vc-sns-go">▶</div>
          </a>
        ))}
      </div>
      <div className="vc-sns-footer">
        the center is empty; the circulation constitutes existence
      </div>
    </div>
  );
}

function COrbit({ speed }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const loop = ts => { setT(ts); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const sats = [
    { g: '📕', r: 90, s: 0.4, start: 0 },
    { g: '📖', r: 90, s: 0.4, start: 2.4 },
    { g: '🌙', r: 130, s: 0.18, start: 1.1 },
    { g: '𝕏', r: 170, s: 0.25, start: 0.5 },
    { g: '♪', r: 170, s: 0.25, start: 2.9 },
    { g: '🔬', r: 170, s: 0.25, start: 4.8 },
  ];
  return (
    <div className="vc-orbit">
      <div className="vc-orbit-core">空</div>
      {[90,130,170].map(r => (
        <div key={r} className="vc-orbit-ring" style={{width:r*2,height:r*2*0.35}}/>
      ))}
      {sats.map((s, i) => {
        const ang = s.start + t*0.001*s.s*(0.3+speed*1.5);
        const x = Math.cos(ang)*s.r, y = Math.sin(ang)*s.r*0.35;
        const d = (Math.sin(ang)+1)/2;
        return (
          <div key={i} className="vc-orbit-sat" style={{
            transform: `translate(${x}px,${y}px) scale(${0.7+d*0.3})`,
            opacity: 0.4 + d*0.6, zIndex: Math.round(d*10),
          }}>{s.g}</div>
        );
      })}
    </div>
  );
}

function CStarfield({ speed }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const x = c.getContext('2d');
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    const stars = Array.from({length: 130}, () => ({
      x: Math.random()*innerWidth, y: Math.random()*innerHeight,
      r: Math.random()*1.2 + 0.3, p: Math.random()*Math.PI*2,
      s: 0.3 + Math.random()*0.8,
    }));
    let raf;
    const loop = (t) => {
      x.clearRect(0,0,c.width,c.height);
      for (const s of stars) {
        const a = 0.12 + 0.3 * Math.sin(s.p + t*0.001*s.s*(0.4+speed*1.5));
        x.beginPath(); x.arc(s.x,s.y,s.r,0,Math.PI*2);
        x.fillStyle = `rgba(200,184,160,${a})`; x.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, [speed]);
  return <canvas ref={ref} className="vc-stars"/>;
}

window.VariantC = VariantC;
