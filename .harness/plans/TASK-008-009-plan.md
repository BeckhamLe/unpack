# TASK-008 + TASK-009 Execution Plan

**Status:** APPROVED by Beckham (2026-03-07 session)
**Reference:** Agents executing these tasks should read this file for full context.

## Design Decisions (Locked)

- **Model:** Upgrade from Haiku 4.5 to Sonnet 4.6 (`claude-sonnet-4-6-20250514`) for reliable tool use
- **Slide format:** Model outputs structured JSON (typed slide objects), NOT raw HTML. A frontend render function maps JSON to HTML using the CSS design system.
- **5 layouts v1:** Title, Content, Code, Metrics, Closing. (Two-Column, Section Divider, Quote deferred to v2.)
- **Theming:** 2 themes (light default, dark) x 4 accent colors (blue default, violet, teal, orange). Model is unaware of theme — it outputs semantic JSON. Theme is a CSS class swap.
- **Export v1:** Client-side HTML export only (self-contained file with inline CSS + nav JS). PDF export deferred to TASK-016.
- **Layout swapping:** Users can swap slide layouts in the preview. Content-based layouts swap freely. Code/Metrics prompt user for missing fields.
- **Light theme default:** Optimized for projectors. Dark as option for monitors/TVs.
- **Customization is 100% client-side** after model generates JSON. No server calls during slide editing/theming/export.

## Key Codebase References

| File | What's There | Key Lines |
|------|-------------|-----------|
| `src/server/main.ts` | Anthropic call, streaming, system prompt, storage class | Model: L286, max_tokens: L288, stream handlers: L297-319, system prompt: L19-120, storage: L126-233 |
| `src/shared/types.ts` | Message, Conversation interfaces | Entire file (~10 lines) |
| `src/server/schema.ts` | DB schema (messages, conversations, feedback) | Messages table: L23-38 |
| `src/client/App.tsx` | Main component, message rendering, streaming state | Message loop: L310-336, createMessage: L116-156, streaming: L22 |
| `src/client/services/requests.ts` | streamMsg() SSE parser | L64-114 |
| `src/client/App.css` | Tailwind theme, message styling | Theme tokens: L7-46, message styles: L93-108 |
| `src/client/components/` | Login, FeedbackForm, ui/ primitives | No markdown, no slides, no stepper |

---

## TASK-008: Structured Output + Prompt Tuning

### Step 1 — Design JSON schema + Anthropic tool definition
**What:** Define the `presentation_metadata` tool that the model calls alongside its text response. This schema drives everything else.

**Tool definition:**
```
name: "presentation_metadata"
description: "Provide structured metadata alongside your conversational response"
input_schema:
  phase: enum ["context", "brainstorm", "structure", "refine"]
  messageType: enum ["question", "checklist", "tip", "summary", "slide_content"]
  suggestions: array of 2-3 strings (quick-reply options for user)
  slides: array of SlideData objects (full deck, only in structure/refine)
  qualityScore: number 1-10 (optional, after outline)
```

**SlideData union (5 types):**
```
TitleSlide:    { slideId, type: "title", heading, subtitle?, author?, date? }
ContentSlide:  { slideId, type: "content", heading, bullets: string[] }
CodeSlide:     { slideId, type: "code", heading, code, language, caption? }
MetricsSlide:  { slideId, type: "metrics", heading?, stats: {number, label}[] }
ClosingSlide:  { slideId, type: "closing", heading, links?: string[], cta? }
```

**Files:** `src/shared/types.ts` (add all type definitions)

### PARALLEL BLOCK A (steps 2, 3, 4 — run simultaneously after step 1)

### Step 2 — Model upgrade + API config
**What:** Switch model, bump max_tokens, add tool definition to API call.
**Files:** `src/server/main.ts` (lines 285-290)
**Changes:**
- Model: `claude-haiku-4-5-20251001` -> `claude-sonnet-4-6-20250514`
- max_tokens: `2048` -> `4096`
- Add `tools: [presentationMetadataTool]` to the API call
- Add `tool_choice: { type: "auto" }`

### Step 3 — DB migration + schema + storage
**What:** Add metadata column, update storage methods to save/load it.
**Files:** `src/server/schema.ts`, `src/server/main.ts` (storage class L126-233)
**Changes:**
- schema.ts: Add `metadata: jsonb("metadata")` nullable column to messages table
- `addMessageToConversation()`: Accept optional `metadata` param, include in INSERT
- `getConversation()` message mapping (L180): Include `metadata` field, parse from jsonb
- Run migration: add column to existing table in Supabase

### Step 4 — System prompt rewrite
**What:** Rewrite the entire SYSTEM_PROMPT for collaborative tone + tool-use instructions + slide layout docs.
**Files:** `src/server/main.ts` (lines 19-120)
**Changes:**
- Collaborative tone (not interrogative), fewer questions per phase (3-4 exchanges, not 8-10)
- Loosen rigid problem/solution framing
- Keep strengths: audience questions, concrete examples, focus on important things
- Add tool-use instructions: "Always produce text first, then call presentation_metadata tool"
- Add 5 slide layout descriptions with content field constraints (max 5 bullets, max 15 lines code, etc.)
- Add slideId stability instruction: "Output unchanged slides exactly as previous response"
- Phase pacing: "Move to brainstorm when you understand audience + topic + goals"
- Estimated addition: ~2,600 tokens for layout docs (cacheable via prompt caching)

### END PARALLEL BLOCK A

### Step 5 — Storage layer updates (depends on step 3)
**What:** Wire metadata through save/load path.
**Files:** `src/server/main.ts` (storage class)
**Changes:**
- User messages: always null metadata
- Assistant messages: parsed metadata from tool_use or null
- getConversation returns Message objects with optional metadata field

### Step 6 — Dual-mode streaming (depends on steps 2, 3)
**What:** Rework stream handler to capture both text and tool_use data.
**Files:** `src/server/main.ts` (lines 285-320)
**Changes:**
- Keep `stream.on('text')` -> SSE `{ type: "chunk", text }` (unchanged)
- Add: accumulate `inputJson` events into `metadataJson` string (silent)
- On `stream.on('end')`:
  - If tool_use: parse `metadataJson`, save text + metadata to DB
  - Send `{ type: "metadata", data: parsedMetadata }` SSE event
  - Then send `{ type: "done", conversation }` SSE event
  - If no tool_use: save text only with null metadata (fallback)
- On `stream.on('error')`: save fallback text + null metadata (existing behavior)

### Step 7 — Conversation history optimization (depends on step 6)
**What:** Prevent context bloat from duplicate slide decks.
**Files:** `src/server/main.ts` (sanitizeMessages L240-250)
**Changes:**
- Strip metadata from all messages before sending to Anthropic (metadata stored in DB, not needed in LLM context)
- Only include latest slides as a context note, not every historical copy

### PARALLEL BLOCK B (steps 8, 9 — run simultaneously)

### Step 8 — SSE parser update (depends on step 6)
**What:** Frontend handles new metadata event.
**Files:** `src/client/services/requests.ts` (L96-112), `src/client/App.tsx`
**Changes:**
- Add `onMetadata` callback parameter to `streamMsg()`
- Handle `type: "metadata"` in SSE event dispatch
- App.tsx: pass `onMetadata` callback that stores metadata on latest assistant message

### Step 9 — Error handling + fallback (depends on step 6)
**What:** Graceful handling of truncation, invalid JSON, non-tool-use responses.
**Files:** `src/server/main.ts`
**Changes:**
- Wrap `JSON.parse(metadataJson)` in try/catch — on failure, null metadata
- Check `stop_reason === "max_tokens"`: send `{ type: "warning" }` SSE event
- Backward compat: old conversations with null metadata load without errors

### END PARALLEL BLOCK B

---

## TASK-009: UI Transformation + Slide Design System

### PARALLEL BLOCK A (steps 1, 2, 3 — fully independent)

### Step 1 — Install dependencies
**What:** Add markdown + sanitization libraries.
**Command:** `bun add react-markdown dompurify @types/dompurify`

### Step 2 — CSS design system
**What:** Create the complete slide styling system.
**Files:** `src/client/styles/slides.css` (NEW)
**Deliverables:**
- 5 layout classes: `.slide-title`, `.slide-content`, `.slide-code`, `.slide-metrics`, `.slide-closing`
- Design tokens: `--bg`, `--text-primary`, `--text-secondary`, `--accent`, `--border`, `--code-bg`, spacing scale, type scale with `clamp()` for responsive
- 2 themes: `.theme-light` (default, projector-optimized), `.theme-dark`
- 4 accents: `.accent-blue` (default), `.accent-violet`, `.accent-teal`, `.accent-orange` — all pass WCAG AA contrast on both themes
- 16:9 aspect ratio lock, overflow hidden, centered
- Slide transitions: opacity fade 200ms
- Font imports: Inter (text), Fira Code (code)
- Code blocks: always dark background regardless of theme
- Syntax token classes: `.token-keyword`, `.token-string`, `.token-comment`, etc.

### Step 3 — Extract MessageList component
**What:** Pull message rendering out of App.tsx.
**Files:** `src/client/components/MessageList.tsx` (NEW), `src/client/App.tsx`
**Changes:**
- Extract L310-336 from App.tsx into MessageList component
- Props: messages, isStreaming, latestMetadata
- App.tsx renders `<MessageList>` in place of inline .map()

### END PARALLEL BLOCK A

### PARALLEL BLOCK B (steps 4, 5, 6, 7 — mostly independent)

### Step 4 — Markdown rendering (depends on 1, 3)
**What:** Replace plain text with formatted markdown.
**Files:** `src/client/components/MarkdownMessage.tsx` (NEW)
**Changes:**
- Wrap react-markdown with Tailwind prose styling (headings, bullets, bold, code)
- Replace `whitespace-pre-wrap` plain text in MessageList
- Style inline code and code blocks to match app theme

### Step 5 — Slide render function (depends on 2)
**What:** Map typed slide JSON to HTML using CSS design system.
**Files:** `src/client/components/SlideRenderer.tsx` (NEW)
**Changes:**
- Takes `slides: SlideData[]`, `theme`, `accent` props
- Maps each slide type to corresponding CSS layout template
- Sanitize rendered HTML with DOMPurify (allowlisted tags/classes only)
- Renders scrollable slide preview (all slides visible, not presentation mode)

### Step 6 — Suggestion buttons (depends on 3)
**What:** Clickable quick-reply chips.
**Files:** `src/client/components/SuggestionButtons.tsx` (NEW)
**Changes:**
- Props: suggestions[], onSelect(text), disabled
- 2-3 styled pills/chips with Tailwind
- Only shown on latest assistant message
- Hidden when isStreaming
- onSelect calls createMessage(suggestionText)

### Step 7 — Progress stepper (independent component)
**What:** 4-phase visual progress indicator.
**Files:** `src/client/components/Stepper.tsx` (NEW)
**Changes:**
- 4 phases: Context > Brainstorm > Structure > Refine
- Props: currentPhase
- Forward-only: current + previous phases highlighted, upcoming muted
- Horizontal bar with labeled dots, accent color for active
- Placed above message area in App.tsx
- Defaults to "context" when metadata null

### END PARALLEL BLOCK B

### PARALLEL BLOCK C (steps 8, 9)

### Step 8 — Split-pane layout + slide preview (depends on 5, 7)
**What:** Chat left, slide preview right in structure/refine.
**Files:** `src/client/components/SlidePreview.tsx` (NEW), `src/client/App.tsx`
**Changes:**
- SlidePreview wraps SlideRenderer + ThemePicker + ExportButton
- App.tsx layout: flexbox chat (45%) + preview (55%)
- Context/brainstorm: full-width chat, preview hidden with placeholder text
- Structure/refine: animated split (CSS width transition 300ms)
- Preview shows latest slides[] from metadata (most recent deck)
- "Changed" badge on slides that differ from previous (diff by slideId)

### Step 9 — Theme/accent picker (depends on 2)
**What:** Theme + color selector in preview panel.
**Files:** `src/client/components/ThemePicker.tsx` (NEW)
**Changes:**
- Theme toggle: light/dark
- Accent swatches: 4 colored circles (blue, violet, teal, orange)
- State in React state + localStorage for persistence
- Swaps CSS class on slide container — instant re-render
- Passes selected theme/accent to SlideRenderer and export

### END PARALLEL BLOCK C

### Step 10 — Layout swap UI (depends on 5)
**What:** Per-slide layout type changer.
**Files:** `src/client/components/LayoutSwapper.tsx` (NEW)
**Changes:**
- Dropdown/button per slide showing available layouts
- Content <-> free text swap (auto-redistribute content)
- Swap TO Code: modal with code textarea + language dropdown
- Swap TO Metrics: modal with 2-4 number + label input pairs
- Updates slide type in local state — re-renders instantly
- No LLM call needed

### Step 11 — HTML export (depends on 5, 2)
**What:** Client-side downloadable presentation file.
**Files:** `src/client/lib/slideExport.ts` (NEW), `src/client/components/ExportButton.tsx` (NEW)
**Changes:**
- slideExport.ts: takes slides[], theme, accent, CSS string. Builds complete HTML doc with inlined style + nav JS (~60 lines: arrow keys, fullscreen, slide counter) + slide sections. Returns Blob.
- ExportButton: "Download slides" in preview panel. Enabled when slides.length > 0. Triggers download of `unpack-presentation.html`.
- Fully client-side, no server call.

### Step 12 — Session reconstruction (depends on TASK-008 storage)
**What:** Restore UI state on conversation reload.
**Files:** `src/client/lib/sessionReconstruct.ts` (NEW)
**Changes:**
- Input: Message[] with metadata
- Output: { currentPhase, latestSlides, latestSuggestions }
- Scans all messages for highest phase (forward-only), last slides, last suggestions
- Called on conversation load (clickConvo, initial load)

### Step 13 — Backward compat + error states + mobile (final pass)
**What:** Polish, safety, responsive.
**Changes:**
- Null metadata messages: plain markdown, no suggestions, stepper defaults "context"
- DOMPurify on all slide HTML with strict allowlist
- Handle: empty slides, missing fields, malformed metadata
- Mobile (<768px): stepper compact, preview becomes tab (Chat | Slides toggle)
