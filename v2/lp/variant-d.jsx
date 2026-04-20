// Variant D — hybrid: C rail + B density + A vertical spine accents.
const { useEffect, useRef, useState, useMemo } = React;

const SECTIONS = [
  { id: 'hero',     idx: '01', ja: 'HERO',    en: 'who am I' },
  { id: 'stats',    idx: '02', ja: '集計',    en: 'stats' },
  { id: 'papers',   idx: '03', ja: '論文',    en: 'papers × 9' },
  { id: 'creative', idx: '04', ja: '創作',    en: 'creative' },
  { id: 'tools',    idx: '05', ja: 'ツール',  en: 'tools × 8' },
  { id: 'sns',      idx: '06', ja: '導線',    en: 'find me' },
];

const D_TOOLS_ALL = () => window.OSK_DATA.tools;

function VariantD({ knobs }) {
  const D = window.OSK_DATA;
  const densityClass = knobs.density > 0.66 ? 'dense' : knobs.density > 0.33 ? 'medium' : 'sparse';
  const [active, setActive] = useState('hero');
  const stageRef = useRef(null);

  // scroll-spy
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    const onScroll = () => {
      const y = stage.scrollTop + 140;
      let cur = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = stage.querySelector(`#vd-sec-${s.id}`);
        if (el && el.offsetTop <= y) cur = s.id;
      }
      setActive(cur);
    };
    stage.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => stage.removeEventListener('scroll', onScroll);
  }, []);

  const jumpTo = (id) => {
    const stage = stageRef.current; if (!stage) return;
    const el = stage.querySelector(`#vd-sec-${id}`);
    if (el) stage.scrollTo({ top: el.offsetTop - 40, behavior: 'smooth' });
  };

  return (
    <div className={`vd vd--${densityClass}`} style={{ '--vd-drama': 1 + knobs.drama * 0.5 }}>
      <DStarfield speed={knobs.orbital}/>

      {/* Left command rail (C) */}
      <nav className="vd-rail">
        <div className="vd-rail-brand">
          <div className="vd-rail-kanji">空</div>
          <div className="vd-rail-word">osakenpiro</div>
        </div>
        <ul className="vd-menu">
          {SECTIONS.map(s => (
            <li key={s.id}
                className={`vd-menu-item ${active===s.id?'vd-menu-item--on':''}`}
                onClick={() => jumpTo(s.id)}>
              <span className="vd-menu-bar"/>
              <span className="vd-menu-idx">{s.idx}</span>
              <span className="vd-menu-label">{s.ja}</span>
              <span className="vd-menu-caret">▶</span>
            </li>
          ))}
        </ul>
        <div className="vd-rail-foot">
          <div>#全人類UX改善計画</div>
          <div className="vd-rail-italic">the center is empty</div>
        </div>
      </nav>

      <main ref={stageRef} className="vd-stage">

        {/* HERO — A-spine + orbit + C-kanji */}
        <section id="vd-sec-hero" className="vd-hero">
          <aside className="vd-spine">
            <div className="vd-spine-idx">01</div>
            <div className="vd-spine-ja">全<br/>人<br/>類<br/>U<br/>X<br/>改<br/>善<br/>計<br/>画</div>
          </aside>

          <div className="vd-hero-center">
            <DOrbit speed={knobs.orbital}/>
          </div>

          <div className="vd-hero-right">
            <div className="vd-hero-stamp">SCENE · 01 — 身分</div>
            <h1 className="vd-hero-name">長田<br/>謙志郎</h1>
            <div className="vd-hero-en">Kenshiro Osada</div>
            <div className="vd-hero-roles">
              <span className="vd-chip">ADHD Web Developer</span>
              <span className="vd-chip">Independent Philosopher</span>
              <span className="vd-chip">Tokyo, JP</span>
            </div>
            <div className="vd-hero-handle">@osakenpiro · ORCID {D.hero.orcid}</div>
          </div>

          <div className="vd-hero-foot">
            <div className="vd-hero-en-tag">the universal-UX-improvement plan</div>
            <div className="vd-hero-quote">『 宇宙の片隅で、ひとりで考えごとをしている夜 』</div>
          </div>
        </section>

        {/* STATS — B's gold numbers */}
        <section id="vd-sec-stats" className="vd-stats">
          <div className="vd-stats-head">02 · 集計 — <i>at a glance</i></div>
          <div className="vd-stats-row">
            <div className="vd-stat"><b>9</b><span>論文<br/><em>papers</em></span></div>
            <div className="vd-stat"><b>85</b><span>キャラ<br/><em>characters</em></span></div>
            <div className="vd-stat"><b>17</b><span>巻<br/><em>volumes</em></span></div>
            <div className="vd-stat"><b>8</b><span>ツール<br/><em>tools</em></span></div>
          </div>
        </section>

        {/* PAPERS — B-dense tiles + CORE ribbon */}
        <section id="vd-sec-papers" className="vd-papers">
          <DSectionHead idx="03" kanji="論文 × 9" en="preprints on Zenodo — Boolean → Float"/>
          <div className="vd-paper-grid">
            {D.papers.map((p, i) => {
              const inner = (
                <>
                <div className="vd-paper-top">
                  <span className="vd-paper-n">{p.n}</span>
                  <span className="vd-paper-yr">{p.year}</span>
                </div>
                <div className="vd-paper-ja">{p.ja}</div>
                <div className="vd-paper-en">{p.en}</div>
                <div className="vd-paper-bottom">
                  <span>{p.pending ? '—' : p.venue}</span>
                  <span>{p.pending ? 'pending' : p.doi.split('/').pop()}</span>
                </div>
                {p.core && <div className="vd-paper-ribbon">CORE</div>}
                {p.pending && <div className="vd-paper-pending">準備中</div>}
                </>
              );
              const cls = `vd-paper ${p.core?'vd-paper--core':''} ${p.pending?'':'vd-paper--link'}`;
              return p.pending ? (
                <article key={i} className={cls} style={{animationDelay: `${i*50}ms`}}>{inner}</article>
              ) : (
                <a key={i}
                   href={`https://doi.org/${p.doi}`}
                   target="_blank"
                   rel="noopener"
                   className={cls}
                   style={{animationDelay: `${i*50}ms`}}>{inner}</a>
              );
            })}
          </div>
        </section>

        {/* CREATIVE — A vertical cards + hero Jikoshoukai */}
        <section id="vd-sec-creative" className="vd-creative">
          <DSectionHead idx="04" kanji="創作" en="manga · novels · picture books"/>
          <div className="vd-creative-grid">
            {D.creative.slice(0,3).map((w, i) => {
              const inner = (
                <>
                <div className="vd-work-kind">{w.kind.toUpperCase()}</div>
                <div className="vd-work-ja-vertical">『{w.ja}』</div>
                <div className="vd-work-en">{w.en}</div>
                <div className="vd-work-meta">{w.meta}</div>
                <div className="vd-work-detail">{w.detail}</div>
                <div className="vd-work-arrow">{w.pending ? '準備中' : '↗'}</div>
                </>
              );
              const cls = `vd-work ${w.pending?'vd-work--pending':'vd-work--link'}`;
              return w.pending ? (
                <article key={i} className={cls}>{inner}</article>
              ) : (
                <a key={i} href={w.url} target="_blank" rel="noopener" className={cls}>{inner}</a>
              );
            })}
            <a className="vd-work vd-work--hero vd-work--link"
               href="https://osakenpiro.github.io/jikoshoukai/"
               target="_blank" rel="noopener">
              <div className="vd-work-kind">PICTURE-BOOKS · COMPLETED</div>
              <div className="vd-work-hero-ja">じこしょうかい</div>
              <div className="vd-work-hero-en">Jikoshoukai</div>
              <div className="vd-work-hero-stats">
                <div><b>17</b><span>巻 volumes</span></div>
                <div className="vd-work-divider"/>
                <div><b>85</b><span>キャラ characters</span></div>
              </div>
              <div className="vd-work-hero-detail">自己紹介という哲学行為 — a picture-book series framing "introducing oneself" as a philosophical act. Complete.</div>
              <div className="vd-work-arrow">↗</div>
            </a>
          </div>
        </section>

        {/* TOOLS — hero tool + 7-row list */}
        <section id="vd-sec-tools" className="vd-tools">
          <DSectionHead idx="05" kanji="ツール × 8" en="single-html · localStorage · cloudflare worker"/>
          {(() => {
            const tools = window.OSK_DATA.tools;
            const hero = tools[0];
            return (
              <>
                <a href={hero.url} target="_blank" rel="noopener" className="vd-tool-hero">
                  <div className="vd-tool-hero-icon">{hero.icon}</div>
                  <div className="vd-tool-hero-body">
                    <div className="vd-tool-hero-stamp">T·01 — CANONICAL</div>
                    <div className="vd-tool-hero-ja">{hero.ja}</div>
                    <div className="vd-tool-hero-en">{hero.en}</div>
                    <div className="vd-tool-hero-sub">{hero.sub}</div>
                    <div className="vd-tool-hero-stack">{hero.stack}</div>
                  </div>
                  <div className="vd-tool-hero-cta">開く ▶</div>
                </a>
                <div className="vd-tool-list">
                  {tools.slice(1).map((t, i) => (
                    <a key={i} href={t.url} target="_blank" rel="noopener"
                       className={`vd-tool-row ${t.pending?'vd-tool-row--pending':''}`}>
                      <span className="vd-tool-idx">T·{String(i+2).padStart(2,'0')}</span>
                      <span className="vd-tool-row-icon">{t.icon}</span>
                      <span className="vd-tool-row-ja">{t.ja}</span>
                      <span className="vd-tool-row-en">{t.en}</span>
                      <span className="vd-tool-row-sub">{t.sub}</span>
                      <span className="vd-tool-row-stack">{t.stack}</span>
                      <span className="vd-tool-row-arrow">{t.pending ? '準備中' : '→'}</span>
                    </a>
                  ))}
                </div>
              </>
            );
          })()}
        </section>

        {/* SNS */}
        <section id="vd-sec-sns" className="vd-sns">
          <DSectionHead idx="06" kanji="導線" en="find me"/>
          <div className="vd-sns-row">
            {D.socials.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener" className="vd-sns-item">
                <div className="vd-sns-g">{s.glyph}</div>
                <div className="vd-sns-k">{s.k}</div>
                <div className="vd-sns-h">{s.handle}</div>
              </a>
            ))}
          </div>
          <footer className="vd-footer">
            <div>#全人類UX改善計画 — 自分の問題を解いて公開すると、人類のUXが改善される</div>
            <div className="vd-foot-italic">the center is empty; the circulation constitutes existence</div>
          </footer>
        </section>

      </main>
    </div>
  );
}

function DSectionHead({ idx, kanji, en }) {
  return (
    <header className="vd-head">
      <span className="vd-head-idx">{idx}</span>
      <span className="vd-head-kanji">{kanji}</span>
      <span className="vd-head-line"/>
      <span className="vd-head-en">— {en}</span>
    </header>
  );
}

function DOrbit({ speed }) {
  const [t, setT] = useState(0);
  const [hover, setHover] = useState(null);
  useEffect(() => {
    let raf;
    const loop = ts => { setT(ts); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  // 7 planets — each linked. Radii+start kept from the original Claude Design layout.
  const sats = [
    { g: '🧬', r: 140, s: 0.45, start: 0,    title: 'じこしょうかい',  desc: '全17巻85キャラ完結',      url: 'https://osakenpiro.github.io/jikoshoukai/' },
    { g: '📖', r: 140, s: 0.45, start: 2.3,  title: '星は知らない',    desc: 'カクヨム · SF長編8章',     url: 'https://kakuyomu.jp/users/osakenpiro' },
    { g: '🌙', r: 210, s: 0.18, start: 1.1,  title: '月 (moon)',       desc: '全ツール一覧ハブ',         url: 'https://osakenpiro.github.io/moon/' },
    { g: '🔬', r: 210, s: 0.18, start: 3.9,  title: '論文 × 9',        desc: 'Zenodo プレプリント',      url: 'https://zenodo.org/search?q=metadata.creators.person_or_org.name%3A%22Osada%2C%20Kenshiro%22' },
    { g: '𝕏',  r: 270, s: 0.25, start: 0.6,  title: 'X',               desc: '日常哲学 / 論文告知',      url: 'https://x.com/kenpiro7' },
    { g: '♪',  r: 270, s: 0.25, start: 2.8,  title: 'Suno',            desc: 'オリジナル楽曲アーティストページ',  url: 'https://suno.com/@osakenpiro' },
    { g: '🐸', r: 270, s: 0.25, start: 4.8,  title: 'わっかずかん',    desc: '連続値で眺める図鑑',       url: 'https://osakenpiro.github.io/wakkazukan/' },
  ];
  const hoverSat = hover != null ? sats[hover] : null;
  return (
    <div className="vd-orbit">
      {[140,210,270].map(r => (
        <div key={r} className="vd-orbit-ring" style={{width:r*2,height:r*2*0.35}}/>
      ))}
      <div className="vd-orbit-core">空</div>
      {sats.map((s, i) => {
        const ang = s.start + t * 0.001 * s.s * (0.3 + speed * 1.5);
        const x = Math.cos(ang)*s.r, y = Math.sin(ang)*s.r*0.35;
        const d = (Math.sin(ang)+1)/2;
        return (
          <a key={i}
             href={s.url}
             target="_blank"
             rel="noopener"
             aria-label={s.title}
             className={`vd-orbit-sat ${hover===i?'vd-orbit-sat--on':''}`}
             style={{
               transform: `translate(${x}px,${y}px) scale(${0.7+d*0.3})`,
               opacity: 0.4+d*0.6, zIndex: Math.round(d*10),
             }}
             onMouseEnter={()=>setHover(i)}
             onMouseLeave={()=>setHover(cur => cur===i ? null : cur)}
             onFocus={()=>setHover(i)}
             onBlur={()=>setHover(cur => cur===i ? null : cur)}
          >{s.g}</a>
        );
      })}
      {hoverSat && (
        <div className="vd-orbit-tip" aria-hidden="true">
          <div className="vd-orbit-tip-title">{hoverSat.title}</div>
          <div className="vd-orbit-tip-desc">{hoverSat.desc}</div>
          <div className="vd-orbit-tip-cta">開く →</div>
        </div>
      )}
    </div>
  );
}

function DStarfield({ speed }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const x = c.getContext('2d');
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener('resize', resize);
    const stars = Array.from({length: 140}, () => ({
      x: Math.random()*innerWidth, y: Math.random()*innerHeight,
      r: Math.random()*1.2 + 0.3, p: Math.random()*Math.PI*2,
      s: 0.3 + Math.random()*0.8,
    }));
    let raf;
    const loop = (t) => {
      x.clearRect(0,0,c.width,c.height);
      for (const s of stars) {
        const a = 0.12 + 0.3 * Math.sin(s.p + t*0.001*s.s*(0.4 + speed*1.5));
        x.beginPath(); x.arc(s.x,s.y,s.r,0,Math.PI*2);
        x.fillStyle = `rgba(200,184,160,${a})`; x.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, [speed]);
  return <canvas ref={ref} className="vd-stars"/>;
}

window.VariantD = VariantD;
