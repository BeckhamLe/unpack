# Unpack — Implementation Plan

**Status:** APPROVED
**Created:** 2026-03-02
**Goal:** Finish and ship the Unpack presentation chatbot — adaptive interview → structured presentation content

---

## Context

Unpack is a presentation-building chatbot (started Week 2) that guides users through a conversational interview to build their presentation. Market research (see `presentation-builder-research.md`) confirmed no tool does deep conversational discovery before generating content. The closest competitor (PitchBob) uses hard-coded questions with 2.4/5 stars.

**Current state:** Working prototype — interview → structure → content output. No auth, no streaming, generic system prompt, basic chat UI.

**What "finished" means:** Deployed, auth'd, streaming, adaptive interview, user-tested, polished UI.

---

## Priority Order (Agreed)

1. **System prompt overhaul** — the product IS the conversation
2. **Infrastructure** — table stakes for anyone to use it (Gemini, auth, streaming, error handling)
3. **Validation** — user testing, prompt iteration, model evaluation
4. **UI transformation** — structured output, stepper, cards, slide preview

---

## Plan Overview

```
| # | Task                                          | Priority | Depends On | Skills                          | Steps |
|---|-----------------------------------------------|----------|------------|---------------------------------|-------|
| 1 | Switch to Gemini API                          | critical | —          | API design                      | 3     |
| 2 | Add Google OAuth via Supabase                 | critical | —          | Security, State mgmt, DB        | 5     |
| 3 | Add streaming responses                       | high     | 1          | SSE, State mgmt, API design     | 4     |
| 4 | UI polish (errors, loading, sidebar)           | high     | 2          | Error handling, React            | 3     |
| 5 | System prompt overhaul                         | critical | 1          | Domain design, Prompt eng        | 4     |
| 6 | Deploy                                        | critical | 1,2,3,4    | Deployment, CI/CD                | 4     |
| 7 | User testing + prompt iteration               | high     | 5,6        | Evaluation, Scope mgmt          | 3     |
| 8 | Structured output from LLM                    | medium   | 5          | API design, Data modeling        | 4     |
| 9 | UI transformation (stepper, cards, preview)   | medium   | 8          | React, State mgmt               | 5     |
```

**Parallelism:** Tasks 1 + 2 can run simultaneously. Task 5 can start as soon as 1 is done (parallel with 3, 4).

---

## Timeline

| Day | Tasks | Focus |
|-----|-------|-------|
| Monday | 1, 2, 3, 4, start 5 | Infrastructure + begin prompt |
| Tuesday | Finish 5, 6 | Prompt + deploy |
| Wednesday | 7 | User testing + iteration |
| Thursday | 8, 9 | Structured output + UI transformation |
| Friday | Buffer / polish | Edge cases, final testing |

---

## TASK-001: Switch to Gemini API
**Priority:** critical | **Blocked by:** — | **Est:** 1.5 hrs

**Why:** Anthropic API key = Beckham pays for every user message. Gemini free tier = $0 cost.

| Step | What | Files | Strategy |
|------|------|-------|----------|
| 1 | Swap deps: uninstall `@anthropic-ai/sdk`, install `@google/generative-ai`. Update `.env`. | package.json, .env | inline |
| 2 | Rewrite Anthropic API call in main.ts to Gemini `generateContent()`. Map message format (`{role, content}[]` → `{role, parts}[]`). Keep system prompt as `systemInstruction`. | src/server/main.ts | sub-agent |
| 3 | Smoke test: send message, get response, verify DB persistence. | — | inline |

**Acceptance criteria:**
- App uses Gemini API, no Anthropic references remain
- `.env` has `GOOGLE_API_KEY`, no `ANTHROPIC_API_KEY`
- Chat flow works end-to-end
- System prompt behavior preserved

---

## TASK-002: Add Google OAuth via Supabase
**Priority:** critical | **Blocked by:** — | **Est:** 2.5-3 hrs

> **Shaky skills: Security, State mgmt** — extra detail provided.

**Prereq (Beckham manual):** Enable Google OAuth in Supabase dashboard. Configure Google Cloud Console. Add redirect URI.

| Step | What | Files | Strategy |
|------|------|-------|----------|
| 1 | Install `@supabase/supabase-js`. Add env vars. | package.json, .env | inline |
| 2 | Schema: add `userId` (text, nullable) to conversations. Create Supabase client singleton. | src/server/schema.ts, src/client/lib/supabase.ts | sub-agent |
| 3 | Login component + auth state in App.tsx. Spinner during auth check. **Gotcha:** HashRouter + OAuth callback conflict — may need param extraction in main.tsx before HashRouter mounts. | src/client/components/Login.tsx, src/client/App.tsx, src/client/main.tsx | sub-agent |
| 4 | Backend JWT middleware via `jose` + Supabase JWKS. Verify JWT, extract user_id, filter conversations by user. | src/server/middleware/auth.ts, src/server/main.ts | sub-agent |
| 5 | Frontend `authFetch` wrapper: inject Bearer token, 401 → refresh → retry once → redirect to login. Replace all fetch calls. | src/client/services/requests.ts, src/client/App.tsx | sub-agent |

**Acceptance criteria:**
- Login/logout with Google works
- No login flash (spinner during auth check)
- Unauthenticated requests get 401
- Each user only sees their own conversations
- Token refresh works transparently

---

## TASK-003: Add Streaming Responses
**Priority:** high | **Blocked by:** TASK-001 | **Est:** 2-2.5 hrs

> **Shaky: State mgmt** — streaming changes how messages arrive. Key pattern: add empty assistant message immediately, stream chunks into it, save to DB after stream completes.

| Step | What | Files | Strategy |
|------|------|-------|----------|
| 1 | Research Gemini streaming API format (`generateContentStream()`). | — | inline |
| 2 | Backend: new SSE endpoint `POST /chat/stream`. Stream chunks as SSE events. Save to DB on complete. Keep old `/chat` as fallback. | src/server/main.ts | sub-agent |
| 3 | Frontend: `streamMessage()` function using fetch + ReadableStream. Process SSE chunks with `onChunk` callback. | src/client/services/requests.ts | sub-agent |
| 4 | Frontend: streaming state in App.tsx. Append empty message, update on chunks, finalize on done. Disable send during streaming. Auto-scroll. | src/client/App.tsx | sub-agent |

**Acceptance criteria:**
- Messages appear word-by-word
- Send button disabled during streaming
- Auto-scroll follows text
- Message saved to DB after stream completes
- Old `/chat` endpoint still works

---

## TASK-004: UI Polish (Error Handling, Loading, Collapsible Sidebar)
**Priority:** high | **Blocked by:** TASK-002 | **Est:** 1.5 hrs

> **Shaky: Error handling** — keep it simple: toast for API errors, spinner for loading, banner for connection loss.

| Step | What | Files | Strategy |
|------|------|-------|----------|
| 1 | Install `sonner` toast library. Add Toaster provider. | package.json, src/client/App.tsx | inline |
| 2 | Try/catch on all fetches. Toast on errors. Loading spinner while AI responds. Connection-lost banner on network failure. 401 → redirect to login. | src/client/services/requests.ts, src/client/App.tsx | sub-agent |
| 3 | Collapsible sidebar: hamburger menu, overlay with transition, click-outside-to-close. | src/client/App.tsx, src/client/App.css | sub-agent |

**Acceptance criteria:**
- API errors show toast (auto-dismiss 5s)
- Network failure shows persistent banner
- Loading spinner while AI responds
- Sidebar collapses to hamburger, opens as overlay

---

## TASK-005: System Prompt Overhaul
**Priority:** critical | **Blocked by:** TASK-001 | **Est:** 4-5 hrs

**Why:** Research confirmed this IS the product. Current prompt is generic enough to replicate with ChatGPT.

| Step | What | Files | Strategy |
|------|------|-------|----------|
| 1 | Adaptive probing: define "vague" criteria, pushback templates, "so what?" checks. | src/server/main.ts | inline |
| 2 | Software engineer domain logic: presentation type detection (demo/sprint review/conference talk/portfolio/pitch), audience calibration, impact framing, decision/tradeoff surfacing. | src/server/main.ts | inline |
| 3 | Strengthen Phase 1 (Brainstorm): component evaluation rubric, "cut ruthlessly" mechanism. Strengthen Phase 3 (Refine): transitions, opening hooks, Q&A, pacing. Operationalize "presentation is an ad for the presenter." | src/server/main.ts | inline |
| 4 | Quality scoring: rate sections on clarity/impact/relevance. Flag weakest section. Give readiness score. Test with sample conversations. | src/server/main.ts | sub-agent |

**Acceptance criteria:**
- Pushes back on vague answers
- Presentation type detection works
- "So what?" check fires after key points
- Quality scoring after outline generation
- Each phase has specific, opinionated guidance

---

## TASK-006: Deploy
**Priority:** critical | **Blocked by:** TASK-001, 002, 003, 004 | **Est:** 1.5 hrs

> **Shaky: Deployment** — first deployment, extra detail on every step.

| Step | What | Files | Strategy |
|------|------|-------|----------|
| 1 | Configure production build: `vite build` → `dist/`, Express serves static files. Verify `build` and `start` scripts. Test locally. | src/server/main.ts, package.json | inline |
| 2 | Set up Railway (or Render). Create account, link repo. | — | inline |
| 3 | Set env vars on platform: `GOOGLE_API_KEY`, `DATABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NODE_ENV=production`. Configure build/start commands. | — | sub-agent |
| 4 | Smoke test: OAuth login, streaming, DB persistence. Add deployed URL to Google OAuth origins + Supabase redirects. | — | sub-agent |

**Acceptance criteria:**
- App accessible at public URL
- OAuth works on deployed version
- Streaming works
- Conversations persist in DB
- No API keys exposed to client

---

## TASK-007: User Testing + Prompt Iteration
**Priority:** high | **Blocked by:** TASK-005, 006 | **Est:** varies

| Step | What | Files | Strategy |
|------|------|-------|----------|
| 1 | Share URL with 2-3 software engineers. Ask them to build a presentation for their work. | — | inline |
| 2 | Analyze feedback: friction points, missing questions, quality of output. | — | inline |
| 3 | Iterate on prompt. Evaluate Gemini quality. Document findings. | src/server/main.ts | inline |

**Acceptance criteria:**
- At least 2 real users tested
- Feedback documented
- At least one prompt iteration based on feedback
- Gemini quality decision documented

---

## TASK-008: Structured Output from LLM
**Priority:** medium | **Blocked by:** TASK-005 | **Est:** 3-4 hrs

| Step | What | Files | Strategy |
|------|------|-------|----------|
| 1 | Design structured response schema: `phase`, `messageType`, `message`, `slides[]`, `qualityScore`. | — | inline |
| 2 | Backend: Gemini function calling. Parse function call response. Handle text fallback. | src/server/main.ts | sub-agent |
| 3 | Extend Message type + DB schema. Add `metadata` JSON column. Update storage layer. | src/shared/types.ts, src/server/schema.ts, src/server/main.ts, src/server/storage.ts | sub-agent |
| 4 | Frontend: ensure metadata flows through to rendering layer. Verify availability in message objects. | src/client/services/requests.ts, src/client/App.tsx | sub-agent |

**Acceptance criteria:**
- Gemini responds with structured data
- Metadata stored in DB
- Frontend receives metadata
- Fallback handles non-structured responses
- Backward compat with existing conversations

---

## TASK-009: UI Transformation (Stepper, Cards, Slide Preview)
**Priority:** medium | **Blocked by:** TASK-008 | **Est:** 4-5 hrs

| Step | What | Files | Strategy |
|------|------|-------|----------|
| 1 | Extract message rendering into `MessageList.tsx`. | src/client/components/MessageList.tsx, src/client/App.tsx | inline |
| 2 | Progress stepper: Context → Brainstorm → Build → Polish. Driven by `metadata.phase`. | src/client/components/ProgressStepper.tsx, src/client/App.tsx | sub-agent |
| 3 | Card-based messages: QuestionCard, ChecklistCard, SlideCard, TipCard. Driven by `metadata.messageType`. Plain text fallback. | src/client/components/cards/*.tsx, src/client/components/MessageList.tsx | sub-agent |
| 4 | Slide preview panel: split-pane in build/refine phases (chat 40% / preview 60%). Full-width in context/brainstorm. | src/client/components/SlidePreview.tsx, src/client/App.tsx, src/client/App.css | sub-agent |
| 5 | Integration test: full flow through all phases. Verify responsive. | src/client/App.tsx | sub-agent |

**Acceptance criteria:**
- Stepper shows current phase
- Different card types render by message type
- Slide preview appears in build/refine phases
- Chat full-width in context/brainstorm
- Plain text fallback for old messages
- Mobile responsive

---

## Key Decisions Made

| Decision | Context | Date |
|----------|---------|------|
| Name: Unpack | Captures the "draw out your ideas" differentiator | 2026-03-02 |
| Gemini over Anthropic | Free tier, $0 cost exposure for shared app | 2026-03-02 |
| Software engineer niche | Specific, defensible, Beckham IS one | 2026-03-02 |
| Receipt splitter rejected for week 5 | Layer 2 (auth+groups+OCR) too ambitious for "finishing" assignment | 2026-03-02 |
| Validation before UI transformation | Prove the interview works before making it pretty | 2026-03-02 |

---

## Key References

- **Competitive research:** `presentation-builder-research.md`
- **Pitch:** `unpack-pitch.md`
- **UI redesign plan (from Week 2):** Incorporated into TASK-008 and TASK-009
- **Original chatbot source:** Copied from `week2/fractal_chatbot/vite-express-project/`
- **Knowledge tracker:** Shows Deployment, Security, Error handling, State mgmt are Shaky — those tasks have extra detail
