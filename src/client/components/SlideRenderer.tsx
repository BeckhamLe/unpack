import DOMPurify from 'dompurify'
import { SlideData } from '../../shared/types'

interface SlideRendererProps {
  slides: SlideData[]
  theme: 'light' | 'dark'
  accent: 'blue' | 'violet' | 'teal' | 'orange'
  previousSlides?: SlideData[]
  onSlideUpdate?: (index: number, slide: SlideData) => void
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

function renderSlide(slide: SlideData, index: number, previousSlides: SlideData[]) {
  const changed = previousSlides.length > 0 && isSlideChanged(slide, previousSlides)

  switch (slide.type) {
    case 'title':
      return (
        <div key={slide.slideId} className="slide slide-title">
          {changed && <span className="slide-changed-badge">Updated</span>}
          <h1 className="slide-heading">{sanitize(slide.heading)}</h1>
          {slide.subtitle && <p className="slide-subtitle">{sanitize(slide.subtitle)}</p>}
          {slide.author && <p className="slide-author">{sanitize(slide.author)}</p>}
          {slide.date && <p className="slide-date">{sanitize(slide.date)}</p>}
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    case 'content':
      return (
        <div key={slide.slideId} className="slide slide-content">
          {changed && <span className="slide-changed-badge">Updated</span>}
          <h2 className="slide-heading">{sanitize(slide.heading)}</h2>
          <ul className="slide-bullets">
            {slide.bullets.map((bullet, i) => (
              <li key={i}>{sanitize(bullet)}</li>
            ))}
          </ul>
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    case 'code':
      return (
        <div key={slide.slideId} className="slide slide-code">
          {changed && <span className="slide-changed-badge">Updated</span>}
          <h2 className="slide-heading">{sanitize(slide.heading)}</h2>
          <pre className="slide-code-block"><code>{slide.code}</code></pre>
          {slide.caption && <p className="slide-caption">{sanitize(slide.caption)}</p>}
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    case 'metrics':
      return (
        <div key={slide.slideId} className="slide slide-metrics">
          {changed && <span className="slide-changed-badge">Updated</span>}
          {slide.heading && <h2 className="slide-heading">{sanitize(slide.heading)}</h2>}
          <div className="slide-stats">
            {slide.stats.map((stat, i) => (
              <div key={i} className="slide-stat">
                <div className="slide-stat-number">{sanitize(stat.number)}</div>
                <div className="slide-stat-label">{sanitize(stat.label)}</div>
              </div>
            ))}
          </div>
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    case 'closing':
      return (
        <div key={slide.slideId} className="slide slide-closing">
          {changed && <span className="slide-changed-badge">Updated</span>}
          <h1 className="slide-heading">{sanitize(slide.heading)}</h1>
          {slide.cta && <p className="slide-cta">{sanitize(slide.cta)}</p>}
          {slide.links && slide.links.length > 0 && (
            <div className="slide-links">
              {slide.links.map((link, i) => (
                <span key={i}>{sanitize(link)}</span>
              ))}
            </div>
          )}
          <span className="slide-number">{index + 1}</span>
        </div>
      )

    default:
      return null
  }
}

export default function SlideRenderer({ slides, theme, accent, previousSlides = [] }: SlideRendererProps) {
  return (
    <div className={`slide-container theme-${theme} accent-${accent}`}>
      {slides.map((slide, i) => renderSlide(slide, i, previousSlides))}
    </div>
  )
}
