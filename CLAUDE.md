# Week 5 — Unpack: Presentation Chatbot

## Current State

**EXECUTING.** Per-task branching strategy. On `main`, clean state. Remote: `https://github.com/BeckhamLe/unpack`

**Done:** TASK-001 through TASK-015, TASK-006 archived (replaced by TASK-011–014). TASK-018 (slide CSS polish) is in PR #11 — awaiting merge.

**In progress:** TASK-018 (slide CSS design system polish) — PR #11 open, branch `task/018-slide-css-polish`. Adds decorative geometric elements, polished typography, accent treatments to all 5 slide types. Also synced the export template (`src/client/lib/slideExport.ts`) with the polished CSS. Beckham needs to review and merge.

**Stage:** Preparing to ship publicly — posting on X and social media to acquire real users. The bar is "presentable and confidence-inspiring," not "demo/v1." Every feature should feel complete enough that a stranger would use it.

**Deployed:** https://unpack.pro (EC2 + nginx + PM2, Supabase DB via connection pooler)

## What's Being Built

Unpack — an AI presentation coach that interviews users to build their presentations. Differentiator: deep conversational discovery (adaptive probing, pushback on vague thinking, domain-specific guidance for software engineers) vs every other tool's "paste prompt, get slides" approach.

## Key References

- **Implementation plan**: `PLAN.md` (APPROVED)
- **Pitch**: `unpack-pitch.md`
- **Competitive research**: `presentation-builder-research.md`
- **Execution plan**: `.harness/plans/TASK-008-009-plan.md` (APPROVED)
- **Session handoff (latest)**: `.harness/agents/handoffs/session-handoff-2026-03-07-b.json`
- **Previous handoff**: `.harness/agents/handoffs/session-handoff-2026-03-07.json`
- **Knowledge tracker**: `/Users/beckhamle/Documents/Fractal_Bootcamp/weekly_projects/beckham-claudebook-main/knowledge-tracker.md`
- **Working agreement (full)**: `/Users/beckhamle/Documents/Fractal_Bootcamp/weekly_projects/beckham-claudebook-main/CLAUDE.md`
- **Slash commands**: `~/.claude/commands/`

## Key Decisions (Do NOT Re-Open)

- **Project**: Presentation chatbot, NOT receipt splitter
- **Name**: Unpack
- **LLM**: Anthropic Claude Sonnet 4.6 (upgraded from Haiku 4.5 for reliable tool use — TASK-008)
- **Cost strategy**: Prompt caching (90% savings on system prompt), full conversation history, max_tokens 4096
- **Slide format**: Model outputs typed JSON (not HTML). Frontend renders JSON → HTML via CSS design system. 5 layouts v1, 2 themes x 4 accents. Client-side HTML export.
- **Niche**: Software engineers presenting their work
- **Package manager**: bun (NOT npm/npx). Use `bun run`, `bun add`, `bunx` — never `npm`, `npx`, or `yarn`
- **Priority order**: System prompt → Infrastructure → Validation → UI transformation

## Git Workflow (ALL Instances Must Follow)

### Branch Rules
- One task per branch: `task/<number>-<short-name>`
- Rebase on `main` before opening PR: `git fetch origin && git rebase origin/main`
- Never force push to `main`
- Delete task branch after PR merges (remote + local)

### Commit Convention
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Keep commits atomic — one logical change per commit

### Task Claiming (Multi-Instance Coordination)
- `.harness/tasks/` is tracked in git — this is the source of truth for task status
- **Before starting a task:** pull `main`, check the task file status. If it's `in-progress` or `done`, do NOT pick it up.
- **To claim a task:** update its status to `in-progress` in the JSON file, commit to `main`, and push. THEN create your task branch and start work.
- Only the main orchestrating instance writes to `.harness/tasks/`. Sub-instances report back; they do not update task files directly.

### Task Lifecycle (MANDATORY — follow in order, no skipping)

Every task goes through these gates. Each gate requires explicit approval from Beckham before proceeding to the next. Do NOT collapse gates or assume approval.

1. **PICK** — Claim the task: update status to `in-progress` in `.harness/tasks/`, commit to `main`, push.
2. **PLAN** — Present a flat step-by-step plan (files to change, what each step does). **GATE: Stop and wait for Beckham to approve the plan.** Do not write any code until approved.
3. **MODE** — Confirm working mode (Direct/Design/Learn). Default to what's in the task file.
4. **EXECUTE** — Create task branch. Implement the approved plan. Commit as you go.
5. **CODE REVIEW** — Run build (`bunx vite build`). Then run `/simplify` which launches three parallel review agents (code reuse, code quality, efficiency) against the diff. Fix all High/Medium issues; skip overengineering suggestions with a note. **GATE: Do not proceed until review passes.**
6. **PR** — Rebase on `main`, push branch, open PR via `gh pr create` (title: `TASK-XXX: <description>`, body: summary + acceptance criteria checklist). **GATE: Beckham reviews and merges on GitHub.**
7. **CLOSE** — After merge: delete branch (remote + local), update task status to `done`, commit to `main`, push.

**Never merge directly to main. Every task ships through a PR.**
**Never skip a gate. "Yes" to the plan is not "yes" to execute — wait for explicit go-ahead at each gate.**

## Agent Conduct Rules (ALL Agents Must Follow)

- **Genuinely evaluate alternatives before dismissing them.** When Beckham or anyone suggests a library, tool, or approach, do NOT anchor on your initial framing and dismiss it. Actually evaluate the suggestion on its merits — check the ecosystem, consider how it compounds with other tasks, and compare it honestly to the current plan. If you can't articulate a concrete, specific reason against it, you don't have one. Lazy pattern-matching ("that's a delivery tool, not a design tool") is not evaluation. Ask yourself: "Am I dismissing this because I already committed to a different approach?"
- **Verify third-party UI instructions against current docs.** Never give dashboard navigation steps (Supabase, AWS Console, Google Cloud, etc.) from training data alone. These UIs change frequently. Search the web or official docs first to confirm the current layout before telling Beckham where to click.
- **Surface all security-critical artifacts.** Any time an agent creates, moves, or relies on a security-sensitive file (SSH keys, .pem files, API keys, certificates, credentials), explicitly tell Beckham: what it is, where it lives, and why it matters. These are NOT implementation details — they are operational knowledge the system owner needs. This applies even in Direct mode.
- **Security checklist on infra tasks.** Any task involving secrets, credentials, server config, or deployment must include a security review as part of code review. Check: file permissions on secrets (600, not 644/664), no secrets in git history, no shell expansion risks in scripts handling credentials, security headers in web server config, and principle of least privilege on IAM roles and firewall rules. "Does it work?" is not enough — "is it secure?" is mandatory.

## Operational Gotchas (ALL Agents Must Follow)

- **Never background a server process.** Starting a server with `&` leaves it hogging the port after the test. If the user then runs `bun run dev`, the stale process serves old content silently. Always run servers in the foreground, or kill them immediately after testing. Before telling the user to start a server, check `lsof -i :<port>`.
- **Streaming error cascade.** If an Anthropic stream errors, the user message is already saved but the assistant message is not — leaving consecutive user messages in DB. Anthropic rejects non-alternating messages, so every subsequent request fails. The fix is in `src/server/main.ts`: fallback assistant message on error + message history sanitization before sending to Anthropic.
- **Supabase direct DB connection is IPv6-only.** The hostname `db.xxx.supabase.co:5432` has no IPv4 A record. EC2 default VPC has no IPv6 connectivity. Use the Supabase connection pooler (`pooler.supabase.com:6543`) instead, or enable IPv6 on the VPC.
- **Google OAuth rejects raw IPs and AWS hostnames.** Must use a registered domain. AWS `*.amazonaws.com` subdomains are on the Public Suffix List and rejected by Google's OAuth validation.
- **deploy.sh heredoc and special chars.** If DB passwords contain `$`, the unquoted heredoc in deploy.sh could expand shell variables. SSM stores literal values but the heredoc substitution happens after command expansion.

## Manual Prereqs (Beckham Must Do)

- [ ] Enable Google OAuth in Supabase dashboard
- [ ] Configure Google Cloud Console OAuth consent screen + credentials
- [ ] Ensure `ANTHROPIC_API_KEY` is set in `.env` (Haiku 4.5)
- [ ] Add Supabase redirect URI for OAuth callback

## CSS & UI Gotchas (ALL Agents Must Follow)

- **CSS variables are hex, not HSL channels.** The `:root` variables in `App.css` are defined as hex values (e.g. `--muted: #252222`). Never wrap them in `hsl()` — `hsl(#252222)` is invalid CSS that browsers silently drop, making styles invisible. Use `var(--muted)` directly. For opacity variants use `color-mix(in srgb, var(--muted) 50%, transparent)`.
- **Dropdowns inside `overflow-y-auto` containers get clipped.** Any absolutely-positioned dropdown inside the slide scroll area (or any `overflow: auto/hidden` parent) will be invisible or cut off. Use `createPortal(menu, document.body)` with `position: fixed` and calculate position from `getBoundingClientRect()` on the trigger element. This applies to any popover, tooltip, or dropdown rendered inside a scrollable container.
- **Portaled elements must use inline styles, not CSS classes.** Elements rendered via `createPortal` to `document.body` sit outside the normal component tree. CSS classes can be unreliable due to Tailwind's global resets (`button { color: inherit; background: transparent; }`) winning on specificity or cascade order. Use inline React `style` props for all visibility-critical properties (color, background, border, z-index, position) on portaled content.
- **Check z-index stacking across sibling trees before adding overlays.** `.slide-inner` in `slides.css` has `z-index: 10`. Any overlay positioned alongside `.slide` must have a HIGHER z-index (e.g. `z-20`) because `.slide` has `position: relative` without its own z-index — meaning `.slide-inner`'s z-index escapes and competes in the parent stacking context. When adding positioned overlays next to slides, always trace the full z-index chain: parent stacking context → which children participate → who wins.
- **Visually verify UI changes before marking done.** A passing `vite build` only proves the code compiles — it says nothing about whether styles render correctly or interactions work. For any UI task, the CODE REVIEW gate must include running the dev server and manually testing the changed components in the browser. "It builds" is not "it works."

## UI Debugging Protocol (ALL Agents Must Follow)

When Beckham reports a UI bug, do NOT guess-and-commit in a loop. Follow this protocol:

1. **Classify the symptom first.** "Can't see it" (rendering/CSS) vs "can't click it" (pointer-events/z-index/stacking) vs "clicks but nothing happens" (JS logic) are three completely different bugs. Ask Beckham to clarify if the report is ambiguous.
2. **Ask for DevTools evidence before writing code.** Request: right-click → Inspect Element → what element is on top? What styles are computed? Is the element in the DOM at all? This takes 10 seconds and eliminates 90% of guesswork.
3. **One hypothesis, one fix, one test.** Never stack speculative fixes. If fix #1 doesn't work, revert it and investigate further — don't layer fix #2 on top of a broken fix #1. Compounding speculative fixes creates complexity that makes the real bug harder to find.
4. **Never add architectural complexity (portals, inline styles, new abstractions) as a debugging tactic.** If the simple version doesn't work, the complex version won't either — you just don't understand the problem yet. Diagnose first, then pick the simplest fix that addresses the actual cause.
