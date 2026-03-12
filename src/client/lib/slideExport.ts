import { SlideData } from '../../shared/types'
import { sanitize } from './sanitize.js'

function slideToHtml(slide: SlideData, index: number): string {
  const num = `<span class="slide-number">${index + 1}</span>`

  switch (slide.type) {
    case 'title':
      return `<section class="slide slide-title">
        <h1 class="slide-heading">${sanitize(slide.heading)}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${sanitize(slide.subtitle)}</p>` : ''}
        ${slide.author ? `<p class="slide-author">${sanitize(slide.author)}</p>` : ''}
        ${slide.date ? `<p class="slide-date">${sanitize(slide.date)}</p>` : ''}
        ${num}
      </section>`

    case 'content':
      return `<section class="slide slide-content">
        <h2 class="slide-heading">${sanitize(slide.heading)}</h2>
        <ul class="slide-bullets">
          ${slide.bullets.map(b => `<li>${sanitize(b)}</li>`).join('\n          ')}
        </ul>
        ${num}
      </section>`

    case 'code':
      return `<section class="slide slide-code">
        <h2 class="slide-heading">${sanitize(slide.heading)}</h2>
        <pre class="slide-code-block"><code>${slide.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        ${slide.caption ? `<p class="slide-caption">${sanitize(slide.caption)}</p>` : ''}
        ${num}
      </section>`

    case 'metrics':
      return `<section class="slide slide-metrics">
        ${slide.heading ? `<h2 class="slide-heading">${sanitize(slide.heading)}</h2>` : ''}
        <div class="slide-stats">
          ${slide.stats.map(s => `<div class="slide-stat"><div class="slide-stat-number">${sanitize(s.number)}</div><div class="slide-stat-label">${sanitize(s.label)}</div></div>`).join('\n          ')}
        </div>
        ${num}
      </section>`

    case 'closing':
      return `<section class="slide slide-closing">
        <h1 class="slide-heading">${sanitize(slide.heading)}</h1>
        ${slide.cta ? `<p class="slide-cta">${sanitize(slide.cta)}</p>` : ''}
        ${slide.links?.length ? `<div class="slide-links">${slide.links.map(l => `<span>${sanitize(l)}</span>`).join('')}</div>` : ''}
        ${num}
      </section>`

    default:
      return ''
  }
}

export function exportSlidesAsHtml(
  slides: SlideData[],
  theme: 'light' | 'dark',
  accent: 'blue' | 'violet' | 'teal' | 'orange'
): Blob {
  const slidesHtml = slides.map((s, i) => slideToHtml(s, i)).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentation — Unpack</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; font-family: 'Inter', system-ui, sans-serif; }

    /* --- Tokens --- */
    .slide-container { --slide-bg:#ffffff;--slide-text:#1a1a2e;--slide-text-secondary:#64648c;--slide-accent:#2563eb;--slide-accent-light:#dbeafe;--slide-border:#e2e8f0;--slide-code-bg:#1e1e2e;--slide-code-text:#cdd6f4; }
    .slide-container.theme-dark { --slide-bg:#1a1a2e;--slide-text:#e2e8f0;--slide-text-secondary:#94a3b8;--slide-border:#334155; }
    .slide-container.theme-dark.accent-blue { --slide-accent:#60a5fa;--slide-accent-light:#1e3a5f; }
    .slide-container.accent-violet { --slide-accent:#7c3aed;--slide-accent-light:#ede9fe; }
    .slide-container.theme-dark.accent-violet { --slide-accent:#a78bfa;--slide-accent-light:#2e1065; }
    .slide-container.accent-teal { --slide-accent:#0d9488;--slide-accent-light:#ccfbf1; }
    .slide-container.theme-dark.accent-teal { --slide-accent:#2dd4bf;--slide-accent-light:#042f2e; }
    .slide-container.accent-orange { --slide-accent:#ea580c;--slide-accent-light:#ffedd5; }
    .slide-container.theme-dark.accent-orange { --slide-accent:#fb923c;--slide-accent-light:#431407; }

    /* --- Base slide (projector-optimized padding) --- */
    .slide { position:absolute; inset:0; display:flex; flex-direction:column; padding:5vh 6vw; background:var(--slide-bg); color:var(--slide-text); overflow:hidden; opacity:0; pointer-events:none; transition:opacity 200ms; }
    .slide.active { opacity:1; pointer-events:auto; }
    .slide-number { position:absolute; bottom:1.5rem; right:2rem; font-size:1rem; color:var(--slide-text-secondary); opacity:0.6; }

    /* --- Title Slide --- */
    .slide-title { justify-content:center; align-items:center; text-align:center; gap:1.25rem; }
    .slide-title::before { content:''; position:absolute; top:0; left:0; right:0; height:5px; background:linear-gradient(90deg, var(--slide-accent), var(--slide-accent-light)); }
    .slide-title::after {
      content:''; position:absolute; inset:0; pointer-events:none; opacity:0.07;
      background:
        radial-gradient(circle at 90% 88%, transparent 14%, var(--slide-accent) 14%, var(--slide-accent) 15%, transparent 15%),
        radial-gradient(circle at 7% 15%, transparent 4.5%, var(--slide-accent) 4.5%, var(--slide-accent) 5.2%, transparent 5.2%),
        radial-gradient(circle at 4% 52%, transparent 1.8%, var(--slide-accent) 1.8%, var(--slide-accent) 2.3%, transparent 2.3%),
        radial-gradient(circle at 93% 10%, var(--slide-accent) 0.8%, transparent 0.8%),
        radial-gradient(circle at 6% 88%, var(--slide-accent) 0.6%, transparent 0.6%),
        radial-gradient(circle at 96% 55%, var(--slide-accent) 0.5%, transparent 0.5%),
        conic-gradient(from 0deg at 94% 42%, var(--slide-accent) 90deg, transparent 90deg),
        linear-gradient(to right, transparent 2%, var(--slide-accent) 2%, var(--slide-accent) 10%, transparent 10%);
      background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 1.2% 1.2%, 100% 2px;
      background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0, 94% 42%, 0 72%;
      background-repeat: no-repeat;
    }
    .slide-title .slide-heading { font-size:4.5rem; font-weight:700; line-height:1.1; letter-spacing:-0.02em; z-index:1; }
    .slide-title .slide-subtitle { font-size:1.75rem; color:var(--slide-text-secondary); max-width:70%; line-height:1.5; z-index:1; }
    .slide-title .slide-author { font-size:1.125rem; color:var(--slide-accent); font-weight:600; margin-top:1rem; letter-spacing:0.03em; text-transform:uppercase; z-index:1; }
    .slide-title .slide-date { font-size:1rem; color:var(--slide-text-secondary); opacity:0.7; z-index:1; }

    /* --- Content Slide --- */
    .slide-content { gap:2.5rem; }
    .slide-content::before {
      content:''; position:absolute; top:-2rem; right:6vw; width:7vw; height:120%;
      background:var(--slide-accent); opacity:0.04; transform:rotate(12deg); pointer-events:none;
    }
    .slide-content::after {
      content:''; position:absolute; bottom:2rem; right:5vw; width:4vw; aspect-ratio:1.5;
      background-image:radial-gradient(circle, var(--slide-accent) 1.5px, transparent 1.5px);
      background-size:8px 8px; opacity:0.1; pointer-events:none;
    }
    .slide-content .slide-heading { font-size:3rem; font-weight:600; border-left:4px solid var(--slide-accent); padding-left:1rem; letter-spacing:-0.01em; position:relative; z-index:1; }
    .slide-content .slide-bullets { list-style:none; display:flex; flex-direction:column; gap:1.5rem; flex:1; position:relative; z-index:1; }
    .slide-content .slide-bullets li { font-size:1.75rem; line-height:1.5; padding-left:2.25rem; position:relative; }
    .slide-content .slide-bullets li::before { content:''; position:absolute; left:0; top:0.45em; width:0.75rem; height:0.75rem; border-radius:2px; background:var(--slide-accent); opacity:0.8; }

    /* --- Code Slide --- */
    .slide-code { gap:1rem; }
    .slide-code::after {
      content:'< >'; position:absolute; top:1.5rem; right:3rem;
      font-size:3.5rem; font-weight:700; font-family:'Fira Code',monospace;
      color:var(--slide-accent); opacity:0.06; pointer-events:none; letter-spacing:0.1em;
    }
    .slide-code .slide-heading { font-size:2.75rem; font-weight:600; border-left:4px solid var(--slide-accent); padding-left:1rem; }
    .slide-code .slide-code-block { flex:1; background:var(--slide-code-bg); color:var(--slide-code-text); border-radius:0.625rem; padding:0 1.5rem 1.25rem; overflow:auto; font-family:'Fira Code',monospace; font-size:1.25rem; line-height:1.7; white-space:pre; tab-size:2; border:1px solid rgba(255,255,255,0.06); }
    .slide-code .slide-code-block::before {
      content:''; display:block; height:2.5rem; margin:0 -1.5rem 1rem; padding:0 1rem;
      background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.06);
      background-image:
        radial-gradient(circle at 1.25rem 50%, #ff5f57 5px, transparent 5px),
        radial-gradient(circle at 2.5rem 50%, #ffbd2e 5px, transparent 5px),
        radial-gradient(circle at 3.75rem 50%, #28c840 5px, transparent 5px);
      background-repeat:no-repeat;
    }
    .slide-code .slide-caption { font-size:1.125rem; color:var(--slide-text-secondary); text-align:center; font-style:italic; opacity:0.8; }

    /* --- Metrics Slide --- */
    .slide-metrics { justify-content:center; gap:2.5rem; }
    .slide-metrics::before {
      content:''; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      width:70%; aspect-ratio:1; border-radius:50%; border:3px solid var(--slide-accent); opacity:0.04; pointer-events:none;
      box-shadow: 0 0 0 3rem transparent, 0 0 0 3rem var(--slide-bg), 0 0 0 calc(3rem + 3px) var(--slide-accent);
    }
    .slide-metrics::after {
      content:''; position:absolute; bottom:2rem; left:2.5rem; width:0; height:0;
      border-left:1.5rem solid transparent; border-right:1.5rem solid transparent; border-bottom:2.5rem solid var(--slide-accent);
      opacity:0.06; pointer-events:none;
    }
    .slide-metrics .slide-heading { font-size:2.75rem; font-weight:600; text-align:center; letter-spacing:-0.01em; position:relative; z-index:1; }
    .slide-metrics .slide-stats { display:flex; justify-content:center; gap:2.5rem; flex-wrap:wrap; position:relative; z-index:1; }
    .slide-metrics .slide-stat { text-align:center; min-width:160px; padding:1.5rem 2rem; background:var(--slide-accent-light); border-radius:0.75rem; border:1px solid var(--slide-border); }
    .slide-metrics .slide-stat-number { font-size:4rem; font-weight:700; color:var(--slide-accent); line-height:1.1; letter-spacing:-0.02em; }
    .slide-metrics .slide-stat-label { font-size:1.25rem; color:var(--slide-text-secondary); margin-top:0.5rem; font-weight:500; }

    /* --- Closing Slide --- */
    .slide-closing { justify-content:center; align-items:center; text-align:center; gap:1.5rem; background:radial-gradient(ellipse at 50% 120%, var(--slide-accent-light) 0%, transparent 60%), var(--slide-bg); }
    .slide-closing::before {
      content:''; position:absolute; top:1.5rem; left:1.5rem;
      width:5rem; height:5rem; border:3px solid var(--slide-accent); border-radius:4px;
      opacity:0.07; pointer-events:none; transform:rotate(-6deg);
      box-shadow:1rem 1rem 0 0 var(--slide-accent);
    }
    .slide-closing::after {
      content:''; position:absolute; bottom:2rem; right:2.5rem;
      width:3.5rem; height:3.5rem; border:3px solid var(--slide-accent); border-radius:3px;
      opacity:0.07; pointer-events:none; transform:rotate(8deg);
      box-shadow:0.75rem 0.75rem 0 0 var(--slide-accent);
    }
    .slide-closing .slide-heading { font-size:3.75rem; font-weight:700; letter-spacing:-0.02em; position:relative; z-index:1; }
    .slide-closing .slide-cta { font-size:1.75rem; color:var(--slide-accent); font-weight:600; padding:0.625rem 2rem; border:2px solid var(--slide-accent); border-radius:9999px; display:inline-block; position:relative; z-index:1; }
    .slide-closing .slide-links { display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem; }
    .slide-closing .slide-links span { font-size:1.25rem; color:var(--slide-text-secondary); opacity:0.8; }

    /* --- Controls --- */
    .controls { position:fixed; bottom:1.5rem; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:1rem; background:rgba(0,0,0,0.7); color:#fff; padding:0.5rem 1.25rem; border-radius:9999px; font-size:0.875rem; z-index:10; }
    .controls button { background:none; border:none; color:#fff; cursor:pointer; font-size:1.25rem; padding:0.25rem 0.5rem; }
    .controls button:hover { opacity:0.7; }
  </style>
</head>
<body>
  <div class="slide-container theme-${theme} accent-${accent}" style="width:100vw;height:100vh;position:relative;">
    ${slidesHtml}
  </div>
  <div class="controls">
    <button id="prev">&larr;</button>
    <span id="counter">1 / ${slides.length}</span>
    <button id="next">&rarr;</button>
    <button id="fs" title="Fullscreen">&#x26F6;</button>
  </div>
  <script>
    (function(){
      const slides = document.querySelectorAll('.slide');
      let cur = 0;
      function show(n) {
        cur = Math.max(0, Math.min(n, slides.length - 1));
        slides.forEach((s, i) => s.classList.toggle('active', i === cur));
        document.getElementById('counter').textContent = (cur + 1) + ' / ' + slides.length;
      }
      show(0);
      document.getElementById('prev').onclick = () => show(cur - 1);
      document.getElementById('next').onclick = () => show(cur + 1);
      document.getElementById('fs').onclick = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      };
      document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === ' ') show(cur + 1);
        if (e.key === 'ArrowLeft') show(cur - 1);
        if (e.key === 'f') document.getElementById('fs').click();
      });
    })();
  </script>
</body>
</html>`

  return new Blob([html], { type: 'text/html' })
}
