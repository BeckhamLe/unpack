import { SlideData } from '../../shared/types'
import DOMPurify from 'dompurify'

function sanitize(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

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

    .slide-container { --slide-bg:#ffffff;--slide-text:#1a1a2e;--slide-text-secondary:#64648c;--slide-accent:#2563eb;--slide-accent-light:#dbeafe;--slide-border:#e2e8f0;--slide-code-bg:#1e1e2e;--slide-code-text:#cdd6f4; }
    .slide-container.theme-dark { --slide-bg:#1a1a2e;--slide-text:#e2e8f0;--slide-text-secondary:#94a3b8;--slide-border:#334155; }
    .slide-container.theme-dark.accent-blue { --slide-accent:#60a5fa;--slide-accent-light:#1e3a5f; }
    .slide-container.accent-violet { --slide-accent:#7c3aed;--slide-accent-light:#ede9fe; }
    .slide-container.theme-dark.accent-violet { --slide-accent:#a78bfa;--slide-accent-light:#2e1065; }
    .slide-container.accent-teal { --slide-accent:#0d9488;--slide-accent-light:#ccfbf1; }
    .slide-container.theme-dark.accent-teal { --slide-accent:#2dd4bf;--slide-accent-light:#042f2e; }
    .slide-container.accent-orange { --slide-accent:#ea580c;--slide-accent-light:#ffedd5; }
    .slide-container.theme-dark.accent-orange { --slide-accent:#fb923c;--slide-accent-light:#431407; }

    .slide { position:absolute; inset:0; display:flex; flex-direction:column; padding:clamp(2rem,4vw,4rem); background:var(--slide-bg); color:var(--slide-text); opacity:0; pointer-events:none; transition:opacity 200ms; }
    .slide.active { opacity:1; pointer-events:auto; }
    .slide-number { position:absolute; bottom:1rem; right:1.5rem; font-size:0.875rem; color:var(--slide-text-secondary); opacity:0.6; }

    .slide-title { justify-content:center; align-items:center; text-align:center; gap:0.75rem; }
    .slide-title .slide-heading { font-size:clamp(2.5rem,5vw,4rem); font-weight:700; line-height:1.1; }
    .slide-title .slide-subtitle { font-size:clamp(1rem,2vw,1.5rem); color:var(--slide-text-secondary); max-width:80%; }
    .slide-title .slide-author { font-size:clamp(0.875rem,1.5vw,1.125rem); color:var(--slide-accent); font-weight:500; margin-top:0.5rem; }
    .slide-title .slide-date { font-size:clamp(0.75rem,1.2vw,1rem); color:var(--slide-text-secondary); }

    .slide-content { gap:clamp(1rem,2vw,2rem); }
    .slide-content .slide-heading { font-size:clamp(1.75rem,3.5vw,2.75rem); font-weight:600; border-bottom:3px solid var(--slide-accent); padding-bottom:0.5rem; }
    .slide-content .slide-bullets { list-style:none; display:flex; flex-direction:column; gap:1rem; flex:1; }
    .slide-content .slide-bullets li { font-size:clamp(1rem,1.8vw,1.5rem); line-height:1.5; padding-left:2rem; position:relative; }
    .slide-content .slide-bullets li::before { content:''; position:absolute; left:0; top:0.55em; width:0.625rem; height:0.625rem; border-radius:50%; background:var(--slide-accent); }

    .slide-code { gap:0.75rem; }
    .slide-code .slide-heading { font-size:clamp(1.5rem,3vw,2.5rem); font-weight:600; }
    .slide-code .slide-code-block { flex:1; background:var(--slide-code-bg); color:var(--slide-code-text); border-radius:0.5rem; padding:1.5rem; overflow:auto; font-family:'Fira Code',monospace; font-size:clamp(0.8rem,1.2vw,1.1rem); line-height:1.6; white-space:pre; tab-size:2; }
    .slide-code .slide-caption { font-size:clamp(0.75rem,1.2vw,1rem); color:var(--slide-text-secondary); text-align:center; font-style:italic; }

    .slide-metrics { justify-content:center; gap:clamp(1rem,2vw,2rem); }
    .slide-metrics .slide-heading { font-size:clamp(1.5rem,3vw,2.5rem); font-weight:600; text-align:center; }
    .slide-metrics .slide-stats { display:flex; justify-content:center; gap:clamp(2rem,4vw,4rem); flex-wrap:wrap; }
    .slide-metrics .slide-stat { text-align:center; min-width:140px; }
    .slide-metrics .slide-stat-number { font-size:clamp(2.5rem,5vw,4rem); font-weight:700; color:var(--slide-accent); line-height:1.1; }
    .slide-metrics .slide-stat-label { font-size:clamp(0.875rem,1.5vw,1.125rem); color:var(--slide-text-secondary); margin-top:0.25rem; }

    .slide-closing { justify-content:center; align-items:center; text-align:center; gap:1rem; }
    .slide-closing .slide-heading { font-size:clamp(2rem,4vw,3.5rem); font-weight:700; }
    .slide-closing .slide-cta { font-size:clamp(1rem,2vw,1.5rem); color:var(--slide-accent); font-weight:600; }
    .slide-closing .slide-links { display:flex; flex-direction:column; gap:0.25rem; }
    .slide-closing .slide-links span { font-size:clamp(0.75rem,1.2vw,1rem); color:var(--slide-text-secondary); }

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
