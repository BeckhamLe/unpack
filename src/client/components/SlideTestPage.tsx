/**
 * Test page for verifying slide visual fixes.
 * Import this into App.tsx temporarily to test:
 *   import SlideTestPage from './components/SlideTestPage'
 *   // Then render <SlideTestPage /> somewhere
 *
 * Remove after testing — not production code.
 */
import { useState } from 'react'
import SlideRenderer, { SlideTheme } from './SlideRenderer'
import { SlideData } from '../../shared/types'
import '../styles/slides.css'

const testSlides: SlideData[] = [
  // Content slide — few bullets (should be clean vertical list, no cards)
  {
    slideId: 'test-content-few',
    type: 'content',
    heading: 'A coach that starts before the slides',
    bullets: [
      'Conversational AI that asks the right questions to help you find your message',
      'Guides you through topic, audience, structure, and key takeaways',
      'No blank page — just a conversation that does the heavy lifting',
    ],
  },
  // Content slide — many bullets (should still be clean list, not cards)
  {
    slideId: 'test-content-many',
    type: 'content',
    heading: 'Ever had no idea what to say?',
    bullets: [
      'Most of us have been there — blank page, no idea where to start',
      'Existing tools assume you already know what you want to present',
      'Even ChatGPT requires you to already have clarity before it can help',
      'This app was used to build the slides you\'re looking at right now',
      'The conversation is the product, not just the output',
      'Works for technical demos, investor pitches, team updates, and more',
    ],
  },
  // Metrics — short numbers (should look fine)
  {
    slideId: 'test-metrics-short',
    type: 'metrics',
    heading: 'By the Numbers',
    stats: [
      { number: '2.4x', label: 'Retention Improvement' },
      { number: '68%', label: 'Less Time Reviewing' },
      { number: '94%', label: 'Weekly Retention' },
      { number: '<$0.01', label: 'AI Cost Per User/Day' },
    ],
  },
  // Metrics — long text numbers (was cramming before)
  {
    slideId: 'test-metrics-long',
    type: 'metrics',
    heading: 'No tool does both. Until now.',
    stats: [
      { number: '0', label: 'Other tools combining coaching + slide generation' },
      { number: '1 conversation', label: 'From no idea to a full slide deck' },
      { number: 'Your next demo', label: 'Already handled' },
    ],
  },
  // Metrics — 2 stats only
  {
    slideId: 'test-metrics-two',
    type: 'metrics',
    heading: 'Simple Metrics',
    stats: [
      { number: '10x', label: 'Faster than starting from scratch' },
      { number: '100%', label: 'Guided from blank page to deck' },
    ],
  },
  // Closing — with QR code
  {
    slideId: 'test-closing-qr',
    type: 'closing',
    heading: 'Use it for your next demo',
    cta: 'Stop building your own pipeline — this already works.',
    qrCode: 'https://unpack.pro',
    links: ['unpack.pro', 'github.com/BeckhamLe/unpack'],
  },
  // Closing — without QR code, just links (link text should be readable)
  {
    slideId: 'test-closing-links',
    type: 'closing',
    heading: 'Thank You',
    cta: 'Questions? Let\'s connect.',
    links: ['yourname@email.com', 'linkedin.com/in/yourname', 'yourportfolio.dev'],
  },
]

export default function SlideTestPage() {
  const [theme, setTheme] = useState<SlideTheme>('geometric-deco')

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto', background: '#111' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>Slide Test Page</h2>
        <button
          onClick={() => setTheme('geometric-deco')}
          style={{
            padding: '0.5rem 1rem',
            background: theme === 'geometric-deco' ? '#6366f1' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Dark (Geo Deco)
        </button>
        <button
          onClick={() => setTheme('architectural-editorial')}
          style={{
            padding: '0.5rem 1rem',
            background: theme === 'architectural-editorial' ? '#b45309' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Light (Editorial)
        </button>
      </div>

      <SlideRenderer slides={testSlides} theme={theme} />
    </div>
  )
}
