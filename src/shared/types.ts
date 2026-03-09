import { UUID } from "crypto"

// --- Slide Types ---

export interface TitleSlide {
    slideId: string
    type: "title"
    heading: string
    subtitle?: string
    author?: string
    date?: string
}

export interface ContentSlide {
    slideId: string
    type: "content"
    heading: string
    bullets: string[]
}

export interface CodeSlide {
    slideId: string
    type: "code"
    heading: string
    code: string
    language: string
    caption?: string
}

export interface MetricsSlide {
    slideId: string
    type: "metrics"
    heading?: string
    stats: { number: string; label: string }[]
}

export interface ClosingSlide {
    slideId: string
    type: "closing"
    heading: string
    links?: string[]
    cta?: string
}

export type SlideData = TitleSlide | ContentSlide | CodeSlide | MetricsSlide | ClosingSlide

export type SlideType = SlideData["type"]

export type Phase = "context" | "brainstorm" | "structure" | "refine"

export type MessageType = "question" | "checklist" | "tip" | "summary" | "slide_content"

export interface DeliveryBrief {
    overview: string
    audienceHook: string
    coreMoment: string
    closingGuide: string
}

export interface MessageMetadata {
    phase: Phase
    messageType: MessageType
    suggestions: string[]
    slides?: SlideData[]
    qualityScore?: number
    deliveryBrief?: DeliveryBrief
}

// --- Message & Conversation ---

export interface Message {
    role: "user" | "assistant"
    content: string
    metadata?: MessageMetadata | null
}

export interface Conversation {
    id: string
    messages: Message[]
    title: string
}
