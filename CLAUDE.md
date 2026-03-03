# Week 5 — Unpack: Presentation Chatbot

## Current State

**EXECUTING.** Per-task branching strategy. On `main`, clean state. Remote: `https://github.com/BeckhamLe/unpack`

**TASK-001** done (prompt caching). Merged to main.

**Next:** TASK-005 (system prompt) and TASK-003 (streaming) are unblocked and can run in parallel. TASK-002 (OAuth) still needs manual prereqs.

## What's Being Built

Unpack — an AI presentation coach that interviews users to build their presentations. Differentiator: deep conversational discovery (adaptive probing, pushback on vague thinking, domain-specific guidance for software engineers) vs every other tool's "paste prompt, get slides" approach.

## Key References

- **Implementation plan**: `PLAN.md` (APPROVED)
- **Pitch**: `unpack-pitch.md`
- **Competitive research**: `presentation-builder-research.md`
- **Session handoff**: `.harness/agents/handoffs/session-handoff-2026-03-03.json`
- **Knowledge tracker**: `/Users/beckhamle/Documents/Fractal_Bootcamp/weekly_projects/beckham-claudebook-main/knowledge-tracker.md`
- **Working agreement (full)**: `/Users/beckhamle/Documents/Fractal_Bootcamp/weekly_projects/beckham-claudebook-main/CLAUDE.md`
- **Slash commands**: `~/.claude/commands/`

## Key Decisions (Do NOT Re-Open)

- **Project**: Presentation chatbot, NOT receipt splitter
- **Name**: Unpack
- **LLM**: Anthropic Claude Haiku 4.5
- **Cost strategy**: Prompt caching (90% savings on system prompt), full conversation history, concise responses (max_tokens 300-400)
- **Niche**: Software engineers presenting their work
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

### PR Flow
1. Do work, commit to task branch
2. Rebase on latest `main`
3. Push branch to `origin`
4. Open PR via `gh pr create` — title: `TASK-XXX: <description>`, body: summary + acceptance criteria checklist
5. Beckham reviews on GitHub
6. Merge via PR (not local fast-forward)
7. Delete branch: `gh pr merge` with `--delete-branch`, then `git branch -d` locally
8. Update task status in `.harness/tasks/`

**Never merge directly to main. Every task ships through a PR.**

## Manual Prereqs (Beckham Must Do)

- [ ] Enable Google OAuth in Supabase dashboard
- [ ] Configure Google Cloud Console OAuth consent screen + credentials
- [ ] Ensure `ANTHROPIC_API_KEY` is set in `.env` (Haiku 4.5)
- [ ] Add Supabase redirect URI for OAuth callback
