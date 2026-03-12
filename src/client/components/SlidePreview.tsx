import { useState, useEffect, useRef } from 'react'
import { SlideData, DeliveryBrief } from '../../shared/types'
import SlideRenderer, { SlideTheme } from './SlideRenderer.js'
import ExportButton from './ExportButton.js'
import LayoutSwapper from './LayoutSwapper.js'
import DeliveryBriefCard from './DeliveryBriefCard.js'
import { cn } from '../lib/utils.js'

interface SlidePreviewProps {
  slides: SlideData[]
  previousSlides: SlideData[]
  onSlidesChange: (slides: SlideData[]) => void
  isStreaming: boolean
  title: string
  deliveryBrief: DeliveryBrief | null
}

export default function SlidePreview({ slides, previousSlides, onSlidesChange, isStreaming, title, deliveryBrief }: SlidePreviewProps) {
  const [slidesVisible, setSlidesVisible] = useState(true)
  const [theme, setTheme] = useState<SlideTheme>('geometric-deco')
  const wasStreamingRef = useRef(false)

  // When streaming ends and we have a delivery brief, stagger the slides in
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && deliveryBrief) {
      setSlidesVisible(false)
      const timer = setTimeout(() => setSlidesVisible(true), 1200)
      return () => clearTimeout(timer)
    }
    if (!isStreaming && !deliveryBrief) {
      setSlidesVisible(true)
    }
    wasStreamingRef.current = isStreaming
  }, [isStreaming, deliveryBrief])

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
        <div className="theme-toggle">
          <button
            className={cn('theme-toggle-btn', theme === 'geometric-deco' && 'active')}
            onClick={() => setTheme('geometric-deco')}
          >
            Dark
          </button>
          <button
            className={cn('theme-toggle-btn', theme === 'architectural-editorial' && 'active')}
            onClick={() => setTheme('architectural-editorial')}
          >
            Light
          </button>
        </div>
        <ExportButton slides={slides} title={title} />
      </div>

      {/* Delivery brief — appears immediately when streaming ends */}
      {deliveryBrief && !isStreaming && (
        <div className="animate-in fade-in duration-500">
          <DeliveryBriefCard brief={deliveryBrief} />
        </div>
      )}

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

      {/* Scrollable slide list — staggers in after delivery brief */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-opacity duration-700 ease-in-out ${isStreaming ? 'opacity-60' : slidesVisible ? 'opacity-100' : 'opacity-0'}`}>
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
              previousSlides={previousSlides}
              theme={theme}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
