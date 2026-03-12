import DOMPurify from 'dompurify'
import { SlideData } from '../../shared/types'

export type SlideTheme = 'geometric-deco' | 'architectural-editorial'

interface SlideRendererProps {
  slides: SlideData[]
  previousSlides?: SlideData[]
  theme?: SlideTheme
}

const ALLOWED_TAGS = ['div', 'span', 'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'pre', 'code', 'a', 'strong', 'em']
const ALLOWED_ATTR = ['class', 'href']

function sanitize(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

function isSlideChanged(slide: SlideData, previousSlides: SlideData[]): boolean {
  const prev = previousSlides.find(s => s.slideId === slide.slideId)
  if (!prev) return true
  return JSON.stringify(slide) !== JSON.stringify(prev)
}

/* ═══════════════════════════════════════════
   GEO CANVAS — decorative background shapes
   Class names are theme-scoped in CSS
   ═══════════════════════════════════════════ */

function TitleGeo({ theme }: { theme: SlideTheme }) {
  if (theme === 'geometric-deco') {
    return (
      <div className="geo-canvas">
        <div className="geo-circle-1" />
        <div className="geo-half-circle" />
        <div className="geo-rect-1" />
        <div className="geo-rect-2" />
        <div className="geo-square-1" />
        <div className="geo-arc-1" />
        <div className="geo-dot-grid" />
        <div className="geo-ring" />
      </div>
    )
  }
  return (
    <div className="geo-canvas">
      <div className="geo-tr-rect-1" />
      <div className="geo-tr-rect-2" />
      <div className="geo-tr-half-circle" />
      <div className="geo-tr-square" />
      <div className="geo-tr-stripe" />
      <div className="geo-bl-rect-1" />
      <div className="geo-bl-rect-2" />
      <div className="geo-bl-arc" />
      <div className="geo-dot-accent" />
      <div className="geo-diagonal-line" />
    </div>
  )
}

function ContentGeo({ theme }: { theme: SlideTheme }) {
  if (theme === 'geometric-deco') {
    return (
      <div className="geo-canvas">
        <div className="geo-arc-tl" />
        <div className="geo-dots-br" />
        <div className="geo-line-tr" />
        <div className="geo-circle-bl" />
        <div className="geo-square-tr" />
      </div>
    )
  }
  return (
    <div className="geo-canvas">
      <div className="geo-tr-rect" />
      <div className="geo-tr-terracotta" />
      <div className="geo-tr-circle" />
      <div className="geo-bl-stripe" />
      <div className="geo-bl-sage" />
    </div>
  )
}

function CodeGeo({ theme }: { theme: SlideTheme }) {
  if (theme === 'geometric-deco') {
    return (
      <div className="geo-canvas">
        <div className="geo-code-glow" />
        <div className="geo-line-left" />
        <div className="geo-corner-tr" />
        <div className="geo-dots-bl" />
      </div>
    )
  }
  return (
    <div className="geo-canvas">
      <div className="geo-corner-rect" />
      <div className="geo-corner-gold" />
    </div>
  )
}

function MetricsGeo({ theme }: { theme: SlideTheme }) {
  if (theme === 'geometric-deco') {
    return (
      <div className="geo-canvas">
        <div className="geo-circle-left" />
        <div className="geo-rect-br" />
        <div className="geo-arc-tr" />
        <div className="geo-dots-tl" />
        <div className="geo-square-accent" />
      </div>
    )
  }
  return (
    <div className="geo-canvas">
      <div className="geo-edge-rect-tr" />
      <div className="geo-edge-terra-tr" />
      <div className="geo-edge-circle-tr" />
      <div className="geo-edge-rect-bl" />
      <div className="geo-edge-sage-bl" />
      <div className="geo-dot-accent" />
    </div>
  )
}

function ClosingGeo({ theme }: { theme: SlideTheme }) {
  if (theme === 'geometric-deco') {
    return (
      <div className="geo-canvas">
        <div className="geo-circle-bl" />
        <div className="geo-half-top" />
        <div className="geo-rect-right" />
        <div className="geo-rect-low" />
        <div className="geo-square-tl" />
        <div className="geo-arc-br" />
        <div className="geo-dots" />
        <div className="geo-ring" />
      </div>
    )
  }
  return (
    <div className="geo-canvas">
      <div className="geo-tr-rect-1" />
      <div className="geo-tr-rect-2" />
      <div className="geo-tr-half-circle" />
      <div className="geo-tr-square" />
      <div className="geo-tr-stripe" />
      <div className="geo-bl-rect-1" />
      <div className="geo-bl-rect-2" />
      <div className="geo-bl-arc" />
      <div className="geo-dot-accent" />
      <div className="geo-diagonal-line" />
    </div>
  )
}

/* ═══════════════════════════════════════════
   SLIDE RENDERERS
   ═══════════════════════════════════════════ */

function renderSlide(slide: SlideData, index: number, previousSlides: SlideData[], theme: SlideTheme) {
  const changed = previousSlides.length > 0 && isSlideChanged(slide, previousSlides)
  // Use grid layout for content bullets when there are 4+
  const useGrid = slide.type === 'content' && slide.bullets.length >= 4

  switch (slide.type) {
    case 'title':
      return (
        <div key={slide.slideId} className="slide slide-title">
          <TitleGeo theme={theme} />
          {changed && <span className="slide-changed-badge">Updated</span>}
          <div className="slide-inner centered">
            <h1 className="slide-heading">{sanitize(slide.heading)}</h1>
            {slide.subtitle && <p className="slide-subtitle">{sanitize(slide.subtitle)}</p>}
            {slide.author && <p className="slide-author">{sanitize(slide.author)}</p>}
            {slide.date && <p className="slide-date">{sanitize(slide.date)}</p>}
          </div>
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    case 'content':
      return (
        <div key={slide.slideId} className="slide slide-content">
          <ContentGeo theme={theme} />
          {changed && <span className="slide-changed-badge">Updated</span>}
          <div className="slide-inner">
            <h2 className="slide-heading heading-underline">{sanitize(slide.heading)}</h2>
            <ul className={`slide-bullets${useGrid ? ' grid-layout' : ''}`}>
              {slide.bullets.map((bullet, i) => (
                <li key={i}>{sanitize(bullet)}</li>
              ))}
            </ul>
          </div>
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    case 'code':
      return (
        <div key={slide.slideId} className="slide slide-code">
          <CodeGeo theme={theme} />
          {changed && <span className="slide-changed-badge">Updated</span>}
          <div className="slide-inner">
            <h2 className="slide-heading heading-underline">{sanitize(slide.heading)}</h2>
            {slide.caption && <p className="slide-caption">{sanitize(slide.caption)}</p>}
            <pre className="slide-code-block"><code>{slide.code}</code></pre>
          </div>
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    case 'metrics':
      return (
        <div key={slide.slideId} className="slide slide-metrics">
          <MetricsGeo theme={theme} />
          {changed && <span className="slide-changed-badge">Updated</span>}
          <div className="slide-inner">
            {slide.heading && <h2 className="slide-heading heading-underline">{sanitize(slide.heading)}</h2>}
            <div className="slide-stats">
              {slide.stats.map((stat, i) => (
                <div key={i} className="slide-stat">
                  <div className="slide-stat-number">{sanitize(stat.number)}</div>
                  <div className="slide-stat-label">{sanitize(stat.label)}</div>
                </div>
              ))}
            </div>
          </div>
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    case 'closing':
      return (
        <div key={slide.slideId} className="slide slide-closing">
          <ClosingGeo theme={theme} />
          {changed && <span className="slide-changed-badge">Updated</span>}
          <div className="slide-inner centered">
            <h1 className="slide-heading">{sanitize(slide.heading)}</h1>
            {slide.cta && <p className="slide-cta">{sanitize(slide.cta)}</p>}
            {slide.links && slide.links.length > 0 && (
              <div className="slide-links">
                {slide.links.map((link, i) => (
                  <span key={i}>{sanitize(link)}</span>
                ))}
              </div>
            )}
          </div>
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    default:
      return null
  }
}

export default function SlideRenderer({ slides, previousSlides = [], theme = 'geometric-deco' }: SlideRendererProps) {
  return (
    <div className="slide-container" data-theme={theme}>
      {slides.map((slide, i) => renderSlide(slide, i, previousSlides, theme))}
    </div>
  )
}
