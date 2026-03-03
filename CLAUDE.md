# Week 5 — Unpack: Presentation Chatbot

## Current State

**PLAN APPROVED.** 9 task files written to `.harness/tasks/`. Execution phase active on branch `feat/unpack-polish`.

**Next up:** TASK-001 (Gemini API swap) and TASK-002 (Google OAuth) can run in parallel. TASK-002 is blocked on Beckham's manual prereqs (Supabase OAuth config, Gemini API key).

## What's Being Built

Unpack — an AI presentation coach that interviews users to build their presentations. Differentiator: deep conversational discovery (adaptive probing, pushback on vague thinking, domain-specific guidance for software engineers) vs every other tool's "paste prompt, get slides" approach.

## Key References

- **Implementation plan**: `PLAN.md` (APPROVED)
- **Pitch**: `unpack-pitch.md`
- **Competitive research**: `presentation-builder-research.md`
- **Session handoff**: `.harness/agents/handoffs/session-handoff-2026-03-02.json`
- **Knowledge tracker**: `/Users/beckhamle/Documents/Fractal_Bootcamp/weekly_projects/beckham-claudebook-main/knowledge-tracker.md`
- **Working agreement (full)**: `/Users/beckhamle/Documents/Fractal_Bootcamp/weekly_projects/beckham-claudebook-main/CLAUDE.md`
- **Slash commands**: `~/.claude/commands/`

## Key Decisions (Do NOT Re-Open)

- **Project**: Presentation chatbot, NOT receipt splitter
- **Name**: Unpack
- **LLM**: Google Gemini (free tier) replacing Anthropic
- **Niche**: Software engineers presenting their work
- **Priority order**: System prompt → Infrastructure → Validation → UI transformation

## Manual Prereqs (Beckham Must Do)

- [ ] Enable Google OAuth in Supabase dashboard
- [ ] Configure Google Cloud Console OAuth consent screen + credentials
- [ ] Get a Google Gemini API key
- [ ] Add Supabase redirect URI for OAuth callback
