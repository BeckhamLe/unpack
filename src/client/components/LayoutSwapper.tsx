import { useState } from 'react'
import { SlideData, SlideType } from '../../shared/types'

interface LayoutSwapperProps {
  slide: SlideData
  onSwap: (newSlide: SlideData) => void
}

const LAYOUT_OPTIONS: { type: SlideType; label: string }[] = [
  { type: 'title', label: 'Title' },
  { type: 'content', label: 'Content' },
  { type: 'code', label: 'Code' },
  { type: 'metrics', label: 'Metrics' },
  { type: 'closing', label: 'Closing' },
]

export default function LayoutSwapper({ slide, onSwap }: LayoutSwapperProps) {
  const [showModal, setShowModal] = useState<'code' | 'metrics' | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [codeLang, setCodeLang] = useState('javascript')
  const [statsInput, setStatsInput] = useState<{ number: string; label: string }[]>([
    { number: '', label: '' },
    { number: '', label: '' },
  ])

  const heading = 'heading' in slide ? slide.heading || '' : ''

  const handleSwap = (targetType: SlideType) => {
    if (targetType === slide.type) return

    if (targetType === 'code') {
      setShowModal('code')
      return
    }
    if (targetType === 'metrics') {
      setShowModal('metrics')
      return
    }

    const baseContent = 'bullets' in slide ? slide.bullets.join('\n') :
                        'code' in slide ? slide.code :
                        'cta' in slide ? (slide.cta || '') : ''

    switch (targetType) {
      case 'title':
        onSwap({ slideId: slide.slideId, type: 'title', heading, subtitle: baseContent })
        break
      case 'content':
        onSwap({ slideId: slide.slideId, type: 'content', heading, bullets: baseContent ? baseContent.split('\n').filter(Boolean) : [''] })
        break
      case 'closing':
        onSwap({ slideId: slide.slideId, type: 'closing', heading, cta: baseContent })
        break
    }
  }

  const submitCode = () => {
    onSwap({ slideId: slide.slideId, type: 'code', heading, code: codeInput, language: codeLang })
    setShowModal(null)
  }

  const submitMetrics = () => {
    const validStats = statsInput.filter(s => s.number.trim() && s.label.trim())
    if (validStats.length === 0) return
    onSwap({ slideId: slide.slideId, type: 'metrics', heading, stats: validStats })
    setShowModal(null)
  }

  return (
    <div className="relative">
      <select
        value={slide.type}
        onChange={(e) => handleSwap(e.target.value as SlideType)}
        className="text-xs bg-card border border-border rounded px-1.5 py-0.5 text-foreground"
      >
        {LAYOUT_OPTIONS.map(opt => (
          <option key={opt.type} value={opt.type}>{opt.label}</option>
        ))}
      </select>

      {/* Code modal */}
      {showModal === 'code' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(null)}>
          <div className="bg-card border border-border rounded-lg p-4 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-foreground">Add Code</h3>
            <select value={codeLang} onChange={e => setCodeLang(e.target.value)} className="text-xs bg-background border border-border rounded px-2 py-1 w-full text-foreground">
              {['javascript', 'typescript', 'python', 'rust', 'go', 'html', 'css', 'sql', 'bash', 'other'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <textarea
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              placeholder="Paste your code here..."
              className="w-full h-32 bg-background border border-border rounded p-2 text-sm font-mono text-foreground"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(null)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={submitCode} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics modal */}
      {showModal === 'metrics' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(null)}>
          <div className="bg-card border border-border rounded-lg p-4 w-full max-w-sm space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-foreground">Add Metrics</h3>
            {statsInput.map((stat, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={stat.number}
                  onChange={e => { const s = [...statsInput]; s[i].number = e.target.value; setStatsInput(s) }}
                  placeholder="Number"
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground"
                />
                <input
                  value={stat.label}
                  onChange={e => { const s = [...statsInput]; s[i].label = e.target.value; setStatsInput(s) }}
                  placeholder="Label"
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground"
                />
              </div>
            ))}
            {statsInput.length < 4 && (
              <button
                onClick={() => setStatsInput([...statsInput, { number: '', label: '' }])}
                className="text-xs text-primary hover:underline"
              >
                + Add metric
              </button>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(null)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={submitMetrics} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
