# Unpack — Week 5 Pitch

## What I'm Building

I'm finishing a presentation-building chatbot I started in Week 2 called **Unpack**. The app guides users through an adaptive interview — drawing out their ideas, pushing back on vague thinking, and structuring everything into a presentation — rather than the "paste a prompt, get slides" approach every other tool uses.

Market research across 15+ tools (Gamma, Manus, Beautiful.ai, Copilot, PitchBob, etc.) confirms no tool does deep conversational discovery before generating content. The closest competitor (PitchBob) uses hard-coded questions and has 2.4/5 stars on Trustpilot. Unpack's differentiator is the quality of the conversation itself — it asks questions users wouldn't think to ask themselves.

The app currently works (interview → structure → content output) but it's a prototype: no auth, no streaming, generic system prompt, and a basic chat UI that looks like every other chatbot.

## Definition of "Finished"

**Priority 1 — Make the interview actually good (the product IS the conversation)**
- Overhauled system prompt with adaptive probing (pushes back on vague answers), "so what?" checks after each key point, software engineer domain logic (demo vs. sprint review vs. conference talk vs. portfolio showcase), technical depth calibration, and quality scoring of the generated outline
- This is what separates Unpack from "paste this prompt into ChatGPT"

**Priority 2 — Infrastructure (table stakes for anyone to use it)**
- Deployed at a live URL anyone can visit
- Google OAuth so each user's conversations are private
- Anthropic Haiku 4.5 with prompt caching (90% savings on system prompt)
- Streaming responses (currently users stare at nothing for 10+ seconds)
- Error handling + loading states

**Priority 3 — Validation (prove it works)**
- User tested with real people (software engineers presenting their work)
- At least one round of iteration on the system prompt based on real feedback
- Model evaluation — assess Haiku 4.5 output quality, adjust if needed

**Priority 4 — UI transformation (make it feel like a presentation tool)**
- Structured output from LLM (phase tracking, typed responses)
- Progress stepper (Context → Brainstorm → Build → Polish)
- Card-based messages (question cards, checklist cards, slide cards, tip cards)
- Slide preview panel in the build phase

## Gaps Between "Working" and "Done"

| Gap | Current State | "Done" State |
|-----|--------------|-------------|
| Interview quality | Generic questions anyone could replicate with ChatGPT | Adaptive, domain-specific, opinionated — pushes back, probes deeper, scores quality |
| Usability | Runs locally, no auth, my API key pays for everything | Deployed, auth'd, prompt caching for cost optimization, streaming responses |
| Validation | Only I've used it | Real users have tested it, feedback incorporated |
| UX feel | Plain chat bubbles, no feedback while AI thinks, fixed sidebar | Progress stepper, typed cards, slide preview panel, streaming |

## Tech Stack
- **Frontend:** React 19 + Vite + Tailwind CSS 4 + shadcn/ui + TypeScript
- **Backend:** Express 5 + Anthropic Claude Haiku 4.5 + Supabase (Drizzle ORM)
- **Auth:** Supabase Auth (Google OAuth)
- **Deployment:** TBD (Railway / Render / Vercel)

## What Makes This Novel
Research confirmed the market splits into two buckets that don't overlap:
1. **Delivery coaching apps** (Yoodli, Orai, Poised) — help you practice speaking, assume your deck exists
2. **Slide generation tools** (Gamma, Manus, Canva) — assume you know what to say, make it pretty

Nobody bridges the gap: helping users figure out WHAT to present through deep conversation, THEN building the content. Unpack lives in that gap. The niche focus on software engineers presenting their work (demos, sprint reviews, conference talks, portfolio showcases) makes the domain logic specific and defensible.
