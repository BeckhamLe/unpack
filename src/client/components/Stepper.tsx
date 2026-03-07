import { Phase } from '../../shared/types'

interface StepperProps {
  currentPhase: Phase
}

const PHASES: { key: Phase; label: string }[] = [
  { key: "context", label: "Context" },
  { key: "brainstorm", label: "Brainstorm" },
  { key: "structure", label: "Structure" },
  { key: "refine", label: "Refine" },
]

export default function Stepper({ currentPhase }: StepperProps) {
  const currentIdx = PHASES.findIndex(p => p.key === currentPhase)

  return (
    <div className="px-4 py-2.5 border-b border-border flex-shrink-0">
      <div className="max-w-2xl mx-auto flex items-center gap-1">
        {PHASES.map((phase, i) => {
          const isActive = i === currentIdx
          const isComplete = i < currentIdx
          const isFuture = i > currentIdx

          return (
            <div key={phase.key} className="flex items-center flex-1">
              {/* Dot + label */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                  isActive ? 'bg-primary' :
                  isComplete ? 'bg-primary/60' :
                  'bg-muted-foreground/30'
                }`} />
                <span className={`text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'text-primary' :
                  isComplete ? 'text-foreground/70' :
                  'text-muted-foreground/50'
                }`}>
                  {phase.label}
                </span>
              </div>

              {/* Connector line */}
              {i < PHASES.length - 1 && (
                <div className={`flex-1 h-px mx-2 transition-colors ${
                  isComplete ? 'bg-primary/40' :
                  isFuture ? 'bg-muted-foreground/20' :
                  'bg-primary/30'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
