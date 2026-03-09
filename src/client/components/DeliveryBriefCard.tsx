import { useState, useRef, useEffect } from 'react'
import { DeliveryBrief } from '../../shared/types'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface DeliveryBriefCardProps {
  brief: DeliveryBrief
}

export default function DeliveryBriefCard({ brief }: DeliveryBriefCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)

  if (!brief.overview || !brief.audienceHook || !brief.coreMoment || !brief.closingGuide) return null

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [brief])

  return (
    <div className="mx-4 mt-4 rounded-lg border border-border bg-card text-card-foreground">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold"
      >
        <span>Delivery Brief</span>
        {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: collapsed ? 0 : contentHeight ?? 500 }}
      >
        <div className="px-4 pb-4 space-y-3 text-sm">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Overview</div>
            <p className="text-foreground leading-relaxed">{brief.overview}</p>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Open with</div>
            <p className="text-foreground leading-relaxed">{brief.audienceHook}</p>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Your power moment</div>
            <p className="text-foreground leading-relaxed">{brief.coreMoment}</p>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Close with</div>
            <p className="text-foreground leading-relaxed">{brief.closingGuide}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
