# Week 5 — Unpack: Presentation Chatbot

## Current State

**EXECUTING.** Per-task branching strategy. On `main`, clean state. Remote: `https://github.com/BeckhamLe/unpack`

**Done:** TASK-001 (prompt caching), TASK-003 (streaming), TASK-005 (system prompt — PR #1 open).

**Next:** TASK-002 (OAuth — needs manual prereqs), TASK-004 (UI polish — blocked by TASK-002), TASK-006 (deploy — blocked by 002, 004).

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

### PR Flow
1. Claim the task (see above)
2. Create task branch, do work, commit
3. Rebase on latest `main`
4. Push branch to `origin`
5. Open PR via `gh pr create` — title: `TASK-XXX: <description>`, body: summary + acceptance criteria checklist
6. Beckham reviews on GitHub
7. Merge via PR (not local fast-forward)
8. Delete branch: `gh pr merge` with `--delete-branch`, then `git branch -d` locally
9. Update task status to `done` in `.harness/tasks/`, commit, push to `main`

**Never merge directly to main. Every task ships through a PR.**

## Manual Prereqs (Beckham Must Do)

- [ ] Enable Google OAuth in Supabase dashboard
- [ ] Configure Google Cloud Console OAuth consent screen + credentials
- [ ] Ensure `ANTHROPIC_API_KEY` is set in `.env` (Haiku 4.5)
- [ ] Add Supabase redirect URI for OAuth callback
