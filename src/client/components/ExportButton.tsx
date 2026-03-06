import { SlideData } from '../../shared/types'
import { exportSlidesAsHtml } from '../lib/slideExport.js'

interface ExportButtonProps {
  slides: SlideData[]
  theme: 'light' | 'dark'
  accent: 'blue' | 'violet' | 'teal' | 'orange'
}

export default function ExportButton({ slides, theme, accent }: ExportButtonProps) {
  const handleExport = () => {
    const blob = exportSlidesAsHtml(slides, theme, accent)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'unpack-presentation.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={slides.length === 0}
      className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Download slides
    </button>
  )
}
