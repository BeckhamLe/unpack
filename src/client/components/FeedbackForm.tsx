import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface FeedbackFormProps {
  type: 'session' | 'manual'
  showThumbs?: boolean
  onSubmit: (data: { workingWell?: string; notWorking?: string; wouldImprove?: string; rating?: number; type: 'session' | 'manual' }) => void
  onClose: () => void
}

export default function FeedbackForm({ type, showThumbs, onSubmit, onClose }: FeedbackFormProps) {
  const [workingWell, setWorkingWell] = useState('')
  const [notWorking, setNotWorking] = useState('')
  const [wouldImprove, setWouldImprove] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)

  const handleSubmit = () => {
    onSubmit({
      workingWell: workingWell || undefined,
      notWorking: notWorking || undefined,
      wouldImprove: wouldImprove || undefined,
      rating,
      type,
    })
  }

  return (
    <div className="space-y-3">
      {showThumbs && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Overall:</span>
          <button
            onClick={() => setRating(rating === 1 ? undefined : 1)}
            className={`p-1.5 rounded-md transition-colors ${rating === 1 ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'}`}
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => setRating(rating === -1 ? undefined : -1)}
            className={`p-1.5 rounded-md transition-colors ${rating === -1 ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'}`}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      )}
      <div>
        <label className="text-xs text-muted-foreground">What's working well?</label>
        <Textarea
          className="mt-1 min-h-[40px] max-h-[80px] resize-none text-sm"
          placeholder="e.g. The probing questions help me think deeper..."
          value={workingWell}
          onChange={e => setWorkingWell(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">What's not working?</label>
        <Textarea
          className="mt-1 min-h-[40px] max-h-[80px] resize-none text-sm"
          placeholder="e.g. Responses are too long sometimes..."
          value={notWorking}
          onChange={e => setNotWorking(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">What would you improve?</label>
        <Textarea
          className="mt-1 min-h-[40px] max-h-[80px] resize-none text-sm"
          placeholder="e.g. I wish it could generate actual slides..."
          value={wouldImprove}
          onChange={e => setWouldImprove(e.target.value)}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  )
}
