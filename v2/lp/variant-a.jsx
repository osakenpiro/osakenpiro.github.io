// Variant A — 縦書きタイポ主導. Japanese verticality is the protagonist.
const { useEffect, useRef, useState } = React;

function VariantA({ knobs }) {
  const D = window.OSK_DATA;
  const densityClass = knobs.density > 0.66 ? 'dense' : knobs.density > 0.33 ? 'medium' : 'sparse';
  const dramaScale = 1 + knobs.drama * 0.4;

  return (
    <div className={`va va--${densityClass}`} style={{ '--va-drama': dramaScale }}>
      <AStarfield speed={knobs.orbital} />

      {/* Hero: vertical spine + rotating satellites */}
      <section className="va-hero">
        <div className="va-vertical-spine">
          <div className="va-spine-tagline">全<br/>人<br/>類<br/>U<br/>X<br/>改<br/>善<br/>計<br/>画</div>
        </div>

        <AOrbit speed={knobs.orbital} />

        <div className="va-hero-right">
          <div className="va-hero-id">
            <span className="va-roles">{D.hero.roles[0]} · {D.hero.roles[1]}</span>
            <span className="va-location">— {D.hero.location}</span>
          </div>
          <h1 className="va-name">
            <span className="va-name-ja">長田<br/>謙志郎</span>
          </h1>
          <div className="va-hero-en">
            <span className="va-wordmark">osakenpiro</span>
            <span className="va-en-tag">{D.hero.tagline_en}</span>
          </div>
          <div className="va-hero-manifesto">『 {D.hero.manifesto_ja} 』</div>
        </div>

        <div className="va-hero-orcid">
          <span className="va-tiny">ORCID</span>
          <span className="va-tiny-val">{D.hero.orcid}</span>
        </div>
      </section>

      {/* Papers */}
      <section className="va-section va-papers">
        <ASectionHead kanji="論文" en="9 papers · Boolean → Float" idx="02"/>
        <div className="va-paper-grid">
          {D.papers.map((p, i) => (
            <article key={i} className={`va-paper ${p.core?'va-paper--core':''}`}
              style={{animationDelay: `${i * 60}ms`}}>
              <div className="va-paper-num">{p.n}</div>
              <div className="va-paper-meta">{p.year} · {p.venue}</div>
              <div className="va-paper-ja">{p.ja}</div>
              <div className="va-paper-en">{p.en}</div>
              <div className="va-paper-doi">{p.pending ? '準備中' : `DOI ${p.doi.split('/').pop()}`}</div>
              {p.core && <div className="va-paper-core-tag">◉ 核</div>}
              {p.pending && <div className="va-paper-core-tag" style={{background:'rgba(160,140,100,0.15)',color:'#9b876a'}}>準備中</div>}
            </article>
          ))}
        </div>
      </section>

      {/* Creative — vertical spines per work */}
      <section className="va-section va-creative">
        <ASectionHead kanji="創作" en="manga · novels · picture books" idx="03"/>
        <div className="va-creative-grid">
          {D.creative.map((w, i) => (
            <article key={i} className={`va-work va-work--${w.kind}`}>
              <div className="va-work-kanji">{w.ja}</div>
              <div className="va-work-sep">▮</div>
              <div className="va-work-en">{w.en}</div>
              <div className="va-work-meta">{w.meta}</div>
              <div className="va-work-detail">{w.detail}</div>
            </article>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="va-section va-tools">
        <ASectionHead kanji="ツール" en="single-html · localStorage · worker" idx="04"/>
        <div className="va-tool-list">
          {D.tools.map((t, i) => (
            <a key={i} href={t.url} target="_blank" rel="noopener"
               className={`va-tool ${t.pending?'va-tool--pending':''}`}>
              <span className="va-tool-idx">T.{String(i+1).padStart(2,'0')}</span>
              <span className="va-tool-icon">{t.icon}</span>
              <span className="va-tool-ja">{t.title_ja}</span>
              <span className="va-tool-en">{t.title_en}</span>
              <span className="va-tool-sub">{t.sub}</span>
              <span className="va-tool-stack">{t.stack}</span>
              <span className="va-tool-arrow">→</span>
            </a>
          ))}
        </div>
      </section>

      {/* SNS */}
      <section className="va-section va-sns">
        <ASectionHead kanji="導線" en="find me" idx="05"/>
        <div className="va-sns-grid">
          {D.socials.map((s, i) => (
            <a key={i} href={s.url} className="va-sns">
              <span className="va-sns-glyph">{s.glyph}</span>
              <span className="va-sns-k">{s.k}</span>
              <span className="va-sns-h">{s.handle}</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="va-footer">
        <div className="va-foot-manifesto">#全人類UX改善計画 — 自分の問題を解いて公開すると、人類のUXが改善される</div>
        <div className="va-foot-italic">the center is empty; the circulation constitutes existence</div>
      </footer>
    </div>
  );
}

function ASectionHead({ kanji, en, idx }) {
  return (
    <header className="va-head">
      <div className="va-head-idx">{idx}</div>
      <div className="va-head-kanji">{kanji}</div>
      <div className="va-head-line"/>
      <div className="va-head-en">{en}</div>
    </header>
  );
}

function AStarfield({ speed }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const x = c.getContext('2d');
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random()*innerWidth, y: Math.random()*innerHeight,
      r: Math.random()*1.2 + 0.2, p: Math.random()*Math.PI*2,
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
  return <canvas ref={ref} className="va-stars"/>;
}

function AOrbit({ speed }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const loop = (ts) => { setT(ts); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const sats = [
    { g: '本', r: 110, s: 0.4, start: 0 },
    { g: '筆', r: 110, s: 0.4, start: 2.1 },
    { g: '◇', r: 160, s: 0.22, start: 1.1 },
    { g: '研', r: 160, s: 0.22, start: 3.4 },
    { g: '♪', r: 210, s: 0.14, start: 0.6 },
    { g: '𝕏', r: 210, s: 0.14, start: 2.8 },
  ];
  return (
    <div className="va-orbit">
      <div className="va-orbit-ring va-orbit-ring--1"/>
      <div className="va-orbit-ring va-orbit-ring--2"/>
      <div className="va-orbit-ring va-orbit-ring--3"/>
      <div className="va-orbit-core">空</div>
      {sats.map((s, i) => {
        const ang = s.start + t * 0.001 * s.s * (0.3 + speed*1.5);
        const x = Math.cos(ang) * s.r;
        const y = Math.sin(ang) * s.r * 0.35;
        const depth = (Math.sin(ang)+1)/2;
        return (
          <div key={i} className="va-orbit-sat"
            style={{
              transform: `translate(${x}px, ${y}px) scale(${0.7+depth*0.3})`,
              opacity: 0.4 + depth * 0.6,
              zIndex: Math.round(depth*10),
            }}>{s.g}</div>
        );
      })}
    </div>
  );
}

window.VariantA = VariantA;
