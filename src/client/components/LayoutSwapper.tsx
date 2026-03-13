import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { SlideData, SlideType } from '../../shared/types'
import { cn } from '../lib/utils.js'

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
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [showModal, setShowModal] = useState<'code' | 'metrics' | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [codeLang, setCodeLang] = useState('javascript')
  const [statsInput, setStatsInput] = useState<{ number: string; label: string }[]>([
    { number: '', label: '' },
    { number: '', label: '' },
  ])
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const heading = 'heading' in slide ? slide.heading || '' : ''

  const updateStat = (idx: number, field: 'number' | 'label', value: string) => {
    setStatsInput(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }
  const currentLabel = LAYOUT_OPTIONS.find(o => o.type === slide.type)?.label ?? slide.type

  const handleOpen = useCallback(() => {
    if (open) {
      setOpen(false)
      return
    }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(true)
  }, [open])

  // Close dropdown on outside click or scroll
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const handleScroll = () => setOpen(false)
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  const handleSwap = (targetType: SlideType) => {
    setOpen(false)
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
    <>
      <div className={cn('layout-swapper', open && 'open')}>
        <button
          ref={triggerRef}
          className="layout-swapper-trigger"
          onClick={handleOpen}
        >
          {currentLabel}
          <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>
      </div>

      {/* Portal to body — inline styles for everything critical so CSS cascade can't break it */}
      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            minWidth: 130,
            padding: 4,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--card)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)',
            animation: 'swapper-menu-in 120ms ease-out',
          }}
        >
          {LAYOUT_OPTIONS.map(opt => {
            const isActive = opt.type === slide.type
            return (
              <button
                key={opt.type}
                onClick={() => handleSwap(opt.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 5,
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <span>{opt.label}</span>
                {isActive && <span style={{ fontSize: '0.65rem' }}>&#10003;</span>}
              </button>
            )
          })}
        </div>,
        document.body
      )}

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
                  onChange={e => updateStat(i, 'number', e.target.value)}
                  placeholder="Number"
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground"
                />
                <input
                  value={stat.label}
                  onChange={e => updateStat(i, 'label', e.target.value)}
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
    </>
  )
}
