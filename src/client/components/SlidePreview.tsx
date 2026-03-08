import { useState, useEffect } from 'react'
import { SlideData } from '../../shared/types'
import SlideRenderer from './SlideRenderer.js'
import ThemePicker from './ThemePicker.js'
import ExportButton from './ExportButton.js'
import LayoutSwapper from './LayoutSwapper.js'

interface SlidePreviewProps {
  slides: SlideData[]
  previousSlides: SlideData[]
  onSlidesChange: (slides: SlideData[]) => void
  isStreaming: boolean
  title: string
}

export default function SlidePreview({ slides, previousSlides, onSlidesChange, isStreaming, title }: SlidePreviewProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('unpack-slide-theme') as 'light' | 'dark') || 'light'
  })
  const [accent, setAccent] = useState<'blue' | 'violet' | 'teal' | 'orange'>(() => {
    return (localStorage.getItem('unpack-slide-accent') as 'blue' | 'violet' | 'teal' | 'orange') || 'blue'
  })

  useEffect(() => {
    localStorage.setItem('unpack-slide-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('unpack-slide-accent', accent)
  }, [accent])

  const handleSlideSwap = (index: number, newSlide: SlideData) => {
    const updated = [...slides]
    updated[index] = newSlide
    onSlidesChange(updated)
  }

  if (slides.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm p-8 text-center gap-4">
        {isStreaming ? (
          <>
            <div className="slide-shimmer-skeleton w-full max-w-sm aspect-video rounded-lg" />
            <span className="text-xs">Building your slides...</span>
          </>
        ) : (
          <span>Slides will appear here once the conversation reaches the structure phase.</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Preview toolbar */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between flex-shrink-0">
        <ThemePicker
          theme={theme}
          accent={accent}
          onThemeChange={setTheme}
          onAccentChange={setAccent}
        />
        <ExportButton slides={slides} title={title} />
      </div>

      {/* Streaming overlay */}
      {isStreaming && (
        <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          <span>Updating slides...</span>
        </div>
      )}

      {/* Scrollable slide list */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-opacity duration-200 ${isStreaming ? 'opacity-60' : ''}`}>
        {slides.map((slide, i) => (
          <div key={slide.slideId} className="relative group">
            {/* Layout swapper overlay */}
            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <LayoutSwapper
                slide={slide}
                onSwap={(newSlide) => handleSlideSwap(i, newSlide)}
              />
            </div>
            <SlideRenderer
              slides={[slide]}
              theme={theme}
              accent={accent}
              previousSlides={previousSlides}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
