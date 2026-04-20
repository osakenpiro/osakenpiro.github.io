// Variant B — 非対称グリッド主導. Balatro-dense information field.
const { useEffect, useRef, useState } = React;

function VariantB({ knobs }) {
  const D = window.OSK_DATA;
  const densityClass = knobs.density > 0.66 ? 'dense' : knobs.density > 0.33 ? 'medium' : 'sparse';
  return (
    <div className={`vb vb--${densityClass}`} style={{'--vb-drama': 1 + knobs.drama*0.5}}>
      <BStarfield speed={knobs.orbital}/>

      {/* HERO: asymmetric bento */}
      <section className="vb-hero">
        <div className="vb-tile vb-tile--id">
          <div className="vb-tile-stamp">01 · 身分</div>
          <div className="vb-id-name">長田 謙志郎</div>
          <div className="vb-id-sub">Kenshiro Osada</div>
          <div className="vb-id-roles">
            <span className="vb-chip">ADHD Web Developer</span>
            <span className="vb-chip">Independent Philosopher</span>
            <span className="vb-chip">Tokyo, JP</span>
          </div>
          <div className="vb-id-handle">@osakenpiro</div>
        </div>
        <div className="vb-tile vb-tile--manifesto">
          <div className="vb-tile-stamp">02 · 旗</div>
          <div className="vb-manifesto-ja">全人類UX<br/>改善計画</div>
          <div className="vb-manifesto-en">the universal-UX-improvement plan</div>
        </div>
        <div className="vb-tile vb-tile--planet">
          <BOrbit speed={knobs.orbital}/>
        </div>
        <div className="vb-tile vb-tile--mood">
          <div className="vb-tile-stamp">03 · 基底</div>
          <div className="vb-mood-text">宇宙の片隅で、<br/>ひとりで<br/>考えごとを<br/>している夜</div>
        </div>
        <div className="vb-tile vb-tile--stats">
          <div className="vb-stat"><b>9</b><span>論文</span></div>
          <div className="vb-stat"><b>85</b><span>キャラ</span></div>
          <div className="vb-stat"><b>17</b><span>巻</span></div>
          <div className="vb-stat"><b>8</b><span>ツール</span></div>
        </div>
      </section>

      {/* Papers — grid of index cards */}
      <section className="vb-section">
        <BSectionHead idx="P" kanji="論文 × 9" en="preprints · Zenodo"/>
        <div className="vb-paper-grid">
          {D.papers.map((p, i) => (
            <article key={i} className={`vb-paper ${p.core?'vb-paper--core':''}`}>
              <div className="vb-paper-top">
                <span className="vb-paper-n">{p.n}</span>
                <span className="vb-paper-yr">{p.year}</span>
              </div>
              <div className="vb-paper-ja">{p.ja}</div>
              <div className="vb-paper-en">{p.en}</div>
              <div className="vb-paper-bottom">
                <span className="vb-paper-venue">{p.pending?'—':p.venue}</span>
                <span className="vb-paper-doi">{p.pending?'準備中':p.doi.split('/').pop()}</span>
              </div>
              {p.core && <div className="vb-paper-ribbon">CORE</div>}
              {p.pending && <div className="vb-paper-ribbon" style={{background:'#c8b8a0',color:'#3a2f22'}}>PENDING</div>}
            </article>
          ))}
        </div>
      </section>

      {/* Creative — asymmetric stack */}
      <section className="vb-section">
        <BSectionHead idx="C" kanji="創作 × 4" en="manga · novels · picture-books"/>
        <div className="vb-creative-bento">
          {D.creative.map((w, i) => (
            <article key={i} className={`vb-work vb-work--${i}`}>
              <div className="vb-work-kind">{w.kind.toUpperCase()}</div>
              <div className="vb-work-ja">{w.ja}</div>
              <div className="vb-work-en">{w.en}</div>
              <div className="vb-work-meta">{w.meta}</div>
              <div className="vb-work-detail">{w.detail}</div>
              <div className="vb-work-arrow">↗</div>
            </article>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="vb-section">
        <BSectionHead idx="T" kanji="ツール × 4" en="single html · localStorage · worker"/>
        <div className="vb-tool-grid">
          {D.tools.map((t, i) => (
            <a key={i} href={t.url} target="_blank" rel="noopener"
               className={`vb-tool ${t.pending?'vb-tool--pending':''}`}>
              <div className="vb-tool-head">
                <span className="vb-tool-icon">{t.icon}</span>
                <span className="vb-tool-n">T·{String(i+1).padStart(2,'0')}</span>
              </div>
              <div className="vb-tool-ja">{t.title_ja}</div>
              <div className="vb-tool-en">{t.title_en}</div>
              <div className="vb-tool-sub">{t.sub}</div>
              <div className="vb-tool-stack">{t.stack}</div>
            </a>
          ))}
        </div>
      </section>

      {/* SNS — compact strip */}
      <section className="vb-section">
        <BSectionHead idx="S" kanji="導線 × 6" en="find me"/>
        <div className="vb-sns-strip">
          {D.socials.map((s, i) => (
            <a key={i} href={s.url} className="vb-sns">
              <span className="vb-sns-g">{s.glyph}</span>
              <span className="vb-sns-k">{s.k}</span>
              <span className="vb-sns-h">{s.handle}</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="vb-footer">
        <div>#全人類UX改善計画 — 自分の問題を解いて公開すると、人類のUXが改善される</div>
        <div className="vb-foot-italic">the center is empty; the circulation constitutes existence</div>
      </footer>
    </div>
  );
}

function BSectionHead({ idx, kanji, en }) {
  return (
    <header className="vb-head">
      <div className="vb-head-idx">{idx}</div>
      <div className="vb-head-kanji">{kanji}</div>
      <div className="vb-head-en">— {en}</div>
    </header>
  );
}

function BStarfield({ speed }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const x = c.getContext('2d');
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    const stars = Array.from({length: 120}, () => ({
      x: Math.random()*innerWidth, y: Math.random()*innerHeight,
      r: Math.random()*1.1 + 0.3, p: Math.random()*Math.PI*2,
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
  return <canvas ref={ref} className="vb-stars"/>;
}

function BOrbit({ speed }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const loop = ts => { setT(ts); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const sats = [
    { g: '📕', r: 70, s: 0.5, start: 0 },
    { g: '📖', r: 70, s: 0.5, start: 2.4 },
    { g: '🌙', r: 105, s: 0.18, start: 1.2 },
    { g: '𝕏', r: 140, s: 0.28, start: 0.4 },
    { g: '♪', r: 140, s: 0.28, start: 3.0 },
  ];
  return (
    <div className="vb-orbit">
      <div className="vb-orbit-core">空</div>
      {[70,105,140].map(r => (
        <div key={r} className="vb-orbit-ring" style={{width:r*2,height:r*2*0.35}}/>
      ))}
      {sats.map((s, i) => {
        const ang = s.start + t*0.001*s.s*(0.3+speed*1.5);
        const x = Math.cos(ang)*s.r, y = Math.sin(ang)*s.r*0.35;
        const d = (Math.sin(ang)+1)/2;
        return (
          <div key={i} className="vb-sat" style={{
            transform:`translate(${x}px,${y}px) scale(${0.7+d*0.3})`,
            opacity: 0.4+d*0.6, zIndex: Math.round(d*10),
          }}>{s.g}</div>
        );
      })}
      <div className="vb-orbit-label">僕の惑星</div>
    </div>
  );
}

window.VariantB = VariantB;
