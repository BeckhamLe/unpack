import { useState } from 'react'
import { SlideData } from '../../shared/types'
import { supabase } from '../lib/supabase.js'
import requestServices from '../services/requests'

interface ExportButtonProps {
  slides: SlideData[]
  title: string
}

export default function ExportButton({ slides, title }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showReauthModal, setShowReauthModal] = useState(false)

  const handleExport = async () => {
    if (slides.length === 0 || loading) return
    setLoading(true)

    try {
      const { url } = await requestServices.exportToGoogleSlides(slides, title || 'Unpack Presentation')
      window.open(url, '_blank')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Export failed'
      if (message === 'google_reauth_needed') {
        setShowReauthModal(true)
      } else {
        console.error('Export failed:', message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReauth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/drive.file',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <>
      <button
        onClick={handleExport}
        disabled={slides.length === 0 || loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <GoogleSlidesIcon />
        {loading ? 'Exporting...' : 'Export to Google Slides'}
      </button>

      {/* Re-auth modal */}
      {showReauthModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowReauthModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-lg">
              <h3 className="text-base font-semibold mb-2">Connect Google Drive</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                To export your presentation, Unpack needs permission to create files in your Google Drive. You'll be redirected to Google to approve this.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowReauthModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReauth}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Connect Google Drive
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function GoogleSlidesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <rect x="8" y="13" width="8" height="4" rx="0.5" />
    </svg>
  )
}
