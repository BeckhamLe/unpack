import { Message, Phase, SlideData } from '../../shared/types'

interface SessionState {
  currentPhase: Phase
  latestSlides: SlideData[]
  latestSuggestions: string[]
}

const PHASE_ORDER: Phase[] = ["context", "brainstorm", "structure", "refine"]

export function reconstructSession(messages: Message[]): SessionState {
  let highestPhaseIdx = 0
  let latestSlides: SlideData[] = []
  let latestSuggestions: string[] = []

  for (const msg of messages) {
    if (!msg.metadata) continue

    const phaseIdx = PHASE_ORDER.indexOf(msg.metadata.phase)
    if (phaseIdx > highestPhaseIdx) {
      highestPhaseIdx = phaseIdx
    }

    if (msg.metadata.slides?.length) {
      latestSlides = msg.metadata.slides
    }

    if (msg.metadata.suggestions?.length) {
      latestSuggestions = msg.metadata.suggestions
    }
  }

  return {
    currentPhase: PHASE_ORDER[highestPhaseIdx],
    latestSlides,
    latestSuggestions,
  }
}
