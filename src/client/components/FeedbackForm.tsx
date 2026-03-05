import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface FeedbackFormProps {
  type: 'session' | 'manual'
  onSubmit: (data: { workingWell?: string; notWorking?: string; wouldImprove?: string; type: 'session' | 'manual' }) => void
  onClose: () => void
}

export default function FeedbackForm({ type, onSubmit, onClose }: FeedbackFormProps) {
  const [workingWell, setWorkingWell] = useState('')
  const [notWorking, setNotWorking] = useState('')
  const [wouldImprove, setWouldImprove] = useState('')

  const handleSubmit = () => {
    onSubmit({
      workingWell: workingWell || undefined,
      notWorking: notWorking || undefined,
      wouldImprove: wouldImprove || undefined,
      type,
    })
  }

  return (
    <div className="space-y-3">
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
